'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { useWorkspace, WORKSPACE_COLORS } from '@/hooks/useWorkspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2 } from 'lucide-react'

function FirstWorkspaceScreen({ onCreate }: { onCreate: (name: string, color: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(WORKSPACE_COLORS[0])
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    await onCreate(name.trim(), color)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 mb-4">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Create your first workspace</h1>
          <p className="text-sm text-zinc-500 mt-1">A workspace holds all your data — tasks, invoices, customers and more.</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
          <Input
            placeholder="e.g. My Business, Freelance, Personal"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div>
            <p className="text-xs text-zinc-500 mb-2">Pick a color</p>
            <div className="flex gap-2 flex-wrap">
              {WORKSPACE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? 'Creating…' : 'Create Workspace'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { fetchWorkspaces, initialized, workspaces, loading, createWorkspace } = useWorkspace()

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
      </div>
    )
  }

  if (workspaces.length === 0) {
    return <FirstWorkspaceScreen onCreate={async (name, color) => { await createWorkspace(name, color) }} />
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <MobileHeader />
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}