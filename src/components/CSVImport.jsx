import React, { useState, useRef } from 'react'

// small robust CSV parser handling quoted fields
function parseCSV(text) {
  const rows = []
  let cur = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { cur += '"'; i++ } else { inQuotes = false }
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(cur); cur = ''
      } else if (ch === '\r') {
        // ignore
      } else if (ch === '\n') {
        row.push(cur); rows.push(row); row = []; cur = ''
      } else {
        cur += ch
      }
    }
  }
  // last
  if (cur !== '' || row.length > 0) {
    row.push(cur)
    rows.push(row)
  }
  return rows
}

export default function CSVImport({ onClose }) {
  const [rows, setRows] = useState(null)
  const [headers, setHeaders] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = (file) => {
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        const parsed = parseCSV(text)
        if (!parsed || parsed.length === 0) { setError('CSV vide ou invalide'); return }
        // first row as headers if looks like strings
        const first = parsed[0]
        const looksLikeHeader = first.every(c => isNaN(Number(c)) && String(c).trim().length > 0)
        if (looksLikeHeader) {
          setHeaders(first.map(h => String(h).trim()))
          setRows(parsed.slice(1))
        } else {
          // no headers
          setHeaders(first.map((_,i) => 'col' + (i+1)))
          setRows(parsed)
        }
      } catch (e) { setError('Erreur pendant le parsing: ' + String(e)) }
    }
    reader.readAsText(file, 'utf-8')
  }

  const onDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files && e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const onSelect = () => {
    if (inputRef.current && inputRef.current.files && inputRef.current.files[0]) handleFile(inputRef.current.files[0])
  }

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="card max-w-4xl w-full p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Import CSV — Aperçu</h3>
          <button onClick={onClose} className="btn btn-ghost">Fermer</button>
        </div>

        <div className="mt-4">
          <div
            onDrop={onDrop}
            onDragOver={(e)=>e.preventDefault()}
            className="border-dashed border-2 border-gray-200 rounded p-4 text-center text-sm text-gray-600">
            Glisse-dépose un fichier CSV ici, ou
            <div className="mt-3">
              <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onSelect} className="input-base" />
            </div>
          </div>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        {rows && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">Aperçu (affiche {rows.length} lignes)</div>
            <div className="overflow-auto max-h-64 border rounded">
              <table className="min-w-full text-sm table-compact">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {headers.map(h => <th key={h} className="px-3 py-2 text-left text-xs text-gray-600">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r,ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white':'bg-gray-50'}>
                      {headers.map((_,ci) => <td key={ci} className="px-3 py-2 align-top break-words">{r[ci] != null ? String(r[ci]) : ''}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="btn btn-primary" onClick={() => {
                // copy JSON to clipboard
                const arr = rows.map(r => Object.fromEntries(headers.map((h,i)=>[h, r[i] || ''])))
                navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(arr, null, 2))
              }}>Copier JSON</button>
              <button className="btn btn-ghost" onClick={() => {
                const arr = rows.map(r => Object.fromEntries(headers.map((h,i)=>[h, r[i] || ''])))
                const blob = new Blob([JSON.stringify(arr,null,2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = 'import-preview.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
              }}>Télécharger JSON</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
