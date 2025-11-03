import React, { useMemo, useState, useEffect } from 'react'
import { computeMonthlyTotals } from '../utils/calculations'
import { fetchTopCryptoGainers } from '../services/market'
import PieChart from './PieChart'
import CSVImport from './CSVImport'
import { suggestInvestments } from '../utils/investment'
import ExpensePie from './ExpensePie'
import { loadState, saveState } from '../utils/storage'
import { v4 as uuidv4 } from 'uuid'

function parseYMD(s) {
  if (!s) return null
  const str = String(s).slice(0,10)
  const parts = str.split('-')
  if (parts.length !== 3) return null
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  return { y, m, d }
}

function formatDateKeyFromYMD(y,m,d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function formatDateKey(d) {
  if (!d) return null
  if (d instanceof Date) return formatDateKeyFromYMD(d.getFullYear(), d.getMonth()+1, d.getDate())
  const ymd = parseYMD(d)
  if (ymd) return formatDateKeyFromYMD(ymd.y, ymd.m, ymd.d)
  try {
    const dt = new Date(d)
    return formatDateKeyFromYMD(dt.getFullYear(), dt.getMonth()+1, dt.getDate())
  } catch (e) { return null }
}

function parseDateToLocal(dateStr) {
  if (!dateStr) return null
  if (dateStr instanceof Date) return dateStr
  const p = parseYMD(dateStr)
  if (p) return new Date(p.y, p.m - 1, p.d)
  return new Date(dateStr)
}

export default function Dashboard({ salary = 0, expenses = [], incomes = [], initialBalance = 0 }) {
  const [includeFuture, setIncludeFuture] = useState(true)
  const [showProjectionModal, setShowProjectionModal] = useState(false)
  const totals = useMemo(() => computeMonthlyTotals(salary, expenses, incomes, { includeFuture, initialBalance }), [salary, expenses, incomes, includeFuture, initialBalance])
  const [topCryptos, setTopCryptos] = useState([])
  const [loadingCryptos, setLoadingCryptos] = useState(false)
  const [cryptoError, setCryptoError] = useState(null)
  const [investments, setInvestments] = useState(null)
  const [selectedRisk, setSelectedRisk] = useState('moderate')
  const investmentPlan = useMemo(() => suggestInvestments(totals.savings, { risk: selectedRisk }), [totals.savings, selectedRisk])
  const SCHEDULE_KEY = 'compta:v1:scheduledInvestments'
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduled, setScheduled] = useState([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [schedAmount, setSchedAmount] = useState(investmentPlan.total || 0)
  const [schedDate, setSchedDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    d.setDate(1)
    return formatDateKey(d)
  })
  const [schedRecurrence, setSchedRecurrence] = useState('monthly')

  useEffect(() => {
    const list = loadState(SCHEDULE_KEY) || []
    setScheduled(list)
  }, [])

  useEffect(() => {
    // keep amount default in sync with calculated plan when it changes
    setSchedAmount(investmentPlan.total || 0)
  }, [investmentPlan.total])

  function exportCSV() {
    const headers = ['id','type','name','amount_eur','date','category','recurring']
    const rows = []
    incomes.forEach(i => {
      rows.push({
        id: i.id,
        type: 'income',
        name: i.name || '',
        amount_eur: Number(i.amount) || 0,
        date: i.date || '',
        category: '',
        recurring: !!i.recurring
      })
    })
    expenses.forEach(e => {
      rows.push({
        id: e.id,
        type: 'expense',
        name: e.name || '',
        amount_eur: Number(e.amount) || 0,
        date: e.date || '',
        category: e.category || '',
        recurring: !!e.recurring
      })
    })

    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
      const v = r[h]
      if (v == null) return ''
      // escape double quotes
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }).join(','))).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
    a.download = `compta-transactions-${now}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function saveScheduled() {
    const amt = parseFloat(schedAmount) || 0
    if (amt <= 0) return
    const plan = {
      id: uuidv4(),
      amount: amt,
      date: schedDate || null,
      recurrence: schedRecurrence,
      risk: selectedRisk,
      createdAt: new Date().toISOString()
    }
    const next = [plan].concat(scheduled)
    setScheduled(next)
    saveState(SCHEDULE_KEY, next)
    setShowSchedule(false)
  }

  function removeScheduled(id) {
    const next = scheduled.filter(s => s.id !== id)
    setScheduled(next)
    saveState(SCHEDULE_KEY, next)
  }

  // Build itemized projection breakdown (same heuristics as computeMonthlyTotals)
  const projectionBreakdown = (() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const today = now.getDate()

    function dayOfMonthFrom(d) {
      if (!d) return null
      try { return new Date(d).getDate() } catch (e) { return null }
    }

    const incomeItems = []
    const expenseItems = []

    for (const e of expenses) {
      if (e.recurring) {
        const ds = dayOfMonthFrom(e.recurringStart)
        if (ds && ds >= today) expenseItems.push({ ...e, reason: 'recurring', day: ds })
      } else if (e.date) {
        const d = new Date(e.date)
        if (d.getFullYear() === year && d.getMonth() === month && d.getDate() >= today) {
          expenseItems.push({ ...e, reason: 'scheduled', day: d.getDate() })
        }
      }
    }

    for (const i of incomes) {
      if (i.recurring) {
        const ds = dayOfMonthFrom(i.recurringStart)
        if (ds && ds >= today) incomeItems.push({ ...i, reason: 'recurring', day: ds })
      } else if (i.date) {
        const d = new Date(i.date)
        if (d.getFullYear() === year && d.getMonth() === month && d.getDate() >= today) {
          incomeItems.push({ ...i, reason: 'scheduled', day: d.getDate() })
        }
      }
    }

    // salary heuristic: add as income item if today === 1
    if (Number(salary) && today === 1) incomeItems.unshift({ id: 'salary', name: 'Salary', amount: Number(salary), reason: 'salary', day: 1 })

    const incomeRemaining = incomeItems.reduce((s, it) => s + (Number(it.amount) || 0), 0)
    const expenseRemaining = expenseItems.reduce((s, it) => s + (Number(it.amount) || 0), 0)

    const projectedRemaining = (Number(initialBalance) || 0) + incomeRemaining - expenseRemaining

    return { incomeItems, expenseItems, incomeRemaining, expenseRemaining, projectedRemaining }
  })()

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h2 className="text-lg font-medium mb-2">Dashboard</h2>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <div>Monthly salary</div>
          <div className="font-semibold">€{salary.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        </div>

        <div className="flex justify-between text-sm">
          <div>Current account balance (entered)</div>
          <div className="font-semibold">€{(Number(initialBalance) || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        </div>

        <div className="flex justify-between text-sm">
          <div>Projected balance (end of month)</div>
          <div className="font-semibold">€{(totals.projectedRemaining || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} <button onClick={() => setShowProjectionModal(true)} className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">Détail</button></div>
        </div>

        {/* Difference between actual entered balance and projection */}
        <div className="flex justify-between text-sm">
          <div>Difference (actual − projected)</div>
          {(() => {
            const actual = Number(initialBalance) || 0
            const projected = Number(totals.projectedRemaining) || 0
            const diff = actual - projected
            const cls = diff >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
            const pct = projected === 0 ? null : (diff / projected) * 100
            return (
              <div className={cls}>
                <div>€{diff.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <div className="text-xs text-gray-500">{pct === null ? 'N/A' : (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'}</div>
              </div>
            )
          })()}
        </div>

        <div className="flex justify-between text-sm">
          <div>Income this month</div>
          <div className="font-semibold">€{totals.incomeThisMonth.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        </div>

        <div className="flex justify-between text-sm">
          <div>Expenses this month</div>
          <div className="font-semibold">€{totals.expenseThisMonth.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        </div>

        

        <div className="flex justify-between text-sm">
          <div>Projected savings</div>
          <div className="font-semibold">€{totals.savings.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        </div>
      </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeFuture} onChange={e => setIncludeFuture(e.target.checked)} />
            Include known future expenses
          </label>
        </div>

        <div className="mt-4 bg-white p-4 rounded shadow-sm">
          <h3 className="font-medium mb-2">Top cryptos (24h)</h3>
          <div className="flex gap-2 items-center mb-3">
            <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={async () => {
              setLoadingCryptos(true)
              setCryptoError(null)
              try {
                const list = await fetchTopCryptoGainers({ vs_currency: 'eur', per_page: 100, top: 5 })
                setTopCryptos(list)
              } catch (err) {
                setCryptoError('Error fetching data')
              } finally {
                setLoadingCryptos(false)
              }
            }}>{loadingCryptos ? 'Loading...' : 'Fetch top 5 cryptos'}</button>
            <div className="text-sm text-gray-500">Data from CoinGecko (free, no API key).</div>
          </div>

          {cryptoError && <div className="text-sm text-red-600 mb-2">{cryptoError}</div>}

          <ul className="space-y-2">
            {topCryptos.length === 0 && <li className="text-sm text-gray-500">No results — click the button to load.</li>}
            {topCryptos.map(c => (
              <li key={c.id} className="flex items-center justify-between border rounded p-2">
                <div className="flex items-center gap-3">
                  <img src={c.image} alt={c.name} className="w-6 h-6" />
                  <div>
                    <div className="font-medium">{c.name} <span className="text-xs text-gray-500">({c.symbol.toUpperCase()})</span></div>
                    <div className="text-xs text-gray-500">Market cap: €{(c.market_cap || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">€{c.current_price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                  <div className={"text-sm " + (c.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600')}>{c.price_change_percentage_24h.toFixed(2)}%</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

    {/* Single ergonomic investment block */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Allocation & investment suggestions</h3>
            <p className="text-sm text-gray-600 mt-1">View your current allocation and choose a risk profile to get a recommended monthly allocation.</p>

            <div className="mt-4 md:flex md:items-center md:justify-start md:gap-4">
              <div className="text-sm text-gray-600 mr-2">Risk profile:</div>
              <div className="flex gap-2">
                {['conservative','moderate','aggressive'].map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRisk(r)}
                    className={"px-3 py-1 rounded text-sm " + (selectedRisk === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700')}
                  >{r === 'conservative' ? 'Conservative' : r === 'moderate' ? 'Moderate' : 'Aggressive'}</button>
                ))}
              </div>
            </div>

              <div className="mt-4">
              <div className="text-sm text-gray-500">Projected savings this month: <span className="font-medium">€{(totals.savings || 0).toFixed(2)}</span></div>
            </div>
          </div>

          <div className="w-56 md:w-72">
            <PieChart
              labels={(() => {
                return [
                  'Savings account (liquidity)',
                  'Diversified equity ETF',
                  'Bond funds',
                  'Crypto'
                ]
              })()}
              values={(() => {
                const prefs = investmentPlan && Array.isArray(investmentPlan.suggestions) ? investmentPlan.suggestions : []
                // map suggestions into the four buckets
                const buckets = {
                  savings: 0,
                  equity: 0,
                  bond: 0,
                  crypto: 0
                }

                for (const s of prefs) {
                  const name = (s.name || '').toLowerCase()
                  const amt = Number(s.amount || 0)
                  if (name.includes('savings')) buckets.savings += amt
                  else if (name.includes('equity') || name.includes('etf') || name.includes('index') || name.includes('diversified')) buckets.equity += amt
                  else if (name.includes('bond') || name.includes('fixed income')) buckets.bond += amt
                  else if (name.includes('crypto')) buckets.crypto += amt
                  else {
                    // fallback: put unknown into equity
                    buckets.equity += amt
                  }
                }

                return [buckets.savings, buckets.equity, buckets.bond, buckets.crypto]
              })()}
            />
          </div>
        </div>

        <div className="mt-4">
          {investmentPlan.total === 0 ? (
            <div className="text-sm text-gray-500">No available savings this month to propose an allocation. Try adjusting salary/expenses.</div>
          ) : (
            <div>
              <div className="font-medium mb-2">Monthly proposal ({investmentPlan.total} €)</div>
              <div className="grid grid-cols-1 gap-2">
                {investmentPlan.suggestions.map(item => (
                  <div key={item.name} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{item.name} <span className="text-xs text-gray-500">{item.pct}%</span></div>
                      <div className="text-xs text-gray-500">{item.reason}</div>
                    </div>
                    <div className="text-sm font-semibold">€{item.amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="flex gap-2 items-start">
                  <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => setShowSchedule(true)}>Schedule this investment</button>
                  <button className="px-4 py-2 bg-gray-100 rounded" onClick={exportCSV}>Export CSV</button>
                  <button className="px-4 py-2 bg-blue-100 rounded" onClick={() => setShowImportModal(true)}>Import CSV</button>
                </div>

                {showSchedule && (
                  <div className="mt-3 border rounded p-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="text-sm text-gray-600">Amount (€)</label>
                        <input value={schedAmount} onChange={e => setSchedAmount(e.target.value)} type="number" step="0.01" className="w-full border rounded px-2 py-1" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Date</label>
                        <input value={schedDate} onChange={e => setSchedDate(e.target.value)} type="date" className="w-full border rounded px-2 py-1" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Recurrence</label>
                        <select value={schedRecurrence} onChange={e => setSchedRecurrence(e.target.value)} className="w-full border rounded px-2 py-1">
                          <option value="monthly">Monthly</option>
                          <option value="none">One-off</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={saveScheduled}>Save</button>
                      <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setShowSchedule(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                {scheduled.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">Scheduled investments</div>
                    <ul className="space-y-2">
                      {scheduled.map(s => (
                        <li key={s.id} className="flex items-center justify-between border rounded p-2">
                          <div>
                            <div className="font-medium">€{(Number(s.amount)||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})} {s.recurrence === 'monthly' ? <span className="text-xs text-gray-500">/mo</span> : <span className="text-xs text-gray-500">one-off</span>}</div>
                                              <div className="text-xs text-gray-500">Date: {s.date ? parseDateToLocal(s.date).toLocaleDateString() : '—'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-500">{s.risk}</div>
                            <button className="text-sm text-red-600" onClick={() => removeScheduled(s.id)}>Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projection details modal */}
      {showProjectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Détail du calcul — Projected balance</h3>
              <button onClick={() => setShowProjectionModal(false)} className="btn btn-ghost">Fermer</button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><div>Current account (entered)</div><div className="font-semibold">€{(Number(initialBalance)||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div></div>
              <div className="border-t pt-2">
                <div className="font-medium mb-1">Revenus restants (this month)</div>
                {projectionBreakdown.incomeItems.length === 0 && <div className="text-xs text-gray-500">Aucun</div>}
                <ul className="space-y-1">
                  {projectionBreakdown.incomeItems.map(it => (
                    <li key={it.id || it.name} className="flex justify-between">
                      <div className="text-sm">{it.name} <span className="text-xs text-gray-400">({it.reason}{it.day? ' — day '+it.day: ''})</span></div>
                      <div className="font-medium text-green-600">€{(Number(it.amount)||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between mt-2"><div className="text-xs text-gray-600">Total revenus restants</div><div className="font-semibold">€{projectionBreakdown.incomeRemaining.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div></div>
              </div>

              <div className="border-t pt-2">
                <div className="font-medium mb-1">Dépenses restantes (this month)</div>
                {projectionBreakdown.expenseItems.length === 0 && <div className="text-xs text-gray-500">Aucune</div>}
                <ul className="space-y-1">
                  {projectionBreakdown.expenseItems.map(it => (
                    <li key={it.id || it.name} className="flex justify-between">
                      <div className="text-sm">{it.name} <span className="text-xs text-gray-400">({it.reason}{it.day? ' — day '+it.day: ''})</span></div>
                      <div className="font-medium text-red-600">€{(Number(it.amount)||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between mt-2"><div className="text-xs text-gray-600">Total dépenses restantes</div><div className="font-semibold">€{projectionBreakdown.expenseRemaining.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div></div>
              </div>

              <div className="border-t pt-3">
                <div className="font-medium">Projection conservatrice (fin du mois)</div>
                <div className="mt-2 text-sm">
                  <div>Calcul détaillé :</div>
                  <div className="ml-3">initialBalance = €{(Number(initialBalance)||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                  <div className="ml-3">+ total revenus restants = €{projectionBreakdown.incomeRemaining.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                  <div className="ml-3">- total dépenses restantes = €{projectionBreakdown.expenseRemaining.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                  <div className="ml-3 font-semibold mt-2">= projection conservatrice (fin du mois) : €{projectionBreakdown.projectedRemaining.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                </div>

                <div className="mt-3 border-t pt-2">
                  <div className="flex justify-between">
                    <div>Différence (réel − projection)</div>
                    {(() => {
                      const actual = Number(initialBalance) || 0
                      const projected = Number(projectionBreakdown.projectedRemaining) || 0
                      const diff = actual - projected
                      const cls = diff >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
                      const pct = projected === 0 ? null : (diff / projected) * 100
                      return (
                        <div className={cls}>
                          <div>€{diff.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                          <div className="text-xs text-gray-500">{pct === null ? 'N/A' : (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'}</div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

              </div>

              <div className="text-xs text-gray-500">Remarque: cette projection prend seulement en compte les transactions planifiées restantes pour ce mois (voir heuristiques dans la doc).</div>
            </div>
          </div>
        </div>
      )}
      {showImportModal && (
        <CSVImport onClose={() => setShowImportModal(false)} />
      )}
      
      {/* Expenses by category pie */}
      <div className="mt-6">
        <ExpensePie expenses={expenses} incomes={incomes} salary={salary} />
      </div>
    </div>
  )
}

// Projection details modal is rendered inside Dashboard and uses the same heuristics as computeMonthlyTotals
