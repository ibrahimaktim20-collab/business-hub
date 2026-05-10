'use client'

import { useCompany } from '@/hooks/useCompany'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title: string
  children?: React.ReactNode
}

export function TopBar({ title, children }: TopBarProps) {
  const { activeCompany } = useCompany()
  const company = activeCompany()

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-100">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        <p className={cn('text-xs font-medium', company.textColor)}>{company.fullName}</p>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
