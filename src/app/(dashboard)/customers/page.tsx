'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useCompany } from '@/hooks/useCompany'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Plus, Users, Search, Mail, Phone, Building2, Pencil, Trash2 } from 'lucide-react'
import type { Customer } from '@/types/database'

const EMPTY: Partial<Customer> = { name: '', email: '', phone: '', company: '', notes: '' }

export default function CustomersPage() {
  const { activeCompany } = useCompany()
  const company = activeCompany()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<Partial<Customer>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('customers').select('*').eq('company_id', company.id).order('name')
    setCustomers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [company.id])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setForm(c)
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name?.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('customers').update({ ...form }).eq('id', editing.id)
    } else {
      await supabase.from('customers').insert({ ...form, company_id: company.id, user_id: user!.id } as any)
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('customers').delete().eq('id', id)
    setCustomers(prev => prev.filter(c => c.id !== id))
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500']

  return (
    <div>
      <TopBar title="Customers">
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" />New Customer</Button>
      </TopBar>

      <div className="p-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input placeholder="Search customers…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No customers found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((cust, i) => (
              <Card key={cust.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-bold flex-shrink-0 ${COLORS[i % COLORS.length]}`}>
                      {getInitials(cust.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{cust.name}</p>
                      {cust.company && <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5"><Building2 className="h-3 w-3" />{cust.company}</p>}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                        {cust.email && <span className="text-xs text-zinc-400 flex items-center gap-1"><Mail className="h-3 w-3" />{cust.email}</span>}
                        {cust.phone && <span className="text-xs text-zinc-400 flex items-center gap-1"><Phone className="h-3 w-3" />{cust.phone}</span>}
                      </div>
                      {cust.last_contacted && (
                        <p className="text-xs text-zinc-400 mt-1">Last contact: {formatDate(cust.last_contacted)}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(cust)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(cust.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {cust.notes && <p className="text-xs text-zinc-400 mt-3 border-t border-zinc-100 pt-2 line-clamp-2">{cust.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input placeholder="John Smith" value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input placeholder="Acme Corp" value={form.company ?? ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+1 555 000 0000" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Last Contacted</Label>
              <Input type="date" value={form.last_contacted ?? ''} onChange={e => setForm(f => ({ ...f, last_contacted: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Any notes about this customer…" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Customer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
