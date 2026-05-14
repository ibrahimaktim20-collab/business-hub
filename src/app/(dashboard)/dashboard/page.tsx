'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCompany } from '@/hooks/useCompany'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { CheckSquare, Key, Clock, CheckCircle2 } from 'lucide-react'
import type { Task, PasswordEntry } from '@/types/database'

const PRIORITY_VARIANT: Record<string, 'destructive' | 'warning' | 'secondary'> = { high: 'destructive', medium: 'warning', low: 'secondary' }
const STATUS_VARIANT: Record<string, 'secondary' | 'info' | 'success'> = { todo: 'secondary', in_progress: 'info', done: 'success' }

export default function DashboardPage() {
  const { activeCompany } = useCompany()
  const company = activeCompany()
  const [tasks, setTasks] = useState<Task[]>([])
  const [passwords, setPasswords] = useState<PasswordEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!company.id) return
      setLoading(true)
      const supabase = createClient()
      const [t, p] = await Promise.all([
        supabase.from('tasks').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('passwords').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
      ])
      setTasks(t.data ?? [])
      setPasswords(p.data ?? [])
      setLoading(false)
    }
    load()
  }, [company.id])

  const openTasks = tasks.filter(t => t.status !== 'done').length
  const doneTasks = tasks.filter(t => t.status === 'done').length

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <CheckSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Open Tasks</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{loading ? '—' : openTasks}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Done</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{loading ? '—' : doneTasks}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      <p className={`text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {task.due_date && (
                          <p className="text-xs text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatDate(task.due_date)}
                          </p>
                        )}
                        <Badge variant={STATUS_VARIANT[task.status]}>{task.status.replace('_', ' ')}</Badge>
                        <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Passwords */}
          <Card>
            <CardHeader>
              <CardTitle>Saved Passwords</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
              ) : passwords.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No passwords saved yet</p>
              ) : (
                <div className="space-y-2">
                  {passwords.slice(0, 6).map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                        <Key className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{p.site_name}</p>
                        <p className="text-xs text-zinc-400 truncate">{p.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}