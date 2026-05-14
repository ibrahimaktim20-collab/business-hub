import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const { data: tasks } = await supabase
    .from('tasks')
    .select('user_id, title, due_date')
    .in('due_date', [today, tomorrow])
    .neq('status', 'done')

  if (!tasks?.length) return NextResponse.json({ sent: 0 })

  const userIds = [...new Set(tasks.map(t => t.user_id))]
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, subscription')
    .in('user_id', userIds)

  let sent = 0
  const stale: string[] = []

  for (const userId of userIds) {
    const userTasks = tasks.filter(t => t.user_id === userId)
    const userSubs = subs?.filter(s => s.user_id === userId) ?? []

    const todayTasks = userTasks.filter(t => t.due_date === today)
    const tomorrowTasks = userTasks.filter(t => t.due_date === tomorrow)

    let title = 'Task reminder'
    let body = ''
    if (todayTasks.length === 1) {
      title = 'Due today'
      body = todayTasks[0].title
    } else if (todayTasks.length > 1) {
      title = `${todayTasks.length} tasks due today`
      body = todayTasks.map(t => t.title).join(', ')
    } else if (tomorrowTasks.length === 1) {
      title = 'Due tomorrow'
      body = tomorrowTasks[0].title
    } else {
      title = `${tomorrowTasks.length} tasks due tomorrow`
      body = tomorrowTasks.map(t => t.title).join(', ')
    }

    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify({ title, body, url: '/tasks' }))
        sent++
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) stale.push(sub.endpoint)
      }
    }
  }

  if (stale.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', stale)
  }

  return NextResponse.json({ sent })
}