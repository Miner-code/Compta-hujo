import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Sun, Moon } from 'lucide-react'
import ThemeSelector from './ThemeSelector'

export default function Header({ onOpenCategories, theme = 'light', setTheme }) {
  const { user, logout } = useAuth()

  return (
    <header className="glass-strong border-b">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold" style={{background: 'linear-gradient(135deg,var(--color-primary), var(--color-accent))'}}>C</div>
            <div>
              <div className="apple-logo">Compta</div>
              <div className="text-xs muted">Finance product • Manage money</div>
            </div>
          </div>
        </div>

        <nav className="text-sm muted hidden md:flex gap-6 items-center">
          <a href="#/" className="hover:text-gray-900">Home</a>
          <a href="#/dashboard" className="hover:text-gray-900">Dashboard</a>
          <a href="#/transactions" className="hover:text-gray-900">Transactions</a>
          <a href="#/invest" className="hover:text-gray-900">Invest</a>
          <button onClick={() => onOpenCategories && onOpenCategories()} className="btn btn-ghost">Categories</button>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeSelector theme={theme} setTheme={setTheme} />
          <button onClick={() => { if (setTheme) setTheme(theme === 'dark' ? 'light' : 'dark') }} title="Basculer thème" className="btn btn-ghost" aria-pressed={theme === 'dark'}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user && <div className="text-sm muted hidden sm:block">{user.email}</div>}
          <button onClick={async () => { try { await logout() } catch (e) { console.error(e) } }} className="btn btn-ghost">Logout</button>
        </div>
      </div>
    </header>
  )
}
