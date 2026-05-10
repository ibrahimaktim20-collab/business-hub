import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Main content */}
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
