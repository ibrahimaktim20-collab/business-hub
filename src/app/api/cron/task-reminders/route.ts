import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Windows: [minutesBefore, label] — 0 = morning-of (9 AM)
const WINDOWS = [
  { minutesBefore: 0, key: 'morning', label: 'morning' },
  { minutesBefore: 180, key: '3h', label: '3 hours' },
  { minutesBefore: 120, key: '2h', label: '2 hours' },
  { minutesBefore: 60, key: '1h', label: '1 hour' },
  { minutesBefore: 30, key: '30m', label: '30 minutes' },
]

// Returns true if `now` is within a ±15-minute window of the target time
function isNear(targetMs: number, nowMs: number) {
  return Math.abs(targetMs - nowMs) <= 15 * 60 * 1000
}

export async function GET(request: Request) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  if (request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = Date.now()
  const nowDate = new Date(now)

  // Fetch tasks due today or tomorrow that aren't done
  const today = nowDate.toISOString().split('T')[0]
  const tomorrow = new Date(now + 86400000).toISOString().split('T')[0]

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, user_id, title, due_date, due_time')
    .in('due_date', [today, tomorrow])
    .neq('status', 'done')

  if (!tasks?.length) return NextResponse.json({ sent: 0 })

  // Determine which notification window(s) fire right now for each task
  type Firing = { task: typeof tasks[0]; windowKey: string; title: string; body: string }
  const firing: Firing[] = []

  for (const task of tasks) {
    for (const win of WINDOWS) {
      if (win.minutesBefore === 0) {
        // Morning-of notification: fires at 9:00 AM on due_date (regardless of due_time)
        const dueDay = new Date(`${task.due_date}T09:00:00`)
        if (isNear(dueDay.getTime(), now)) {
          const hasDueTime = task.due_time
          firing.push({
            task,
            windowKey: win.key,
            title: 'Task due today',
            body: hasDueTime ? `${task.title} — due at ${task.due_time}` : task.title,
          })
        }
      } else {
        // Skip tasks without a specific time — can't compute X hours before
        if (!task.due_time) continue
        const dueAt = new Date(`${task.due_date}T${task.due_time}:00`)
        const target = dueAt.getTime() - win.minutesBefore * 60 * 1000
        if (isNear(target, now)) {
          firing.push({
            task,
            windowKey: win.key,
            title: `Due in ${win.label}`,
            body: task.title,
          })
        }
      }
    }
  }

  if (!firing.length) return NextResponse.json({ sent: 0, checked: tasks.length })

  // Deduplication: check task_notifications table
  const dedupKeys = firing.map(f => `${f.task.id}::${f.windowKey}::${today}`)
  const { data: already } = await supabase
    .from('task_notifications')
    .select('dedup_key')
    .in('dedup_key', dedupKeys)

  const sentKeys = new Set((already ?? []).map((r: { dedup_key: string }) => r.dedup_key))

  const toSend = firing.filter(f => !sentKeys.has(`${f.task.id}::${f.windowKey}::${today}`))
  if (!toSend.length) return NextResponse.json({ sent: 0, deduped: firing.length })

  // Fetch push subscriptions for relevant users
  const userIds = [...new Set(toSend.map(f => f.task.user_id))]
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, subscription')
    .in('user_id', userIds)

  let sent = 0
  const stale: string[] = []
  const newDedupKeys: string[] = []

  for (const { task, windowKey, title, body } of toSend) {
    const userSubs = subs?.filter(s => s.user_id === task.user_id) ?? []
    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify({ title, body, url: '/tasks' }))
        sent++
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) stale.push(sub.endpoint)
      }
    }
    newDedupKeys.push(`${task.id}::${windowKey}::${today}`)
  }

  // Record sent notifications for deduplication
  if (newDedupKeys.length) {
    await supabase.from('task_notifications').insert(
      newDedupKeys.map(key => ({ dedup_key: key }))
    )
  }

  // Clean up stale subscriptions
  if (stale.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', stale)
  }

  return NextResponse.json({ sent, fired: toSend.length })
}
