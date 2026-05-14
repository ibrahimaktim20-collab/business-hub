'use client'

import { useWorkspace } from '@/hooks/useWorkspace'

interface TopBarProps {
  title: string
  children?: React.ReactNode
}

export function TopBar({ title, children }: TopBarProps) {
  const workspace = useWorkspace(s => s.activeWorkspace)()

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-100">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        {workspace && (
          <p className="text-xs font-medium text-zinc-400">{workspace.name}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}