import React, { useEffect, useState, useRef } from 'react'
import Header from './components/Header'
import CategoriesManager from './components/CategoriesManager'
import SalaryInput from './components/SalaryInput'
import Expenses from './components/Expenses'
import Incomes from './components/Incomes'
import Dashboard from './components/Dashboard'
import Agenda from './components/Agenda'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { auth } from './firebase'
import AuthPage from './components/AuthPage'
import { loadState, saveState } from './utils/storage'

const STORAGE_KEY = 'compta:v1'

export default function App() {
  // Wrap app with AuthProvider and gate access
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  )
}

function InnerApp() {
  const { user, loading, logout } = useAuth()
  // Agenda view state: month/year currently viewed and selected date (ISO yyyy-mm-dd)
  const today = new Date()
  const [agendaView, setAgendaView] = useState({ year: today.getFullYear(), month: today.getMonth(), selectedDate: null })

  const handleAgendaMonthChange = (year, month) => {
    // when changing month, persist current month's non-recurring items into monthly map,
    // then load new month's items into state.expenses/state.incomes alongside recurring ones.
    const prevKey = `${agendaView.year}-${String(agendaView.month+1).padStart(2,'0')}`
    const newKey = `${year}-${String(month+1).padStart(2,'0')}`

    // extract non-recurring items that belong to prevKey from state and save
    setState(s => {
      const recurringExpenses = (Array.isArray(s.expenses) ? s.expenses : []).filter(e => e.recurring)
      const prevMonthExpenses = (Array.isArray(s.expenses) ? s.expenses : []).filter(e => {
        if (e.recurring) return false
        const k = monthKeyForDate(e.date)
        return k === prevKey
      })
      const remainingExpenses = (Array.isArray(s.expenses) ? s.expenses : []).filter(e => e.recurring || monthKeyForDate(e.date) !== prevKey)

      const recurringIncomes = (Array.isArray(s.incomes) ? s.incomes : []).filter(i => i.recurring)
      const prevMonthIncomes = (Array.isArray(s.incomes) ? s.incomes : []).filter(i => {
        if (i.recurring) return false
        const k = monthKeyForDate(i.date)
        return k === prevKey
      })
      const remainingIncomes = (Array.isArray(s.incomes) ? s.incomes : []).filter(i => i.recurring || monthKeyForDate(i.date) !== prevKey)

      // merge prevMonthExpenses into monthly map
        setMonthly(m => ({
          expenses: { ...m.expenses, [prevKey]: [ ...(m.expenses[prevKey] || []), ...prevMonthExpenses ] },
          incomes: { ...m.incomes, [prevKey]: [ ...(m.incomes[prevKey] || []), ...prevMonthIncomes ] }
        }))

      // Now load new month's items from monthly map (we'll read latest monthly via closure in next set)
      return { ...s, expenses: remainingExpenses, incomes: remainingIncomes }
    })

    // after persisting, load new month's items and set selectedDate to null
    setTimeout(() => {
      const m = loadState(STORAGE_KEY + ':monthly') || { expenses: {}, incomes: {} }
      const newExpenses = (m.expenses && m.expenses[newKey]) ? m.expenses[newKey] : []
      const newIncomes = (m.incomes && m.incomes[newKey]) ? m.incomes[newKey] : []
      setState(s => ({ ...s, expenses: [ ...(s.expenses.filter(e => e.recurring)), ...newExpenses ], incomes: [ ...(s.incomes.filter(i => i.recurring)), ...newIncomes ] }))
      setAgendaView(v => ({ ...v, year, month, selectedDate: null }))
    }, 50)
  }
  const handleAgendaDateSelect = (dateKey) => {
    setAgendaView(v => ({ ...v, selectedDate: dateKey }))
  }

  // monthly storage for non-recurring items per YYYY-MM
  const [monthly, setMonthly] = useState(() => {
    const raw = loadState(STORAGE_KEY + ':monthly') || {}
    return raw && raw.expenses && raw.incomes ? raw : { expenses: {}, incomes: {} }
  })

  // categories (persisted)
  const [categories, setCategories] = useState(() => {
    const raw = loadState(STORAGE_KEY + ':categories')
    return Array.isArray(raw) && raw.length ? raw : ['Rent','Groceries','Transport','Utilities','Entertainment','Subscriptions','Other']
  })

  // normalize and persist categories. addCategory enforces trimming and case-insensitive uniqueness.
  const addCategory = (c) => {
    const name = String(c || '').trim()
    if (!name) return
    setCategories(cs => {
      const base = Array.isArray(cs) ? cs : []
      // avoid case-insensitive duplicates
      if (base.find(x => x.toLowerCase() === name.toLowerCase())) return base
      return [...base, name]
    })
  }

  useEffect(() => {
    saveState(STORAGE_KEY + ':categories', categories)
  }, [categories])

  // categories manager modal
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)

  const renameCategory = (oldName, newName) => {
    if (!oldName || !newName || oldName === newName) return
    setCategories(cs => cs.map(c => (c === oldName ? newName : c)))
    // update existing entries in main state
    setState(s => ({
      ...s,
      expenses: (s.expenses || []).map(e => e.category === oldName ? { ...e, category: newName } : e),
      incomes: (s.incomes || []).map(i => i.category === oldName ? { ...i, category: newName } : i)
    }))
    // update monthly buckets
    setMonthly(m => {
      const upd = { expenses: {}, incomes: {} }
      for (const k of Object.keys(m.expenses || {})) {
        upd.expenses[k] = (m.expenses[k] || []).map(e => e.category === oldName ? { ...e, category: newName } : e)
      }
      for (const k of Object.keys(m.incomes || {})) {
        upd.incomes[k] = (m.incomes[k] || []).map(i => i.category === oldName ? { ...i, category: newName } : i)
      }
      return upd
    })
  }

  const deleteCategory = (oldName, replacement) => {
    if (!oldName) return
    setCategories(cs => (cs || []).filter(c => c !== oldName))
    if (replacement) {
      // replace in state entries
      setState(s => ({
        ...s,
        expenses: (s.expenses || []).map(e => e.category === oldName ? { ...e, category: replacement } : e),
        incomes: (s.incomes || []).map(i => i.category === oldName ? { ...i, category: replacement } : i)
      }))
      setMonthly(m => {
        const upd = { expenses: {}, incomes: {} }
        for (const k of Object.keys(m.expenses || {})) {
          upd.expenses[k] = (m.expenses[k] || []).map(e => e.category === oldName ? { ...e, category: replacement } : e)
        }
        for (const k of Object.keys(m.incomes || {})) {
          upd.incomes[k] = (m.incomes[k] || []).map(i => i.category === oldName ? { ...i, category: replacement } : i)
        }
        return upd
      })
    }
  }

  useEffect(() => {
    saveState(STORAGE_KEY + ':monthly', monthly)
  }, [monthly])

  const monthKeyForDate = (isoDate) => {
    if (!isoDate) return null
    // isoDate is expected in YYYY-MM-DD or an ISO string. Safely parse YYYY-MM-DD without timezone shifts.
    const s = String(isoDate).slice(0,10)
    const parts = s.split('-')
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      if (!isNaN(y) && !isNaN(m)) return `${y}-${String(m).padStart(2,'0')}`
    }
    return null
  }
  const [state, setState] = useState(() => {
    const raw = loadState(STORAGE_KEY) || {}
    return {
      salary: Number(raw.salary || 0),
      expenses: Array.isArray(raw.expenses) ? raw.expenses : [], // ensure array
      incomes: Array.isArray(raw.incomes) ? raw.incomes : [] // ensure array
    }
  })

  useEffect(() => {
    saveState(STORAGE_KEY, state)
  }, [state])

  const setSalary = (salary) => setState(s => ({ ...s, salary }))
  const addExpense = (expense) => {
    // if no date provided and user has a selected date in agenda, default to that
    const e = { ...expense }
    if ((!e.date || e.date === null) && agendaView.selectedDate) {
      // store date as YYYY-MM-DD (date-only) to avoid timezone shifts
      e.date = agendaView.selectedDate
    }
    // if non-recurring and date belongs to another month, store in monthly bucket
    if (!e.recurring) {
      const key = monthKeyForDate(e.date)
      const currentKey = `${agendaView.year}-${String(agendaView.month+1).padStart(2,'0')}`
      if (key && key !== currentKey) {
        setMonthly(m => ({ ...m, expenses: { ...m.expenses, [key]: [ ...(m.expenses[key] || []), e ] } }))
        return
      }
    }
    setState(s => ({ ...s, expenses: [e, ...(Array.isArray(s.expenses) ? s.expenses : [])] }))
  }
  const updateExpense = (id, patch) => setState(s => ({ ...s, expenses: (Array.isArray(s.expenses) ? s.expenses : []).map(e => e.id === id ? { ...e, ...patch } : e) }))
  const removeExpense = (id) => setState(s => ({ ...s, expenses: (Array.isArray(s.expenses) ? s.expenses : []).filter(e => e.id !== id) }))
  const addIncome = (income) => {
    const i = { ...income }
    if ((!i.date || i.date === null) && agendaView.selectedDate) {
      // store date as YYYY-MM-DD (date-only) to avoid timezone shifts
      i.date = agendaView.selectedDate
    }
    if (!i.recurring) {
      const key = monthKeyForDate(i.date)
      const currentKey = `${agendaView.year}-${String(agendaView.month+1).padStart(2,'0')}`
      if (key && key !== currentKey) {
        setMonthly(m => ({ ...m, incomes: { ...m.incomes, [key]: [ ...(m.incomes[key] || []), i ] } }))
        return
      }
    }
    setState(s => ({ ...s, incomes: [i, ...(Array.isArray(s.incomes) ? s.incomes : [])] }))
  }
  const updateIncome = (id, patch) => setState(s => ({ ...s, incomes: (Array.isArray(s.incomes) ? s.incomes : []).map(i => i.id === id ? { ...i, ...patch } : i) }))
  const removeIncome = (id) => setState(s => ({ ...s, incomes: (Array.isArray(s.incomes) ? s.incomes : []).filter(i => i.id !== id) }))

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return <AuthPage />
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header onOpenCategories={() => setShowCategoriesManager(true)} />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section id="overview" className="bg-white p-6 rounded shadow-sm">
          <h1 className="text-2xl font-semibold">Welcome — your personal finance dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Enter your salary, incomes and expenses to see what you can save and potential ways to invest it.</p>
        </section>

        <section id="inputs" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <SalaryInput salary={state.salary} onSave={setSalary} />
            <Incomes
                incomes={state.incomes}
                onAdd={addIncome}
                onUpdate={updateIncome}
                onRemove={removeIncome}
                categories={categories}
                onAddCategory={addCategory}
              />
          </div>

          <div className="md:col-span-2">
            <Expenses
              expenses={state.expenses}
              onAdd={addExpense}
              onUpdate={updateExpense}
              onRemove={removeExpense}
              categories={categories}
              onAddCategory={addCategory}
            />
          </div>
        </section>

        <section id="dashboard">
          <Dashboard salary={state.salary} expenses={state.expenses} incomes={state.incomes} />
          <Agenda
            expenses={state.expenses}
            incomes={state.incomes}
            viewYear={agendaView.year}
            viewMonth={agendaView.month}
            selectedDate={agendaView.selectedDate}
            onMonthChange={handleAgendaMonthChange}
            onDateSelect={handleAgendaDateSelect}
          />
        </section>

  <footer className="text-center text-sm text-gray-500">Data is stored locally in your browser. Protect your device to keep your data safe.</footer>
      </main>
    </div>
  )
}

// render categories manager modal if requested
function CategoriesManagerHost({ show, onClose, categories, onAddCategory, onRenameCategory, onDeleteCategory }) {
  if (!show) return null
  const CM = require('./components/CategoriesManager').default
  return <CM categories={categories} onClose={onClose} onAddCategory={onAddCategory} onRenameCategory={onRenameCategory} onDeleteCategory={onDeleteCategory} />
}
