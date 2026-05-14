export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Workspace {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  company_id: string
  user_id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  due_time?: string
  created_at: string
}

export interface Invoice {
  id: string
  company_id: string
  user_id: string
  invoice_number: string
  customer_name: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issue_date: string
  due_date: string
  notes?: string
  created_at: string
}

export interface Customer {
  id: string
  company_id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  last_contacted?: string
  created_at: string
}

export interface PasswordEntry {
  id: string
  company_id: string
  user_id: string
  site_name: string
  url?: string
  username: string
  password: string
  notes?: string
  created_at: string
}

export interface FileFolder {
  id: string
  company_id: string
  user_id: string
  name: string
  parent_id?: string
  created_at: string
}

export interface FileItem {
  id: string
  company_id: string
  user_id: string
  folder_id?: string
  name: string
  size: number
  type: string
  storage_path: string
  created_at: string
}