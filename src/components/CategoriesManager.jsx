import React, { useState } from 'react'

export default function CategoriesManager({ categories = [], onClose, onAddCategory, onRenameCategory, onDeleteCategory }) {
  const [newCat, setNewCat] = useState('')
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')

  const startEdit = (c) => { setEditing(c); setEditVal(c) }
  const saveEdit = () => {
    if (editing && editVal) {
      onRenameCategory && onRenameCategory(editing, editVal)
      setEditing(null)
      setEditVal('')
    }
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newCat) return
    onAddCategory && onAddCategory(newCat)
    setNewCat('')
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
          <button className="bg-blue-600 text-white px-3 py-1 rounded">Add</button>
        </form>

        <ul className="space-y-2 max-h-64 overflow-auto">
          {categories.map(c => (
            <li key={c} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editing === c ? (
                  <>
                    <input value={editVal} onChange={e => setEditVal(e.target.value)} className="border rounded px-2 py-1" />
                    <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded">Save</button>
                    <button onClick={() => setEditing(null)} className="bg-gray-200 px-2 py-1 rounded">Cancel</button>
                  </>
                ) : (
                  <>
                    <div className="font-medium">{c}</div>
                    <button onClick={() => startEdit(c)} className="text-sm text-blue-600">Rename</button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select id={`replace-${c}`} className="border rounded px-2 py-1">
                  <option value="">-- keep as-is --</option>
                  {categories.filter(x => x !== c).map(x => <option key={x} value={x}>{x}</option>)}
                </select>
                <button onClick={(ev) => {
                  const sel = document.getElementById(`replace-${c}`)
                  const val = sel ? sel.value : ''
                  if (val === '') {
                    // no replacement chosen - delete categories only
                    onDeleteCategory && onDeleteCategory(c, null)
                  } else {
                    onDeleteCategory && onDeleteCategory(c, val)
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
