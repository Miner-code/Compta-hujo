import React from 'react'

const THEMES = [
  { id: 'pro', label: 'Pro (Product)' },
  { id: 'apple', label: 'Apple (clean)' },
  { id: 'glass-light', label: 'Glass (Light)' },
  { id: 'glass-aurora', label: 'Glass (Aurora)' },
  { id: 'glass-dark', label: 'Glass (Dark)' },
  { id: 'classic', label: 'Classic' }
]

export default function ThemeSelector({ theme, setTheme }) {
  return (
    <label className="flex items-center gap-2 text-sm" aria-label="Select theme">
      <span className="sr-only">Select theme</span>
      <select
        value={theme || 'glass-light'}
        onChange={e => setTheme && setTheme(e.target.value)}
        className="border rounded px-2 py-1 bg-transparent text-sm"
        aria-label="Theme selector"
      >
        {THEMES.map(t => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
    </label>
  )
}
