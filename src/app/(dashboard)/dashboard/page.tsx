'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCompany } from '@/hooks/useCompany'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckSquare, FileText, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import type { Task, Invoice, Customer } from '@/types/database'

const PRIORITY_COLORS = { high: 'destructive', medium: 'warning', low: 'secondary' } as const
const STATUS_COLORS = {
  todo: 'secondary', in_progress: 'info', done: 'success',
  draft: 'secondary', sent: 'info', paid: 'success', overdue: 'destructive',
} as const

export default function DashboardPage() {
  const { activeCompany } = useCompany()
  const company = activeCompany()
  const [tasks, setTasks] = useState<Task[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const [t, inv, cust] = await Promise.all([
        supabase.from('tasks').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('customers').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
      ])
      setTasks(t.data ?? [])
      setInvoices(inv.data ?? [])
      setCustomers(cust.data ?? [])
      setLoading(false)
    }
    load()
  }, [company.id])

  const openTasks = tasks.filter(t => t.status !== 'done').length
  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.status !== 'draft' ? i.amount : 0), 0)
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={CheckSquare} label="Open Tasks" value={openTasks} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={FileText} label="Invoiced" value={formatCurrency(totalInvoiced)} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard icon={Users} label="Customers" value={customers.length} color="text-violet-600" bg="bg-violet-50" />
          <StatCard icon={AlertCircle} label="Overdue" value={overdueCount} color="text-red-600" bg="bg-red-50" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} />)}</div>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {formatDate(task.due_date)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <Badge variant={STATUS_COLORS[task.status]}>{task.status.replace('_', ' ')}</Badge>
                        <Badge variant={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} />)}</div>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No invoices yet</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{inv.customer_name}</p>
                        <p className="text-xs text-zinc-400">{inv.invoice_number} · {formatDate(inv.issue_date)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-zinc-900">{formatCurrency(inv.amount, inv.currency)}</p>
                        <Badge variant={STATUS_COLORS[inv.status]} className="mt-0.5">{inv.status}</Badge>
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

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: string | number; color: string; bg: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium">{label}</p>
            <p className="text-lg font-bold text-zinc-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Skeleton() {
  return <div className="h-12 rounded-lg bg-zinc-100 animate-pulse" />
}
