import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

function formatDateInput(date) {
  if (!date) return ''
  return date.slice(0,10)
}

export default function Expenses({ expenses = [], onAdd, onUpdate, onRemove, categories = [], onAddCategory, onOpenCategoryModal }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState((categories && categories.length) ? (typeof categories[0] === 'string' ? categories[0] : categories[0].name) : 'Other')
  const [date, setDate] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [recurringStart, setRecurringStart] = useState('')
  const [recurringEnd, setRecurringEnd] = useState('')

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
      // store as date-only YYYY-MM-DD to avoid timezone shifting
      date: date ? date : null,
      recurring,
      recurringStart: recurringStart ? recurringStart : null,
      recurringEnd: recurringEnd ? recurringEnd : null
    }
    onAdd(newExpense)
    setName('')
    setAmount('')
    setDate('')
    setRecurring(false)
    setRecurringStart('')
    setRecurringEnd('')
  }

  const startEdit = (exp) => {
    setEditingId(exp.id)
    setEditFields({
      name: exp.name || '',
      amount: exp.amount != null ? String(exp.amount) : '',
      category: exp.category || 'Other',
      date: exp.date ? formatDateInput(exp.date) : '',
      recurring: !!exp.recurring,
      recurringStart: exp.recurringStart ? formatDateInput(exp.recurringStart) : '',
      recurringEnd: exp.recurringEnd ? formatDateInput(exp.recurringEnd) : ''
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
      date: editFields.date ? editFields.date : null,
      recurring: !!editFields.recurring,
      recurringStart: editFields.recurringStart ? editFields.recurringStart : null,
      recurringEnd: editFields.recurringEnd ? editFields.recurringEnd : null
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
          <div className="flex gap-2">
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded px-2 py-1">
                  {categories && categories.map(c => {
                    const name = typeof c === 'string' ? c : c.name
                    return <option key={name} value={name}>{name}</option>
                  })}
            </select>
                <CategoryCreator categories={categories} onAddCategory={(c) => { onAddCategory && onAddCategory(c); setCategory(typeof c === 'string' ? c : (c && c.name)); }} onOpenCategoryModal={(cb) => onOpenCategoryModal && onOpenCategoryModal(cb)} setSelected={setCategory} />
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
            Recurring expense (monthly)
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
                    {categories && categories.map(c => {
                      const name = typeof c === 'string' ? c : c.name
                      return <option key={name} value={name}>{name}</option>
                    })}
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
                {editFields.recurring && (
                  <div className="md:col-span-4 flex gap-2 mt-2">
                    <div>
                      <label className="text-xs text-gray-600">Start</label>
                      <input value={editFields.recurringStart} onChange={ev => setEditFields(f => ({ ...f, recurringStart: ev.target.value }))} type="date" className="border rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">End</label>
                      <input value={editFields.recurringEnd} onChange={ev => setEditFields(f => ({ ...f, recurringEnd: ev.target.value }))} type="date" className="border rounded px-2 py-1" />
                    </div>
                  </div>
                )}
                <div className="md:col-span-4 flex gap-2 mt-2">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => saveEdit(e.id)}>Save</button>
                  <button className="bg-gray-200 px-3 py-1 rounded" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-gray-500">{e.category} · {e.recurring ? 'Recurring' : (e.date ? (function(d){
                    if (!d) return 'No date'
                    if (d instanceof Date) return d.toLocaleDateString()
                    const s = String(d).slice(0,10)
                    const parts = s.split('-')
                    if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toLocaleDateString()
                    return new Date(d).toLocaleDateString()
                  })(e.date) : 'No date')}</div>
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

function CategoryCreator({ onAddCategory, categories = [], onOpenCategoryModal, setSelected }) {
  // If parent provides onOpenCategoryModal, open the global modal and ask it to select the category when created
  if (onOpenCategoryModal) {
    return <button type="button" title="Add category" onClick={() => onOpenCategoryModal && onOpenCategoryModal((name) => { if (setSelected) setSelected(name) })} className="bg-gray-100 px-2 py-1 rounded">+</button>
  }

  // fallback inline creator (if modal is not available)
  const [open, setOpen] = React.useState(false)
  const [val, setVal] = React.useState('')
  const inpRef = React.useRef(null)

  React.useEffect(() => {
    if (open && inpRef.current) inpRef.current.focus()
  }, [open])

  const submit = (e) => {
    e && e.preventDefault()
    const trimmed = String(val || '').trim()
    if (!trimmed) return
    const exists = categories && categories.find(x => {
      const n = typeof x === 'string' ? x : x.name
      return n && n.toLowerCase() === trimmed.toLowerCase()
    })
    if (exists) { setVal(''); setOpen(false); return }
    onAddCategory && onAddCategory({ name: trimmed })
    setVal('')
    setOpen(false)
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} title="Add category" className="bg-gray-100 px-2 py-1 rounded">+</button>
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input ref={inpRef} value={val} onChange={e => setVal(e.target.value)} placeholder="New category" className="border rounded px-2 py-1" />
      <button className="bg-blue-600 text-white px-2 py-1 rounded">Add</button>
      <button type="button" onClick={() => { setVal(''); setOpen(false) }} className="bg-gray-200 px-2 py-1 rounded">Cancel</button>
    </form>
  )
}
