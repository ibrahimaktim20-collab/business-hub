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
import { Plus, Key, Search, Pencil, Trash2, Eye, EyeOff, Copy, Check, Globe } from 'lucide-react'
import type { PasswordEntry } from '@/types/database'

const EMPTY: Partial<PasswordEntry> = { site_name: '', url: '', username: '', password: '', notes: '' }

export default function PasswordsPage() {
  const { activeCompany } = useCompany()
  const company = activeCompany()
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PasswordEntry | null>(null)
  const [form, setForm] = useState<Partial<PasswordEntry>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showFormPassword, setShowFormPassword] = useState(false)

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('password_entries').select('*').eq('company_id', company.id).order('site_name')
    setEntries(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [company.id])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setShowFormPassword(false)
    setOpen(true)
  }

  function openEdit(entry: PasswordEntry) {
    setEditing(entry)
    setForm(entry)
    setShowFormPassword(false)
    setOpen(true)
  }

  async function handleSave() {
    if (!form.site_name?.trim() || !form.username?.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('password_entries').update({ ...form }).eq('id', editing.id)
    } else {
      await supabase.from('password_entries').insert({ ...form, company_id: company.id, user_id: user!.id } as any)
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('password_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function toggleVisible(id: string) {
    setVisibleIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function copyPassword(entry: PasswordEntry) {
    await navigator.clipboard.writeText(entry.password)
    setCopiedId(entry.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = entries.filter(e =>
    e.site_name.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase()) ||
    e.url?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <TopBar title="Passwords">
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" />New Entry</Button>
      </TopBar>

      <div className="p-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input placeholder="Search passwords…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <Key className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No passwords saved</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(entry => {
              const isVisible = visibleIds.has(entry.id)
              const isCopied = copiedId === entry.id
              return (
                <Card key={entry.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                        <Key className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">{entry.site_name}</p>
                        <p className="text-xs text-zinc-500 truncate">{entry.username}</p>
                        {entry.url && (
                          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 flex items-center gap-1 mt-0.5 hover:underline truncate">
                            <Globe className="h-3 w-3 flex-shrink-0" /><span className="truncate">{entry.url}</span>
                          </a>
                        )}
                        <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                          <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                            {isVisible ? entry.password : '••••••••'}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button size="icon-sm" variant="ghost" onClick={() => toggleVisible(entry.id)} title={isVisible ? 'Hide' : 'Show'}>
                              {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => copyPassword(entry)} title="Copy password">
                              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => openEdit(entry)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(entry.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        {entry.notes && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 break-words">{entry.notes}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Entry' : 'New Password'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Site Name *</Label>
              <Input placeholder="Google, GitHub, etc." value={form.site_name ?? ''} onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input placeholder="https://example.com" value={form.url ?? ''} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Username / Email *</Label>
              <Input placeholder="user@example.com" value={form.username ?? ''} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showFormPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password ?? ''}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes…" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}