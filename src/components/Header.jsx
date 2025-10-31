import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold">C</div>
          <div>
            <div className="text-lg font-semibold">Compta</div>
            <div className="text-xs text-gray-500">Simple money management</div>
          </div>
        </div>
        <nav className="text-sm text-gray-600 hidden md:flex gap-4 items-center">
          <a href="#overview" className="hover:underline">Overview</a>
          <a href="#transactions" className="hover:underline">Transactions</a>
          <a href="#invest" className="hover:underline">Invest</a>
        </nav>
        <div className="flex items-center gap-3">
          {user && <div className="text-sm text-gray-700 hidden sm:block">{user.email}</div>}
          <button onClick={async () => { try { await logout() } catch (e) { console.error(e) } }} className="ml-2 bg-gray-100 text-gray-700 px-3 py-1 rounded">Logout</button>
        </div>
      </div>
    </header>
  )
}
