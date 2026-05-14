import Link from 'next/link'
import { Building2, CheckSquare, FileText, Users, Key, FolderOpen, LayoutDashboard, Shield } from 'lucide-react'

const features = [
  { icon: LayoutDashboard, title: 'Dashboard', description: 'Get a live overview of tasks, invoices, and activity at a glance.' },
  { icon: CheckSquare, title: 'Tasks', description: 'Track to-dos with priorities, due dates, and status boards.' },
  { icon: FileText, title: 'Invoices', description: 'Create and manage invoices. Track paid, sent, and overdue.' },
  { icon: Users, title: 'Customers', description: 'Keep all your client contacts and notes in one place.' },
  { icon: Key, title: 'Passwords', description: 'Store logins securely with your workspace — no third-party vaults.' },
  { icon: FolderOpen, title: 'Files', description: 'Upload and organize files in folders, accessible anywhere.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">Business Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-zinc-900 text-white px-4 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Shield className="h-3.5 w-3.5" />
          Your data, your workspace
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-2xl leading-tight">
          Run your business from one place
        </h1>
        <p className="text-zinc-500 text-lg mt-4 max-w-xl">
          Tasks, invoices, customers, passwords, and files — all in a single workspace that works on every device.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link href="/signup" className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-zinc-700 transition-colors">
            Create free account
          </Link>
          <Link href="/login" className="border border-zinc-200 text-zinc-700 px-6 py-3 rounded-xl font-medium hover:bg-zinc-50 transition-colors">
            Sign in
          </Link>
        </div>
        <p className="text-xs text-zinc-400 mt-4">Free to use · Works on iPhone as an app · No credit card needed</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-24 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="border border-zinc-100 rounded-2xl p-5 hover:border-zinc-200 hover:shadow-sm transition-all">
              <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center mb-3">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-zinc-500 text-sm">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Business Hub
      </footer>
    </div>
  )
}