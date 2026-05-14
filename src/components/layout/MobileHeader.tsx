'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Check, Trash2 } from 'lucide-react'
import { useWorkspace, WORKSPACE_COLORS } from '@/hooks/useWorkspace'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function MobileHeader() {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace, deleteWorkspace } = useWorkspace()
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) ?? workspaces[0]

  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    await createWorkspace(newName.trim(), newColor)
    setNewName('')
    setNewColor(WORKSPACE_COLORS[0])
    setCreating(false)
    setSaving(false)
    setOpen(false)
  }

  return (
    <div className="md:hidden">
      {/* Header bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-4 h-12 flex items-center">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 rounded-xl py-1.5 px-2 hover:bg-zinc-50 transition-colors"
        >
          <div
            className="h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: activeWorkspace?.color ?? '#6366f1' }}
          >
            {activeWorkspace?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="text-sm font-semibold text-zinc-900">{activeWorkspace?.name ?? 'No workspace'}</span>
          <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown sheet */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => { setOpen(false); setCreating(false) }} />
          <div className="fixed top-12 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className="p-3 space-y-1">
              {workspaces.map(w => (
                <div key={w.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => { setActiveWorkspaceId(w.id); setOpen(false) }}
                    className="flex-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-zinc-50 text-left transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: w.color }}>
                      {w.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-zinc-900 flex-1">{w.name}</span>
                    {activeWorkspace?.id === w.id && <Check className="h-4 w-4 text-zinc-400" />}
                  </button>
                  <button
                    onClick={() => deleteWorkspace(w.id)}
                    className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {creating ? (
              <div className="border-t border-zinc-100 p-4 space-y-3">
                <Input
                  placeholder="Workspace name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
                <div className="flex gap-2 flex-wrap">
                  {WORKSPACE_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: newColor === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={!newName.trim() || saving} className="flex-1">
                    {saving ? 'Creating…' : 'Create'}
                  </Button>
                  <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-zinc-100 p-3">
                <button
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New workspace
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}