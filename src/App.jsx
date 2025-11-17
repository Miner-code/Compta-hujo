import React, { useEffect, useState, useRef } from 'react'
import Header from './components/Header'
import CategoriesManager from './components/CategoriesManager'
import SalaryInput from './components/SalaryInput'
import InitialBalanceInput from './components/InitialBalanceInput'
import Expenses from './components/Expenses'
import Incomes from './components/Incomes'
import Dashboard from './components/Dashboard'
import HomePage from './components/pages/HomePage'
import TransactionsPage from './components/pages/TransactionsPage'
import InvestPage from './components/pages/InvestPage'
import { computeMonthlyTotals } from './utils/calculations'
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
      const m = loadState(buildKey('monthly')) || { expenses: {}, incomes: {} }
      const newExpenses = (m.expenses && m.expenses[newKey]) ? m.expenses[newKey] : []
      const newIncomes = (m.incomes && m.incomes[newKey]) ? m.incomes[newKey] : []
      setState(s => ({ ...s, expenses: [ ...(s.expenses.filter(e => e.recurring)), ...newExpenses ], incomes: [ ...(s.incomes.filter(i => i.recurring)), ...newIncomes ] }))
      setAgendaView(v => ({ ...v, year, month, selectedDate: null }))
    }, 50)
  }
  const handleAgendaDateSelect = (dateKey) => {
    setAgendaView(v => ({ ...v, selectedDate: dateKey }))
  }

  // helper to build per-user storage key (namespaced by uid when logged in)
  const buildKey = (suffix) => {
    const uidPart = user && user.uid ? `:${user.uid}` : ':public'
    return `${STORAGE_KEY}${uidPart}${suffix ? `:${suffix}` : ''}`
  }

  // monthly storage for non-recurring items per YYYY-MM
  const [monthly, setMonthly] = useState(() => {
    const raw = loadState(buildKey('monthly')) || {}
    return raw && raw.expenses && raw.incomes ? raw : { expenses: {}, incomes: {} }
  })

  // categories (persisted)
  const [categories, setCategories] = useState(() => {
    const raw = loadState(buildKey('categories'))
    // normalize older array-of-strings into objects { name, color, icon }
    const defaultNames = ['Rent','Groceries','Transport','Utilities','Entertainment','Subscriptions','Other']
    const palette = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316']
    if (Array.isArray(raw) && raw.length) {
      return raw.map((r, idx) => {
        if (typeof r === 'string') return { name: r, color: palette[idx % palette.length], icon: null }
        // already object
        return { name: r.name || String(r).trim(), color: r.color || palette[idx % palette.length], icon: r.icon || null }
      })
    }
    return defaultNames.map((n, idx) => ({ name: n, color: palette[idx % palette.length], icon: null }))
  })

  // categories are objects { name, color, icon }
  const addCategory = (c) => {
    // accept either a string or an object
    let cat = c
    if (typeof c === 'string') cat = { name: String(c).trim(), color: null, icon: null }
    if (!cat || !cat.name) return
    setCategories(cs => {
      const base = Array.isArray(cs) ? cs : []
      if (base.find(x => x.name.toLowerCase() === cat.name.toLowerCase())) return base
      // assign default color if missing
      const palette = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316']
      const filled = { name: cat.name, color: cat.color || palette[base.length % palette.length], icon: cat.icon || null }
      return [...base, filled]
    })
  }

  useEffect(() => {
    saveState(buildKey('categories'), categories)
  }, [categories])

  // categories manager modal
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const pendingSelectRef = useRef(null)

  const renameCategory = (oldName, newName) => {
    if (!oldName || !newName || oldName === newName) return
    setCategories(cs => cs.map(c => (c && c.name === oldName ? { ...c, name: newName } : c)))
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
    setCategories(cs => (cs || []).filter(c => c && c.name !== oldName))
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
    saveState(buildKey('monthly'), monthly)
  }, [monthly])

  // simple hash-based route state ("/", "/dashboard", "/transactions", "/invest")
  const [route, setRoute] = useState(() => {
    const h = (typeof window !== 'undefined' && window.location.hash) ? window.location.hash.replace(/^#/, '') : '/'
    return h || '/'
  })

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#/, '') || '/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

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
      initialBalance: Number(raw.initialBalance || 0),
      risk: raw.risk || 'moderate',
      theme: raw.theme || 'light',
      expenses: Array.isArray(raw.expenses) ? raw.expenses : [], // ensure array
      incomes: Array.isArray(raw.incomes) ? raw.incomes : [] // ensure array
    }
  })

  useEffect(() => {
    saveState(buildKey(), state)
  }, [state])

  // apply theme class to document root for CSS variables
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        // expose theme via data-theme for CSS presets
        document.documentElement.setAttribute('data-theme', state.theme || '')
        // legacy: keep dark class for existing overrides when theme contains 'dark'
        if ((state.theme || '').includes('dark')) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
      }
    } catch (e) { }
  }, [state.theme])

  // When the authenticated user changes, (re)load that user's saved data from localStorage
  useEffect(() => {
    try {
      // load main state for this user (if any)
      const saved = loadState(buildKey())
      if (saved) {
        // restrict theme to either 'light' or 'dark'
        const themeValue = (saved.theme === 'dark') ? 'dark' : 'light'
        setState(() => ({
          salary: Number(saved.salary || 0),
          initialBalance: Number(saved.initialBalance || 0),
          risk: saved.risk || 'moderate',
          theme: themeValue,
          expenses: Array.isArray(saved.expenses) ? saved.expenses : [],
          incomes: Array.isArray(saved.incomes) ? saved.incomes : []
        }))
      } else {
        // initialize to empty financial lists when no saved data for this user
        setState(s => ({ ...s, expenses: [], incomes: [], theme: s.theme || 'light' }))
      }

      // load monthly buckets and categories (if any)
      const monthlySaved = loadState(buildKey('monthly')) || { expenses: {}, incomes: {} }
      setMonthly(monthlySaved)
      const cats = loadState(buildKey('categories'))
      if (Array.isArray(cats) && cats.length) setCategories(cats)
    } catch (err) {
      console.error('Error loading user data', err)
    }
  }, [user && user.uid])

  const setSalary = (salary) => setState(s => ({ ...s, salary }))
  const setInitialBalance = (initialBalance) => setState(s => ({ ...s, initialBalance }))
  const setRisk = (risk) => setState(s => ({ ...s, risk }))
  const setTheme = (theme) => setState(s => ({ ...s, theme }))
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
  const openCategoryModal = (selectCallback) => {
    pendingSelectRef.current = typeof selectCallback === 'function' ? selectCallback : null
    setShowCategoriesManager(true)
  }

  // compute derived totals for invest page / display
  const totals = computeMonthlyTotals(state.salary, state.expenses, state.incomes, { includeFuture: true, initialBalance: state.initialBalance })

  return (
    <div className="min-h-screen">
  {/* decorative cinematic background removed - using neutral page background */}
      <Header onOpenCategories={() => setShowCategoriesManager(true)} theme={state.theme} setTheme={setTheme} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8 glass-card p-6">
          {route === '/' && (
            <HomePage />
          )}

          {route === '/dashboard' && (
            <div>
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1">
                  <InitialBalanceInput initialBalance={state.initialBalance} onSave={setInitialBalance} />
                  <SalaryInput salary={state.salary} onSave={setSalary} />
                </div>
                <div className="md:col-span-2">
                  <Dashboard salary={state.salary} initialBalance={state.initialBalance} expenses={state.expenses} incomes={state.incomes} risk={state.risk} setRisk={setRisk} />
                </div>
              </section>
              <section>
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
            </div>
          )}

          {route === '/transactions' && (
            <TransactionsPage
              categories={categories}
              addCategory={addCategory}
              onOpenCategoryModal={openCategoryModal}
              incomes={state.incomes}
              expenses={state.expenses}
              onAddIncome={addIncome}
              onUpdateIncome={updateIncome}
              onRemoveIncome={removeIncome}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onRemoveExpense={removeExpense}
            />
          )}

          {route === '/invest' && (
            <InvestPage savings={totals.savings || 0} risk={state.risk} setRisk={setRisk} />
          )}

          <footer className="text-center text-sm text-gray-500">Data is stored locally in your browser. Protect your device to keep your data safe.</footer>
        </div>
      </main>
      {showCategoriesManager && (
        <CategoriesManager
          categories={categories}
          onClose={() => { if (pendingSelectRef) pendingSelectRef.current = null; setShowCategoriesManager(false) }}
          onAddCategory={(name) => {
            // persist centrally
            addCategory(name)
            if (pendingSelectRef && pendingSelectRef.current) {
              try { pendingSelectRef.current(name) } catch (e) { console.error(e) }
              pendingSelectRef.current = null
              setShowCategoriesManager(false)
              return
            }
          }}
          onRenameCategory={renameCategory}
          onDeleteCategory={deleteCategory}
        />
      )}
    </div>
  )
}

// render categories manager modal if requested
// CategoriesManagerHost removed; rendering CategoriesManager directly above to avoid dynamic require() in browser.
