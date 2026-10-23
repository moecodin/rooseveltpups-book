import { useState } from 'react'

const MAX_MB = 10

// A file box for vaccine records and pup photos. In test mode only the file's
// name is kept; once connected, the file goes to private Supabase storage.
export default function FilePick({ id, label, hint, accept, file, onPick }) {
  const [error, setError] = useState('')

  const pick = (e) => {
    const chosen = e.target.files[0]
    if (!chosen) return
    const types = accept.split(',').map((t) => t.trim())
    const okType = types.some((t) => (t.endsWith('/*') ? chosen.type.startsWith(t.slice(0, -1)) : chosen.type === t))
    if (!okType) {
      setError(types.includes('application/pdf') ? 'Please pick a PDF or a photo.' : 'Please pick a photo.')
      return
    }
    if (chosen.size > MAX_MB * 1024 * 1024) {
      setError(`That file is too big. Please pick one under ${MAX_MB} MB.`)
      return
    }
    setError('')
    onPick({ name: chosen.name, size: chosen.size, type: chosen.type })
  }

  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input id={id} className="form-control" type="file" accept={accept} onChange={pick} />
      {file && !error ? <p className="file-picked">✓ {file.name}</p> : <p className="form-text mb-0">{hint}</p>}
      {error && <p className="text-danger small mb-0" role="alert">{error}</p>}
    </div>
  )
}
