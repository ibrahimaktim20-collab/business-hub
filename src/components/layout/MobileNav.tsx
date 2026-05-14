'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, FileText, Users, Key, FolderOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Clients', icon: Users },
  { href: '/passwords', label: 'Passwords', icon: Key },
  { href: '/files', label: 'Files', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-0',
                isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
