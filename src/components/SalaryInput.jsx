import React, { useState } from 'react'

export default function SalaryInput({ salary, onSave }) {
  const [value, setValue] = useState(salary || '')

  const handleSave = (e) => {
    e.preventDefault()
    const num = parseFloat(value) || 0
    onSave(num)
  }

  return (
    <form onSubmit={handleSave} className="mb-4 bg-white p-4 rounded shadow-sm">
  <label className="block text-sm font-medium text-gray-700">Monthly salary</label>
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          step="0.01"
          className="flex-1 border rounded px-3 py-2"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Eg: 2500"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Save</button>
      </div>
      <p className="mt-2 text-xs text-gray-500">Salary will be used to compute projected savings.</p>
    </form>
  )
}
