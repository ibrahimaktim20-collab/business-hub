export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type CompanyId = 'beemax' | 'aktim' | 'makroteks'

export interface Company {
  id: CompanyId
  name: string
  fullName: string
  color: string
  bgColor: string
  textColor: string
  initial: string
}

export const COMPANIES: Company[] = [
  {
    id: 'beemax',
    name: 'Beemax',
    fullName: 'Beemax USA LLC',
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-600',
    initial: 'B',
  },
  {
    id: 'aktim',
    name: 'Aktim',
    fullName: 'Aktim Enterprise LLC',
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    initial: 'A',
  },
  {
    id: 'makroteks',
    name: 'Makroteks',
    fullName: 'Makroteks Textile LLC',
    color: '#8b5cf6',
    bgColor: 'bg-violet-500',
    textColor: 'text-violet-600',
    initial: 'M',
  },
]

export interface Task {
  id: string
  company_id: CompanyId
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  created_at: string
  user_id: string
}

export interface Invoice {
  id: string
  company_id: CompanyId
  invoice_number: string
  customer_name: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issue_date: string
  due_date: string
  notes?: string
  created_at: string
  user_id: string
}

export interface Customer {
  id: string
  company_id: CompanyId
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  last_contacted?: string
  created_at: string
  user_id: string
}

export interface PasswordEntry {
  id: string
  company_id: CompanyId
  site_name: string
  url?: string
  username: string
  password: string
  notes?: string
  created_at: string
  user_id: string
}

export interface FileFolder {
  id: string
  company_id: CompanyId
  name: string
  parent_id?: string
  created_at: string
  user_id: string
}

export interface FileItem {
  id: string
  company_id: CompanyId
  folder_id?: string
  name: string
  size: number
  type: string
  storage_path: string
  created_at: string
  user_id: string
}

export interface Database {
  public: {
    Tables: {
      tasks: { Row: Task; Insert: Omit<Task, 'id' | 'created_at'>; Update: Record<string, unknown>; Relationships: [] }
      invoices: { Row: Invoice; Insert: Omit<Invoice, 'id' | 'created_at'>; Update: Record<string, unknown>; Relationships: [] }
      customers: { Row: Customer; Insert: Omit<Customer, 'id' | 'created_at'>; Update: Record<string, unknown>; Relationships: [] }
      password_entries: { Row: PasswordEntry; Insert: Omit<PasswordEntry, 'id' | 'created_at'>; Update: Record<string, unknown>; Relationships: [] }
      file_folders: { Row: FileFolder; Insert: Omit<FileFolder, 'id' | 'created_at'>; Update: Record<string, unknown>; Relationships: [] }
      file_items: { Row: FileItem; Insert: Omit<FileItem, 'id' | 'created_at'>; Update: Record<string, unknown>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
