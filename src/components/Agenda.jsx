import React, { useMemo, useState } from 'react'

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
  } catch (e) {
    return null
  }
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

export default function Agenda({ expenses = [], incomes = [], viewYear: propYear, viewMonth: propMonth, selectedDate: propSelectedDate, onMonthChange, onDateSelect }) {
  const today = new Date()
  const [localYear, setLocalYear] = useState(today.getFullYear())
  const [localMonth, setLocalMonth] = useState(today.getMonth()) // 0-indexed
  const [localSelectedDate, setLocalSelectedDate] = useState(null)

  const viewYear = typeof propYear === 'number' ? propYear : localYear
  const viewMonth = typeof propMonth === 'number' ? propMonth : localMonth
  const selectedDate = typeof propSelectedDate === 'string' ? propSelectedDate : localSelectedDate

  // Build a mapping for the currently viewed month, projecting recurring items into the month.
  const { expensesByDate, incomesByDate } = useMemo(() => {
    const eMap = {}
    const iMap = {}

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    const push = (map, key, item) => {
      if (!map[key]) map[key] = []
      map[key].push(item)
    }

    // non-recurring and recurring expenses
    ;(Array.isArray(expenses) ? expenses : []).forEach(exp => {
      if (exp.recurring) {
        // determine day-of-month for recurring event
        let day = 1
        if (exp.date) {
          const p = parseYMD(exp.date)
          day = p ? p.d : 1
        }
        // clamp
        if (day > daysInMonth) day = daysInMonth
        const key = `${viewYear.toString().padStart(4,'0')}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
        push(eMap, key, exp)
      } else if (exp.date) {
        const p = parseYMD(exp.date)
        if (p && p.y === viewYear && (p.m - 1) === viewMonth) {
          const key = formatDateKeyFromYMD(p.y, p.m, p.d)
          push(eMap, key, exp)
        }
      }
    })

    ;(Array.isArray(incomes) ? incomes : []).forEach(inc => {
      if (inc.recurring) {
        let day = 1
        if (inc.date) {
          const p = parseYMD(inc.date)
          day = p ? p.d : 1
        }
        if (day > daysInMonth) day = daysInMonth
        const key = `${viewYear.toString().padStart(4,'0')}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
        push(iMap, key, inc)
      } else if (inc.date) {
        const p = parseYMD(inc.date)
        if (p && p.y === viewYear && (p.m - 1) === viewMonth) {
          const key = formatDateKeyFromYMD(p.y, p.m, p.d)
          push(iMap, key, inc)
        }
      }
    })

    return { expensesByDate: eMap, incomesByDate: iMap }
  }, [expenses, incomes, viewYear, viewMonth])

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sunday

  const cells = []
  // leading blanks for first week
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))

  const prevMonth = () => {
    let y = viewYear
    let m = viewMonth - 1
    if (m < 0) { m = 11; y = viewYear - 1 }
    if (onMonthChange) {
      onMonthChange(y, m)
    } else {
      setLocalMonth(m); setLocalYear(y); setLocalSelectedDate(null)
    }
    if (onDateSelect) onDateSelect(null)
  }
  const nextMonth = () => {
    let y = viewYear
    let m = viewMonth + 1
    if (m > 11) { m = 0; y = viewYear + 1 }
    if (onMonthChange) {
      onMonthChange(y, m)
    } else {
      setLocalMonth(m); setLocalYear(y); setLocalSelectedDate(null)
    }
    if (onDateSelect) onDateSelect(null)
  }

  return (
    <div className="mt-6 bg-white p-4 rounded shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Agenda</h3>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 bg-gray-200 rounded" onClick={prevMonth} aria-label="Previous month">◀</button>
          <div className="text-sm font-semibold">{monthLabel(viewYear, viewMonth)}</div>
          <button className="px-2 py-1 bg-gray-200 rounded" onClick={nextMonth} aria-label="Next month">▶</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-600">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mt-2">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={idx} className="h-20 border rounded p-1 bg-gray-50" />
            const key = formatDateKey(cell)
          const dayExpenses = expensesByDate[key] || []
          const dayIncomes = incomesByDate[key] || []
          const isSelected = selectedDate === key
          return (
            <button key={key} onClick={() => { setLocalSelectedDate(key); if (onDateSelect) onDateSelect(key) }} className={`h-20 border rounded p-2 flex flex-col justify-between text-left ${isSelected ? 'ring-2 ring-blue-300' : 'hover:bg-gray-50'}`}>
              <div className="flex justify-between items-start gap-2">
                <div className="text-sm font-medium">{cell.getDate()}</div>
                <div className="flex items-center gap-1">
                  {dayIncomes.length > 0 && <div className="text-xs bg-green-600 text-white rounded px-2 py-0.5">+{dayIncomes.length}</div>}
                  {dayExpenses.length > 0 && <div className="text-xs bg-red-600 text-white rounded px-2 py-0.5">-{dayExpenses.length}</div>}
                </div>
              </div>
              <div className="text-xs text-gray-500 truncate">
                {/** show up to 2 items combined (incomes first) */}
                {dayIncomes.concat(dayExpenses).slice(0,2).map((ex, i) => (
                  <div key={i} className={`truncate ${incomesByDate[key] && incomesByDate[key].includes(ex) ? 'text-green-600' : 'text-red-600'}`}>
                    {ex.name} — {incomesByDate[key] && incomesByDate[key].includes(ex) ? '+' : '€'}{(Number(ex.amount)||0).toFixed(2)}
                  </div>
                ))}
                {(dayIncomes.length + dayExpenses.length) > 2 && <div className="text-[11px] text-gray-400">+{(dayIncomes.length + dayExpenses.length) - 2} more</div>}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {selectedDate ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Expenses for {selectedDate}</div>
              <button className="text-xs text-gray-500" onClick={() => setSelectedDate(null)}>Close</button>
            </div>
            <ul className="space-y-2">
              {(() => {
                const list = []
                ;(incomesByDate[selectedDate] || []).forEach(inc => list.push({ ...inc, __type: 'income' }))
                ;(expensesByDate[selectedDate] || []).forEach(exp => list.push({ ...exp, __type: 'expense' }))
                if (list.length === 0) return <li className="text-sm text-gray-500">No entries on this day</li>
                // sort: incomes first, then expenses
                list.sort((a,b) => (a.__type === b.__type) ? 0 : (a.__type === 'income' ? -1 : 1))
                return list.map(item => (
                  <li key={item.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.category || ''} {item.recurring ? '· Recurring' : ''}</div>
                    </div>
                    <div className={`font-semibold ${item.__type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.__type === 'income' ? '+' : '-'}€{(Number(item.amount)||0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                    </div>
                  </li>
                ))
              })()}
            </ul>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Select a day to view expenses</div>
        )}
      </div>
    </div>
  )
}
