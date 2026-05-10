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
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, FileText, Search, Pencil, Trash2 } from 'lucide-react'
import type { Invoice } from '@/types/database'

type Status = Invoice['status']
const STATUS_VARIANT: Record<Status, 'secondary' | 'info' | 'success' | 'destructive'> = {
  draft: 'secondary', sent: 'info', paid: 'success', overdue: 'destructive',
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'CAD']
const EMPTY: Partial<Invoice> = { invoice_number: '', customer_name: '', amount: 0, currency: 'USD', status: 'draft', issue_date: '', due_date: '', notes: '' }

export default function InvoicesPage() {
  const { activeCompany } = useCompany()
  const company = activeCompany()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [form, setForm] = useState<Partial<Invoice>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('invoices').select('*').eq('company_id', company.id).order('created_at', { ascending: false })
    setInvoices(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [company.id])

  function openNew() {
    setEditing(null)
    const today = new Date().toISOString().split('T')[0]
    setForm({ ...EMPTY, issue_date: today })
    setOpen(true)
  }

  function openEdit(inv: Invoice) {
    setEditing(inv)
    setForm(inv)
    setOpen(true)
  }

  async function handleSave() {
    if (!form.customer_name?.trim() || !form.invoice_number?.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('invoices').update({ ...form }).eq('id', editing.id)
    } else {
      await supabase.from('invoices').insert({ ...form, company_id: company.id, user_id: user!.id } as any)
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('invoices').delete().eq('id', id)
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  const filtered = invoices.filter(i => {
    const matchSearch = i.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      i.invoice_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || i.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.amount, 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <TopBar title="Invoices">
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" />New Invoice</Button>
      </TopBar>

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Paid" value={formatCurrency(totalPaid)} color="text-emerald-600" bg="bg-emerald-50" />
          <SummaryCard label="Pending" value={formatCurrency(totalPending)} color="text-blue-600" bg="bg-blue-50" />
          <SummaryCard label="Overdue" value={formatCurrency(totalOverdue)} color="text-red-600" bg="bg-red-50" />
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input placeholder="Search invoices…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5 p-1 bg-white rounded-lg border border-zinc-200">
            {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === s ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice list */}
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No invoices found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(inv => (
              <Card key={inv.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 flex-shrink-0">
                      <FileText className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-900">{inv.customer_name}</p>
                        <span className="text-xs text-zinc-400">{inv.invoice_number}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Issued {formatDate(inv.issue_date)} · Due {formatDate(inv.due_date)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-zinc-900">{formatCurrency(inv.amount, inv.currency)}</p>
                      <Badge variant={STATUS_VARIANT[inv.status]} className="mt-1">{inv.status}</Badge>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(inv)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(inv.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Invoice # *</Label>
                <Input placeholder="INV-001" value={form.invoice_number ?? ''} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['draft', 'sent', 'paid', 'overdue'] as const).map(s => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input placeholder="Customer or company name" value={form.customer_name ?? ''} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" min="0" step="0.01" value={form.amount ?? ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency ?? 'USD'} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Issue Date</Label>
                <Input type="date" value={form.issue_date ?? ''} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date ?? ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes…" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Invoice'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
