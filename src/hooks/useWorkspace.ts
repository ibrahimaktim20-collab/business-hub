'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { Workspace } from '@/types/database'

export const WORKSPACE_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899',
]

interface WorkspaceStore {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  loading: boolean
  initialized: boolean
  setActiveWorkspaceId: (id: string) => void
  fetchWorkspaces: () => Promise<void>
  createWorkspace: (name: string, color: string) => Promise<Workspace | null>
  deleteWorkspace: (id: string) => Promise<void>
  activeWorkspace: () => Workspace | null
}

export const useWorkspace = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      loading: false,
      initialized: false,

      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),

      activeWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get()
        return workspaces.find(w => w.id === activeWorkspaceId) ?? workspaces[0] ?? null
      },

      fetchWorkspaces: async () => {
        set({ loading: true })
        const supabase = createClient()
        const { data } = await supabase.from('workspaces').select('*').order('created_at')
        set({ workspaces: data ?? [], loading: false, initialized: true })
      },

      createWorkspace: async (name, color) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        const { data } = await supabase
          .from('workspaces')
          .insert({ name, color, user_id: user.id })
          .select()
          .single()
        if (data) {
          set(state => ({
            workspaces: [...state.workspaces, data],
            activeWorkspaceId: state.activeWorkspaceId ?? data.id,
          }))
        }
        return data
      },

      deleteWorkspace: async (id) => {
        const supabase = createClient()
        await supabase.from('workspaces').delete().eq('id', id)
        set(state => {
          const workspaces = state.workspaces.filter(w => w.id !== id)
          const activeWorkspaceId = state.activeWorkspaceId === id
            ? (workspaces[0]?.id ?? null)
            : state.activeWorkspaceId
          return { workspaces, activeWorkspaceId }
        })
      },
    }),
    {
      name: 'workspace-store',
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    }
  )
)