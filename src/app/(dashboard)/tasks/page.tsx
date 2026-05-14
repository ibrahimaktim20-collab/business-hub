'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useCompany } from '@/hooks/useCompany'
import { createClient } from '@/lib/supabase/client'
import { formatDate, cn } from '@/lib/utils'
import { Plus, Clock, Pencil, Trash2, CheckCircle2, Circle, Loader, Search } from 'lucide-react'
import type { Task } from '@/types/database'

type Status = Task['status']
type Priority = Task['priority']

const STATUS_LABELS: Record<Status, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const STATUS_VARIANT: Record<Status, 'secondary' | 'info' | 'success'> = { todo: 'secondary', in_progress: 'info', done: 'success' }
const PRIORITY_VARIANT: Record<Priority, 'destructive' | 'warning' | 'secondary'> = { high: 'destructive', medium: 'warning', low: 'secondary' }
const STATUS_ICON: Record<Status, React.ElementType> = { todo: Circle, in_progress: Loader, done: CheckCircle2 }

const EMPTY: Partial<Task> = { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', due_time: '' }

export default function TasksPage() {
  const { activeCompany } = useCompany()
  const company = activeCompany()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState<Partial<Task>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks').select('*').eq('company_id', company.id)
      .order('created_at', { ascending: false })
    setTasks(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [company.id])

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY, company_id: company.id })
    setOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setForm(task)
    setOpen(true)
  }

  async function handleSave() {
    if (!form.title?.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('tasks').update({ ...form }).eq('id', editing.id)
    } else {
      await supabase.from('tasks').insert({ ...form, company_id: company.id, user_id: user!.id } as any)
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function toggleStatus(task: Task) {
    const next: Status = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'
    const supabase = createClient()
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
  }

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  const groups: Record<Status, Task[]> = { todo: [], in_progress: [], done: [] }
  filtered.forEach(t => groups[t.status].push(t))

  return (
    <div>
      <TopBar title="Tasks">
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" />New Task</Button>
      </TopBar>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input placeholder="Search tasks…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
            {(['all', 'todo', 'in_progress', 'done'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  filterStatus === s ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['todo', 'in_progress', 'done'] as Status[]).map(status => {
              const group = groups[status]
              if (filterStatus !== 'all' && filterStatus !== status) return null
              if (group.length === 0) return null
              const Icon = STATUS_ICON[status]
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn('h-4 w-4', status === 'done' ? 'text-emerald-500' : status === 'in_progress' ? 'text-blue-500' : 'text-zinc-400')} />
                    <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{STATUS_LABELS[status]}</h2>
                    <span className="text-xs text-zinc-400">({group.length})</span>
                  </div>
                  <div className="grid gap-2">
                    {group.map(task => (
                      <Card key={task.id} className={cn('transition-opacity overflow-hidden', task.status === 'done' && 'opacity-60')}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <button onClick={() => toggleStatus(task)} className="mt-0.5 flex-shrink-0 text-zinc-300 hover:text-zinc-600 transition-colors">
                              <Icon className={cn('h-5 w-5', task.status === 'done' && 'text-emerald-500', task.status === 'in_progress' && 'text-blue-500')} />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words', task.status === 'done' && 'line-through text-zinc-400')}>{task.title}</p>
                              {task.description && <p className="text-xs text-zinc-500 mt-0.5 break-words">{task.description}</p>}
                              {task.due_date && (
                                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {formatDate(task.due_date)}{task.due_time ? ` at ${task.due_time}` : ''}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
                                <Badge variant={STATUS_VARIANT[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                                <div className="ml-auto flex gap-1">
                                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(task)}><Pencil className="h-3.5 w-3.5" /></Button>
                                  <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(task.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Task Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="Task title" value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Add details…" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date ?? ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Time</Label>
                <Input type="time" value={form.due_time ?? ''} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Task'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
