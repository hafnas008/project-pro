'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Toaster } from 'react-hot-toast'

const nav = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/projects', label: 'Projects', icon: '🗂️' },
  { href: '/kanban', label: 'Kanban', icon: '📋' },
  { href: '/timeline', label: 'Timeline', icon: '📅' },
  { href: '/tasks', label: 'All Tasks', icon: '✅' },
  { href: '/updates', label: 'Updates', icon: '📢' },
  { href: '/team', label: 'Team', icon: '👥' },
  { href: '/activity', label: 'Activity', icon: '🕐' },
  { href: '/reports', label: 'Reports', icon: '📈' },
]

export default function RootLayout({ children }) {
  const path = usePathname()
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" />
        <div className="flex min-h-screen">
          <aside className="w-60 fixed h-full flex flex-col" style={{background:'#1E1B4B'}}>
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold text-white" style={{background:'#7C3AED'}}>P</div>
                <div>
                  <div className="text-white font-semibold text-sm">Project Hub</div>
                  <div className="text-white/40 text-xs">Pro Edition</div>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-3 space-y-0.5">
              {nav.map(n => (
                <Link key={n.href} href={n.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${path===n.href ? 'bg-white/15 text-white font-medium' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}>
                  <span>{n.icon}</span>{n.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10">
              <div className="text-white/30 text-xs text-center">Project Hub Pro v1.0</div>
            </div>
          </aside>
          <main className="ml-60 flex-1 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  )
}
