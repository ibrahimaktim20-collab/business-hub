'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, FileText, Users,
  Key, FolderOpen, LogOut, ChevronDown, Plus, Trash2, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace, WORKSPACE_COLORS } from '@/hooks/useWorkspace'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/passwords', label: 'Passwords', icon: Key },
  { href: '/files', label: 'Files', icon: FolderOpen },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { workspaces, activeWorkspace, setActiveWorkspaceId, createWorkspace, deleteWorkspace } = useWorkspace()
  const workspace = activeWorkspace()
  const [signingOut, setSigningOut] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0])
  const [creating, setCreating] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    await createWorkspace(newName.trim(), newColor)
    setCreating(false)
    setNewName('')
    setNewColor(WORKSPACE_COLORS[0])
    setNewOpen(false)
  }

  return (
    <>
      <aside className="flex h-screen w-60 flex-col border-r border-zinc-200 bg-white fixed left-0 top-0 z-40">
        {/* Workspace switcher */}
        <div className="p-3 border-b border-zinc-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-zinc-50 transition-colors text-left group">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: workspace?.color ?? '#6366f1' }}
                >
                  {workspace?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{workspace?.name ?? 'No workspace'}</p>
                  <p className="text-xs text-zinc-400 truncate">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => setActiveWorkspaceId(w.id)}
                  className="flex items-center gap-2 group"
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: w.color }}
                  >
                    {w.name[0]?.toUpperCase()}
                  </div>
                  <span className="flex-1 truncate text-sm">{w.name}</span>
                  {workspace?.id === w.id && <Check className="h-3.5 w-3.5 text-zinc-400" />}
                  <button
                    onClick={e => { e.stopPropagation(); deleteWorkspace(w.id) }}
                    className="opacity-0 group-hover:opacity-100 ml-1 text-zinc-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setNewOpen(true)} className="gap-2 text-zinc-500">
                <Plus className="h-4 w-4" /> New workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-zinc-100">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* New Workspace Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Workspace name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div>
              <p className="text-xs text-zinc-500 mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {WORKSPACE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: color, outline: newColor === color ? `3px solid ${color}` : 'none', outlineOffset: '2px' }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}