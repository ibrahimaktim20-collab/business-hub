'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, FileText, Users,
  Key, FolderOpen, LogOut, ChevronDown, Plus,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompany } from '@/hooks/useCompany'
import { COMPANIES } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const { activeCompanyId, setActiveCompany, activeCompany } = useCompany()
  const company = activeCompany()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-200 bg-white fixed left-0 top-0 z-40">
      {/* Company switcher */}
      <div className="p-3 border-b border-zinc-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-zinc-50 transition-colors text-left group">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-white text-sm font-bold flex-shrink-0', company.bgColor)}>
                {company.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{company.name}</p>
                <p className="text-xs text-zinc-400 truncate">{company.fullName}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COMPANIES.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setActiveCompany(c.id)}
                className={cn(activeCompanyId === c.id && 'bg-zinc-50')}
              >
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-md text-white text-xs font-bold flex-shrink-0', c.bgColor)}>
                  {c.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{c.fullName}</p>
                </div>
                {activeCompanyId === c.id && (
                  <div className={cn('h-2 w-2 rounded-full flex-shrink-0', c.bgColor)} />
                )}
              </DropdownMenuItem>
            ))}
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

      {/* Bottom: company color bar + sign out */}
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
  )
}
