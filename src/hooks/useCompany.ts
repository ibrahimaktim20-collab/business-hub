'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { COMPANIES, type Company, type CompanyId } from '@/types/database'

interface CompanyStore {
  activeCompanyId: CompanyId
  setActiveCompany: (id: CompanyId) => void
  activeCompany: () => Company
}

export const useCompany = create<CompanyStore>()(
  persist(
    (set, get) => ({
      activeCompanyId: 'beemax',
      setActiveCompany: (id) => set({ activeCompanyId: id }),
      activeCompany: () => COMPANIES.find(c => c.id === get().activeCompanyId) ?? COMPANIES[0],
    }),
    { name: 'active-company' }
  )
)
