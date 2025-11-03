import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Sun, Moon } from 'lucide-react'

export default function Header({ onOpenCategories, theme = 'light', setTheme }) {
  const { user, logout } = useAuth()

  return (
    <header className="bg-gradient-to-r from-white to-white border-b">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{background: 'linear-gradient(135deg,var(--color-primary), var(--color-accent))'}}>C</div>
          <div>
            <div className="text-xl font-semibold">Compta</div>
            <div className="text-xs text-gray-500">Your simple finance companion</div>
          </div>
        </div>

        <nav className="text-sm text-gray-600 hidden md:flex gap-6 items-center">
          <a href="#/" className="hover:text-gray-900">Home</a>
          <a href="#/dashboard" className="hover:text-gray-900">Dashboard</a>
          <a href="#/transactions" className="hover:text-gray-900">Transactions</a>
          <a href="#/invest" className="hover:text-gray-900">Invest</a>
          <button onClick={() => onOpenCategories && onOpenCategories()} className="btn btn-ghost">Categories</button>
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => { if (setTheme) setTheme(theme === 'dark' ? 'light' : 'dark') }} title="Toggle theme" className="btn btn-ghost">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user && <div className="text-sm text-gray-700 hidden sm:block">{user.email}</div>}
          <button onClick={async () => { try { await logout() } catch (e) { console.error(e) } }} className="btn btn-ghost">Logout</button>
        </div>
      </div>
    </header>
  )
}
