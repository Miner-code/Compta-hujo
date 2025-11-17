import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function ChartPopup({ expenses = [], incomes = [], salary = 0, onClose = () => {} }) {
  // Colors: expenses (red), incomes (green), savings (neutral)
  const expenseColor = '#ef4444'
  const incomeColor = '#10b981'
  const savingsColor = '#6b7280'

  const modalRef = useRef(null)
  const previousActiveRef = useRef(null)

  // Toggles for what to show
  const [showExpenses, setShowExpenses] = useState(true)
  const [showIncomes, setShowIncomes] = useState(true)
  const [showSavings, setShowSavings] = useState(true)

  useEffect(() => {
    // Save active element and trap focus
    previousActiveRef.current = document.activeElement
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus first focusable in modal
    const timer = setTimeout(() => {
      const el = modalRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (el) el.focus()
    }, 0)

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Tab') {
        // Basic focus trap
        const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = bodyOverflow
      // restore previous focus
      try { previousActiveRef.current?.focus() } catch (e) {}
    }
  }, [onClose])

  function formatCurrency(v) {
    const n = Number(v || 0)
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Aggregate by category
  const entries = useMemo(() => {
    const map = new Map()
    let totalExpenses = 0
    for (const e of expenses || []) {
      const key = e.category || e.name || 'Autre'
      const amt = Number(e.amount || 0)
      totalExpenses += amt
      const prev = map.get(key) || { label: key, expense: 0, income: 0 }
      prev.expense += amt
      map.set(key, prev)
    }

    let totalIncome = Number(salary || 0)
    for (const i of incomes || []) {
      const key = i.category || i.name || 'Revenu divers'
      const amt = Number(i.amount || 0)
      totalIncome += amt
      const prev = map.get(key) || { label: key, expense: 0, income: 0 }
      prev.income += amt
      map.set(key, prev)
    }

    const saving = Math.max(0, totalIncome - totalExpenses)
    if (saving > 0) {
      map.set('Épargne', { label: 'Épargne', expense: 0, income: saving, isSavings: true })
    }

    return Array.from(map.values()).map((e) => ({ ...e, total: (e.expense || 0) + (e.income || 0) }))
      .sort((a, b) => (b.total || 0) - (a.total || 0))
  }, [expenses, incomes, salary])

  const visible = useMemo(() => {
    return entries.filter(e => {
      if (e.isSavings) return showSavings && (e.income || 0) > 0
      const hasExpense = (e.expense || 0) > 0
      const hasIncome = (e.income || 0) > 0
      if (!showExpenses && !showIncomes) return false
      if (showExpenses && showIncomes) return hasExpense || hasIncome
      if (showExpenses) return hasExpense
      return showIncomes && hasIncome
    })
  }, [entries, showExpenses, showIncomes, showSavings])

  const maxTotal = Math.max(1, ...visible.map(v => v.total || 0))

  function downloadCSV() {
    const headers = ['label', 'expense', 'income', 'total']
    const rows = entries.map(e => [e.label, e.expense || 0, e.income || 0, e.total || 0])
    const csv = [headers.join(',')].concat(rows.map(r => r.map(v => {
      const s = String(v == null ? '' : v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    a.download = `compta-histogram-${now}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-8">
      <div className="fixed inset-0 bg-black bg-opacity-40" aria-hidden />
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="chart-popup-title" className="relative w-full max-w-2xl md:max-w-3xl bg-white rounded shadow-lg ring-1 ring-black/5 overflow-hidden max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
          <h2 id="chart-popup-title" className="text-lg font-medium">Histogramme — répartition</h2>
          <div className="flex items-center gap-2">
            <button type="button" className={`px-2 py-1 text-sm rounded ${showExpenses ? 'bg-red-100' : 'bg-gray-100'}`} onClick={() => setShowExpenses(s => !s)} aria-pressed={showExpenses}>Dépenses</button>
            <button type="button" className={`px-2 py-1 text-sm rounded ${showIncomes ? 'bg-green-100' : 'bg-gray-100'}`} onClick={() => setShowIncomes(s => !s)} aria-pressed={showIncomes}>Revenus</button>
            <button type="button" className={`px-2 py-1 text-sm rounded ${showSavings ? 'bg-gray-200' : 'bg-gray-100'}`} onClick={() => setShowSavings(s => !s)} aria-pressed={showSavings}>Épargne</button>
            <button aria-label="Fermer" onClick={onClose} className="ml-3 px-3 py-1 bg-gray-100 rounded">Fermer</button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 64px)' }}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <svg viewBox={`0 0 600 ${visible.length * 44 + 40}`} width="100%" height={Math.max(160, visible.length * 44 + 40)} role="img" aria-label="Histogramme des catégories">
                {/* ticks */}
                {Array.from({ length: 5 }).map((_, ti) => {
                  const frac = ti / 4
                  const x = 120 + frac * (440)
                  const tv = Math.round(frac * maxTotal)
                  return (
                    <g key={`tick-${ti}`}>
                      <line x1={x} y1={8} x2={x} y2={8 + visible.length * 44} stroke="#e5e7eb" strokeWidth={1} />
                      <text x={x} y={Math.max(visible.length * 44, 120) + 20} textAnchor="middle" fontSize={11} fill="#6b7280">{tv}</text>
                    </g>
                  )
                })}

                {/* bars: draw income (green) and expense (red) portions separately; savings in neutral */}
                {visible.map((e, i) => {
                  const y = 12 + i * 44
                  const incomeVal = Number(e.income || 0)
                  const expenseVal = Number(e.expense || 0)
                  const totalVal = Math.max(1, incomeVal + expenseVal)
                  const incomeWidth = Math.max(0, (incomeVal / maxTotal) * 440)
                  const expenseWidth = Math.max(0, (expenseVal / maxTotal) * 440)
                  const barWidth = Math.max(6, ((e.total || 0) / maxTotal) * 440)
                  return (
                    <g key={e.label}>
                      <text x={8} y={y + 14} fontSize={13} fill="#111" >{e.label}</text>
                      {e.isSavings ? (
                        <rect x={120} y={y} width={barWidth} height={24} rx={6} fill={savingsColor} />
                      ) : (
                        // Draw income first (green), then expense (red) next to it
                        <g>
                          {incomeWidth > 0 && (
                            <rect x={120} y={y} width={incomeWidth} height={24} rx={6} fill={incomeColor} />
                          )}
                          {expenseWidth > 0 && (
                            <rect x={120 + incomeWidth} y={y} width={expenseWidth} height={24} rx={6} fill={expenseColor} />
                          )}
                        </g>
                      )}
                      <text x={120 + barWidth + 8} y={y + 16} fontSize={12} fill="#111">{formatCurrency(e.total)}</text>
                    </g>
                  )
                })}
              </svg>
            </div>

            <aside className="md:w-96">
              <div className="text-sm text-gray-600 mb-2">Légende & résumé</div>
              <ul className="space-y-2 mb-4">
                {entries.map((e, i) => {
                  const totalShown = e.total || 0
                  if (totalShown <= 0) return null
                  const swatch = e.isSavings ? savingsColor : ((e.expense || 0) >= (e.income || 0) ? expenseColor : incomeColor)
                  // Legend swatch: show gradient split when both expense and income exist
                  const incomeVal = Number(e.income || 0)
                  const expenseVal = Number(e.expense || 0)
                  const percentIncome = Math.round((incomeVal / (e.total || 1)) * 100)
                  const swatchStyle = e.isSavings
                    ? { width: 20, height: 20, background: savingsColor, borderRadius: 4, border: '1px solid #ddd' }
                    : (incomeVal > 0 && expenseVal > 0)
                      ? { width: 20, height: 20, background: `linear-gradient(to right, ${incomeColor} 0% ${percentIncome}%, ${expenseColor} ${percentIncome}% 100%)`, borderRadius: 4, border: '1px solid #ddd' }
                      : { width: 20, height: 20, background: incomeVal > 0 ? incomeColor : expenseColor, borderRadius: 4, border: '1px solid #ddd' }

                  return (
                    <li key={i} className="flex items-center gap-3">
                      <div aria-hidden style={swatchStyle} />
                      <div className="flex-1">
                        <div className="font-medium">{e.label}</div>
                        <div className="text-xs text-gray-500">{e.expense ? `${formatCurrency(e.expense)} dép` : ''}{e.expense && e.income ? ' · ' : ''}{e.income ? `${formatCurrency(e.income)} rev` : ''}</div>
                      </div>
                      <div className="font-semibold">{formatCurrency(totalShown)}</div>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-2">
                <table className="w-full text-sm table-fixed">
                  <caption className="sr-only">Résumé des données</caption>
                  <thead>
                    <tr className="text-left text-xs text-gray-600"><th>Catégorie</th><th>Dép</th><th>Rev</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {entries.map((e, i) => {
                      const totalShown = e.total || 0
                      if (totalShown <= 0) return null
                      return (
                        <tr key={i} className="border-t"><td className="py-1">{e.label}</td><td className="py-1">{formatCurrency(e.expense)}</td><td className="py-1">{formatCurrency(e.income)}</td><td className="py-1 font-semibold">{formatCurrency(totalShown)}</td></tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={downloadCSV} className="px-3 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400">Exporter en CSV</button>
                <button onClick={onClose} className="px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-400">Fermer</button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
