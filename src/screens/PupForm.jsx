import { useState } from 'react'
import CallUs from '../components/CallUs.jsx'
import FilePick from '../components/FilePick.jsx'

// Adds a pup to the account. A first-time pup needs its vaccine records; a
// returning pup is matched to the staff records by the desk (dog name, owner
// last name and phone), so the client never sees anyone else's information.
// The owner's name and phone are only asked the first time.
export default function PupForm({ account, kind: startKind, onSave, onCancel }) {
  const [kind, setKind] = useState(startKind || 'returning')
  const [form, setForm] = useState({
    firstName: account.firstName || '',
    lastName: account.lastName || '',
    phone: account.phone || '',
    name: '',
    breed: '',
  })
  const [vaccines, setVaccines] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const askOwner = !account.lastName
  const isNew = kind === 'new'

  const set = (field) => (e) => {
    setForm({ ...form, [field]: field === 'phone' ? formatPhone(e.target.value) : e.target.value })
    setError('')
  }

  const save = async (e) => {
    e.preventDefault()
    const missing = [
      askOwner && !form.firstName.trim() && 'your first name',
      askOwner && !form.lastName.trim() && 'your last name',
      askOwner && form.phone.replace(/\D/g, '').length < 10 && 'a 10-digit phone number',
      !form.name.trim() && "your pup's name",
      !form.breed.trim() && 'the breed',
      isNew && !vaccines && 'their vaccine records',
    ].filter(Boolean)
    if (missing.length) {
      setError(`Please add ${missing.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`)
      return
    }
    setBusy(true)
    const { error: problem } = (await onSave({ ...form, isNew, vaccines, photo })) || {}
    setBusy(false)
    if (problem) setError(problem)
  }

  return (
    <form className="card-box" onSubmit={save} noValidate>
      <h1 className="title">{isNew ? 'Welcome to Roosevelt Pups!' : 'Welcome back!'}</h1>
      <p className="sub">
        {isNew
          ? 'Tell us about your pup. It only takes a minute, and we save it for next time.'
          : "We'll match your pup to our records, so you don't have to fill everything in again."}
      </p>

      {!startKind && (
        <div className="choices row2" role="radiogroup" aria-label="Has this pup been groomed here before?">
          {[
            ['returning', 'Returning pup'],
            ['new', 'First time here'],
          ].map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={kind === value} className={`choice ${kind === value ? 'on' : ''}`} onClick={() => setKind(value)}>
              <b>{label}</b>
            </button>
          ))}
        </div>
      )}

      {askOwner && (
        <>
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label" htmlFor="first">Your first name</label>
              <input id="first" className="form-control mb-3" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />
            </div>
            <div className="col-6">
              <label className="form-label" htmlFor="last">Last name</label>
              <input id="last" className="form-control mb-3" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          <label className="form-label" htmlFor="phone">Phone</label>
          <input id="phone" className="form-control" type="tel" inputMode="tel" autoComplete="tel" placeholder="000-000-0000" value={form.phone} onChange={set('phone')} />
          <p className="form-text mb-3">{isNew ? 'So we can call when your pup is ready.' : 'The number we have on file for you.'}</p>
        </>
      )}

      <div className="row g-2">
        <div className="col-6">
          <label className="form-label" htmlFor="pup">Pup's name</label>
          <input id="pup" className="form-control mb-3" value={form.name} onChange={set('name')} />
        </div>
        <div className="col-6">
          <label className="form-label" htmlFor="breed">Breed</label>
          <input id="breed" className="form-control mb-3" value={form.breed} onChange={set('breed')} />
        </div>
      </div>

      {isNew && (
        <FilePick
          id="vaccines"
          label="Vaccine records"
          hint="A PDF or a photo of the paper from your vet."
          accept="application/pdf,image/*"
          file={vaccines}
          onPick={setVaccines}
        />
      )}
      <FilePick id="photo" label="A photo of your pup (optional)" hint="Helps us say hi by name." accept="image/*" file={photo} onPick={setPhoto} />

      {error && <p className="text-danger small" role="alert">{error}</p>}
      <button type="submit" className="btn btn-brand w-100" disabled={busy}>
        {busy ? 'Saving…' : isNew ? 'Save and book a groom' : 'Continue'}
      </button>
      {onCancel && (
        <button type="button" className="btn-quiet d-block mx-auto mt-3" onClick={onCancel}>
          Cancel
        </button>
      )}
      <CallUs />
    </form>
  )
}

// Shows the number as 212-555-0100 while it's typed (US numbers; a leading 1 is dropped).
function formatPhone(text) {
  const d = text.replace(/\D/g, '').replace(/^1(?=\d{10})/, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
}
