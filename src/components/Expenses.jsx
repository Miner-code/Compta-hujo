import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

function formatDateInput(date) {
  if (!date) return ''
  return date.slice(0,10)
}

export default function Expenses({ expenses = [], onAdd, onUpdate, onRemove }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Other')
  const [date, setDate] = useState('')
  const [recurring, setRecurring] = useState(false)

  // Editing state for existing expenses
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({ name: '', amount: '', category: 'Other', date: '', recurring: false })

  const handleAdd = (e) => {
    e.preventDefault()
    const amt = parseFloat(amount) || 0
    if (!name || amt <= 0) return
    const newExpense = {
      id: uuidv4(),
      name,
      category,
      amount: amt,
      date: date ? new Date(date).toISOString() : null,
      recurring
    }
    onAdd(newExpense)
    setName('')
    setAmount('')
    setDate('')
    setRecurring(false)
  }

  const startEdit = (exp) => {
    setEditingId(exp.id)
    setEditFields({
      name: exp.name || '',
      amount: exp.amount != null ? String(exp.amount) : '',
      category: exp.category || 'Other',
      date: exp.date ? formatDateInput(exp.date) : '',
      recurring: !!exp.recurring
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditFields({ name: '', amount: '', category: 'Other', date: '', recurring: false })
  }

  const saveEdit = (id) => {
    const amt = parseFloat(editFields.amount) || 0
    const patch = {
      name: editFields.name,
      category: editFields.category,
      amount: amt,
      date: editFields.date ? new Date(editFields.date).toISOString() : null,
      recurring: !!editFields.recurring
    }
    onUpdate(id, patch)
    cancelEdit()
  }

  return (
    <div className="mt-4 bg-white p-4 rounded shadow-sm">
  <h2 className="text-lg font-medium mb-2">Expenses</h2>
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <div className="md:col-span-1">
          <label className="text-sm text-gray-600">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Rent, Groceries..." />
        </div>
        <div>
          <label className="text-sm text-gray-600">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded px-2 py-1">
            <option>Rent</option>
            <option>Groceries</option>
            <option>Transport</option>
            <option>Utilities</option>
            <option>Entertainment</option>
            <option>Subscriptions</option>
            <option>Other</option>
          </select>
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
            Recurring expense (monthly)
          </label>
          <button className="ml-auto bg-green-600 text-white px-4 py-2 rounded">Add</button>
        </div>
      </form>

      <ul className="mt-4 space-y-2">
        {expenses.length === 0 && <li className="text-sm text-gray-500">No expenses</li>}
        {expenses.map(e => (
          <li key={e.id} className="border rounded p-2">
            {editingId === e.id ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div>
                  <label className="text-xs text-gray-600">Name</label>
                  <input value={editFields.name} onChange={ev => setEditFields(f => ({ ...f, name: ev.target.value }))} className="w-full border rounded px-2 py-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Category</label>
                  <select value={editFields.category} onChange={ev => setEditFields(f => ({ ...f, category: ev.target.value }))} className="w-full border rounded px-2 py-1">
                    <option>Rent</option>
                    <option>Groceries</option>
                    <option>Transport</option>
                    <option>Utilities</option>
                    <option>Entertainment</option>
                    <option>Subscriptions</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Amount</label>
                  <input value={editFields.amount} onChange={ev => setEditFields(f => ({ ...f, amount: ev.target.value }))} type="number" step="0.01" className="w-full border rounded px-2 py-1" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full">
                    <label className="text-xs text-gray-600">Date</label>
                    <input value={editFields.date} onChange={ev => setEditFields(f => ({ ...f, date: ev.target.value }))} type="date" className="w-full border rounded px-2 py-1" />
                  </div>
                  <div className="flex flex-col items-start">
                    <label className="text-xs text-gray-600">Recurring</label>
                    <input type="checkbox" checked={!!editFields.recurring} onChange={ev => setEditFields(f => ({ ...f, recurring: ev.target.checked }))} />
                  </div>
                </div>
                <div className="md:col-span-4 flex gap-2 mt-2">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => saveEdit(e.id)}>Save</button>
                  <button className="bg-gray-200 px-3 py-1 rounded" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-gray-500">{e.category} · {e.recurring ? 'Recurring' : (e.date ? new Date(e.date).toLocaleDateString() : 'No date')}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 font-semibold text-red-600">
                    {/* down arrow icon for expense */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M10 18a1 1 0 01-.707-.293l-6-6a1 1 0 011.414-1.414L9 14.586V3a1 1 0 112 0v11.586l4.293-4.293a1 1 0 011.414 1.414l-6 6A1 1 0 0110 18z" clipRule="evenodd" />
                    </svg>
                    <span>€{(Number(e.amount) || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                  </div>
                  <button className="text-sm text-blue-600" onClick={() => startEdit(e)}>Edit</button>
                  <button className="text-sm text-red-600" onClick={() => onRemove(e.id)}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
