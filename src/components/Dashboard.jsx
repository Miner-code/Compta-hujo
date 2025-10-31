import React, { useMemo, useState, useEffect } from 'react'
import { computeMonthlyTotals } from '../utils/calculations'
import { fetchTopCryptoGainers } from '../services/market'
import PieChart from './PieChart'
import { suggestInvestments } from '../utils/investment'
import ExpensePie from './ExpensePie'
import { loadState, saveState } from '../utils/storage'
import { v4 as uuidv4 } from 'uuid'

export default function Dashboard({ salary = 0, expenses = [], incomes = [] }) {
  const [includeFuture, setIncludeFuture] = useState(true)
  const totals = useMemo(() => computeMonthlyTotals(salary, expenses, incomes, { includeFuture }), [salary, expenses, incomes, includeFuture])
  const [topCryptos, setTopCryptos] = useState([])
  const [loadingCryptos, setLoadingCryptos] = useState(false)
  const [cryptoError, setCryptoError] = useState(null)
  const [investments, setInvestments] = useState(null)
  const [selectedRisk, setSelectedRisk] = useState('moderate')
  const investmentPlan = useMemo(() => suggestInvestments(totals.savings, { risk: selectedRisk }), [totals.savings, selectedRisk])
  const SCHEDULE_KEY = 'compta:v1:scheduledInvestments'
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduled, setScheduled] = useState([])
  const [schedAmount, setSchedAmount] = useState(investmentPlan.total || 0)
  const [schedDate, setSchedDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    d.setDate(1)
    return d.toISOString().slice(0,10)
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

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h2 className="text-lg font-medium mb-2">Dashboard</h2>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <div>Monthly salary</div>
          <div className="font-semibold">€{salary.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
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
          <div>Known future incomes</div>
          <div className="font-semibold">€{totals.futureIncome.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        </div>

        <div className="flex justify-between text-sm">
          <div>Known future expenses</div>
          <div className="font-semibold">€{totals.futureExpense.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
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
              labels={['Expenses this month', 'Future expenses', 'Projected savings']}
              values={[totals.expenseThisMonth || 0, totals.futureExpense || 0, Math.max(0, totals.savings) || 0]}
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
                            <div className="text-xs text-gray-500">Date: {s.date ? new Date(s.date).toLocaleDateString() : '—'}</div>
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
      
      {/* Expenses by category pie */}
      <div className="mt-6">
        <ExpensePie expenses={expenses} incomes={incomes} salary={salary} />
      </div>
    </div>
  )
}
