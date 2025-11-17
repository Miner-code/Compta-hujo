import React from 'react'

const THEMES = [
  { id: 'light', label: 'Jour' },
  { id: 'dark', label: 'Nuit' }
]

export default function ThemeSelector({ theme, setTheme }) {
  return (
    <label className="flex items-center gap-2 text-sm" aria-label="Sélecteur de thème">
      <span className="sr-only">Sélecteur de thème</span>
      <select
        value={theme || 'light'}
        onChange={e => setTheme && setTheme(e.target.value)}
        className="border rounded px-2 py-1 bg-transparent text-sm"
        aria-label="Sélecteur de thème"
      >
        {THEMES.map(t => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
    </label>
  )
}
