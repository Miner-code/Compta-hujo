import React, { useState } from 'react'
import * as Icons from 'lucide-react'

export default function CategoriesManager({ categories = [], onClose, onAddCategory, onRenameCategory, onDeleteCategory }) {
  const [newCat, setNewCat] = useState('')
  const [newColor, setNewColor] = useState('#2563eb')
  const [newIcon, setNewIcon] = useState('ShoppingCart')
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [editColor, setEditColor] = useState('#2563eb')
  const [editIcon, setEditIcon] = useState('ShoppingCart')
  // track replacement selections in state instead of DOM lookups
  const [replacements, setReplacements] = useState(() => ({}))

  const startEdit = (c) => { setEditing(c.name); setEditVal(c.name); setEditColor(c.color || '#2563eb'); setEditIcon(c.icon || 'ShoppingCart') }
  const saveEdit = () => {
    if (editing && editVal) {
      onRenameCategory && onRenameCategory(editing, editVal)
      // notify about color/icon change via onAddCategory pattern: replace existing with new object
      onAddCategory && onAddCategory({ name: editVal, color: editColor, icon: editIcon })
      // remove old entry if renamed
      if (editing !== editVal) onDeleteCategory && onDeleteCategory(editing, editVal)
      setEditing(null)
      setEditVal('')
    }
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newCat) return
    onAddCategory && onAddCategory({ name: newCat, color: newColor, icon: newIcon })
    setNewCat('')
    setNewColor('#2563eb')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Manage categories</h3>
          <button onClick={onClose} className="text-sm text-gray-600">Close</button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 items-center mb-4">
          <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category" className="flex-1 border rounded px-2 py-1" />
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} title="Category color" className="w-10 h-10 p-0 border rounded" />
          <select value={newIcon} onChange={e => setNewIcon(e.target.value)} className="border rounded px-2 py-1">
            {['ShoppingCart','Home','Truck','CreditCard','Coffee','Gift','Heart'].map(ic => <option key={ic} value={ic}>{ic}</option>)}
          </select>
          <button className="bg-blue-600 text-white px-3 py-1 rounded">Add</button>
        </form>

        <ul className="space-y-2 max-h-64 overflow-auto">
          {categories.map(cat => (
            <li key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editing === cat.name ? (
                  <>
                    <input value={editVal} onChange={e => setEditVal(e.target.value)} className="border rounded px-2 py-1" />
                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-10 h-10 p-0 border rounded" />
                    <select value={editIcon} onChange={e => setEditIcon(e.target.value)} className="border rounded px-2 py-1">
                      {['ShoppingCart','Home','Truck','CreditCard','Coffee','Gift','Heart'].map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                    <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded">Save</button>
                    <button onClick={() => setEditing(null)} className="bg-gray-200 px-2 py-1 rounded">Cancel</button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ background: cat.color || '#2563eb' }} />
                      {cat.icon && Icons[cat.icon] ? React.createElement(Icons[cat.icon], { size: 16 }) : null}
                      <div className="font-medium">{cat.name}</div>
                    </div>
                    <button onClick={() => startEdit(cat)} className="text-sm text-blue-600">Edit</button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select value={replacements[cat.name] || ''} onChange={ev => setReplacements(r => ({ ...r, [cat.name]: ev.target.value }))} className="border rounded px-2 py-1">
                  <option value="">-- keep as-is --</option>
                  {categories.filter(x => x.name !== cat.name).map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                </select>
                <button onClick={() => {
                  const val = replacements[cat.name] || ''
                  if (val === '') {
                    onDeleteCategory && onDeleteCategory(cat.name, null)
                  } else {
                    onDeleteCategory && onDeleteCategory(cat.name, val)
                  }
                }} className="text-sm text-red-600">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
