import React, { useState } from 'react'
import ChartPopup from './ChartPopup'

// Simple SVG pie chart to avoid external deps
export default function ExpensePie({ expenses = [], incomes = [], salary = 0 }) {
  const [showPopup, setShowPopup] = useState(false)
  const expenseMap = new Map()
  let totalExpenses = 0
  for (const e of expenses) {
    const key = e.category || e.name || 'Other'
    const amt = Number(e.amount || 0)
    totalExpenses += amt
    expenseMap.set(key, (expenseMap.get(key) || 0) + amt)
  }

  const totalIncome = Number(salary || 0) + incomes.reduce((s, i) => s + Number(i.amount || 0), 0)
  const savings = Math.max(0, totalIncome - totalExpenses)

  const entries = [...expenseMap.entries()]
  if (savings > 0) entries.push(['Savings', savings])

  const total = entries.reduce((s, [, v]) => s + v, 0)
  const colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#06b6d4','#f97316','#a3a3a3']

  let cumulative = 0
  const arcs = entries.map(([label, value], idx) => {
    const start = cumulative / (total || 1)
    cumulative += value
    const end = cumulative / (total || 1)
    return { label, value, start, end, color: colors[idx % colors.length] }
  })

  const radius = 80
  const cx = 100
  const cy = 100

  function polarToCartesian(cx, cy, radius, fraction) {
    const angle = 2 * Math.PI * fraction - Math.PI / 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }

  function arcPath(startFrac, endFrac) {
    if (total === 0) return ''
    const [sx, sy] = polarToCartesian(cx, cy, radius, startFrac)
    const [ex, ey] = polarToCartesian(cx, cy, radius, endFrac)
    const large = endFrac - startFrac > 0.5 ? 1 : 0
    return `M ${cx} ${cy} L ${sx} ${sy} A ${radius} ${radius} 0 ${large} 1 ${ex} ${ey} Z`
  }

  return (
    <div className="mt-4 bg-white p-4 rounded shadow-sm">
      <h3 className="text-md font-medium mb-2">Breakdown (this month)</h3>
      <div className="flex gap-4">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {arcs.map((a, i) => (
            <path key={i} d={arcPath(a.start, a.end)} fill={a.color} stroke="#fff" strokeWidth="1" />
          ))}
        </svg>

        <div className="flex-1">
          <ul className="text-sm">
            {arcs.map((a, i) => (
              <li key={i} className="flex items-center gap-2 mb-1">
                <span style={{width:12,height:12,background:a.color,display:'inline-block'}} />
                <span className="font-medium">{a.label}</span>
                <span className="text-gray-600 ml-auto">€{Number(a.value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              </li>
            ))}
            {total === 0 && <li className="text-gray-500">No data</li>}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => setShowPopup(true)}>Ouvrir histogramme</button>
        <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => {
          const headers = ['label','value']
          const rows = arcs.map(a => [a.label, a.value])
          const csv = [headers.join(',')].concat(rows.map(r => r.map(v => {
            const s = String(v == null ? '' : v)
            if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g,'""') + '"'
            return s
          }).join(','))).join('\n')
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const now = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
          a.download = `compta-breakdown-${now}.csv`
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
        }}>Exporter CSV</button>
      </div>

      {/* Chart popup modal */}
      {showPopup && <ChartPopup expenses={expenses} incomes={incomes} salary={salary} onClose={() => setShowPopup(false)} />}
    </div>
  )
}

