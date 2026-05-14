'use client'

import { useWorkspace } from './useWorkspace'
import type { Workspace } from '@/types/database'

const FALLBACK: Workspace = { id: '', user_id: '', name: '', color: '#6366f1', created_at: '' }

export function useCompany() {
  const store = useWorkspace()
  return {
    activeCompanyId: store.activeWorkspaceId,
    setActiveCompany: store.setActiveWorkspaceId,
    activeCompany: () => store.activeWorkspace() ?? FALLBACK,
  }
}