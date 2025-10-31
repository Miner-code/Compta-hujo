import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export default function Incomes({ incomes = [], onAdd, onUpdate, onRemove, categories = [], onAddCategory }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories && categories.length ? categories[0] : '')
  const [date, setDate] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [recurringStart, setRecurringStart] = useState('')
  const [recurringEnd, setRecurringEnd] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    const amt = parseFloat(amount) || 0
    if (!name || amt <= 0) return
    const newIncome = {
      id: uuidv4(),
      name,
      category,
      amount: amt,
      date: date ? new Date(date).toISOString() : null,
      recurring,
      recurringStart: recurringStart ? new Date(recurringStart).toISOString() : null,
      recurringEnd: recurringEnd ? new Date(recurringEnd).toISOString() : null
    }
    onAdd(newIncome)
    setName('')
    setAmount('')
    setDate('')
    setRecurring(false)
    setRecurringStart('')
    setRecurringEnd('')
  }

  return (
    <div className="mt-4 bg-white p-4 rounded shadow-sm">
      <h2 className="text-lg font-medium mb-2">Incomes</h2>
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <div className="md:col-span-1">
          <label className="text-sm text-gray-600">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Secondary salary, Sale..." />
        </div>
        <div>
          <label className="text-sm text-gray-600">Category</label>
          <div className="flex gap-2">
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded px-2 py-1">
              {categories && categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <CategoryCreator onAddCategory={(c) => { onAddCategory && onAddCategory(c); setCategory(c) }} />
          </div>
        </div>
          <div>
            <label className="text-sm text-gray-600">Amount</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" className="w-full border rounded px-2 py-1" placeholder="€" />
          </div>
        <div>
          <label className="text-sm text-gray-600">Date (optional)</label>
          <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full border rounded px-2 py-1" />
        </div>
        <div className="md:col-span-3 flex items-center gap-3 mt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
            Recurring (monthly)
          </label>
          {recurring && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Start</label>
              <input type="date" value={recurringStart} onChange={e => setRecurringStart(e.target.value)} className="border rounded px-2 py-1" />
              <label className="text-sm text-gray-600">End</label>
              <input type="date" value={recurringEnd} onChange={e => setRecurringEnd(e.target.value)} className="border rounded px-2 py-1" />
            </div>
          )}
          <button className="ml-auto bg-green-600 text-white px-4 py-2 rounded">Add</button>
        </div>
      </form>

      <ul className="mt-4 space-y-2">
        {incomes.length === 0 && <li className="text-sm text-gray-500">No incomes</li>}
        {incomes.map(i => (
          <li key={i.id} className="flex items-center justify-between border rounded p-2">
            <div>
              <div className="font-medium">{i.name}</div>
              <div className="text-xs text-gray-500">{i.recurring ? 'Recurring' : (i.date ? new Date(i.date).toLocaleDateString() : 'No date')}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-semibold text-green-600">
                {/* up arrow icon for income */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M10 2a1 1 0 01.707.293l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.293 9.707A1 1 0 112.88 8.293l6-6A1 1 0 0110 2z" clipRule="evenodd" />
                </svg>
                <span>€{(Number(i.amount)||0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
              </div>
              <button className="text-sm text-red-600" onClick={() => onRemove(i.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

    function CategoryCreator({ onAddCategory }) {
      const [open, setOpen] = React.useState(false)
      const [val, setVal] = React.useState('')

      const submit = (e) => {
        e.preventDefault()
        if (!val) return
        onAddCategory && onAddCategory(val)
        setVal('')
        setOpen(false)
      }

      if (!open) return <button type="button" onClick={() => setOpen(true)} className="bg-gray-100 px-2 py-1 rounded">+</button>
      return (
        <form onSubmit={submit} className="flex gap-2">
          <input value={val} onChange={e => setVal(e.target.value)} placeholder="New category" className="border rounded px-2 py-1" />
          <button className="bg-blue-600 text-white px-2 py-1 rounded">Add</button>
        </form>
      )
    }
