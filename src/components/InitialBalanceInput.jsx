import React, { useState } from 'react'

export default function InitialBalanceInput({ initialBalance, onSave }) {
  const [value, setValue] = useState(initialBalance || '')

  const handleSave = (e) => {
    e.preventDefault()
    const num = parseFloat(value) || 0
    onSave(num)
  }

  return (
    <form onSubmit={handleSave} className="mb-4 glass-card p-4">
      <label className="block text-sm font-medium text-gray-700">Current account balance</label>
      <div className="mt-3 flex gap-2">
        <input
          type="number"
          step="0.01"
          className="input-base"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Eg: 1200"
        />
        <button className="btn btn-primary" type="submit">Save</button>
      </div>
      <p className="mt-2 text-xs text-gray-500">This starting balance is used to compute your available funds.</p>
    </form>
  )
}
