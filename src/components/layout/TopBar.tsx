'use client'

import { useWorkspace } from '@/hooks/useWorkspace'

interface TopBarProps {
  title: string
  children?: React.ReactNode
}

export function TopBar({ title, children }: TopBarProps) {
  const workspace = useWorkspace(s => s.activeWorkspace)()

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
        {workspace && (
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{workspace.name}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}