import { useState } from 'react'
import CallUs from '../components/CallUs.jsx'
import Logo from '../components/Logo.jsx'
import { TEST_MODE } from '../lib/contact.js'

const KINDS = [
  { value: 'returning', icon: '🐶', label: 'Returning pup', note: "We've groomed your dog before" },
  { value: 'new', icon: '✨', label: 'First time here', note: 'Have their vaccine records handy' },
]

// Mockup A: choose returning or first time, type an email, then the 6-digit code.
// onSendCode(email) and onVerify(email, code) return { error } when something's wrong.
export default function SignIn({ onSendCode, onVerify, onDone }) {
  const [kind, setKind] = useState('returning')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('start')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const sendCode = async (e) => {
    e?.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter your email, like name@example.com.')
      return
    }
    setBusy(true)
    const { error: problem } = await onSendCode(email)
    setBusy(false)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setCode('')
    setStep('code')
  }

  const checkCode = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6 numbers from the email.')
      return
    }
    setBusy(true)
    const { error: problem } = await onVerify(email, code)
    setBusy(false)
    if (problem) {
      setError(problem)
      return
    }
    onDone(kind)
  }

  if (step === 'code') {
    return (
      <main className="shell narrow">
        <form className="card-box" onSubmit={checkCode} noValidate>
          <Logo />
          <h1 className="title center">Check your email</h1>
          <p className="sub center">The code works for 10 minutes</p>
          {TEST_MODE && <p className="test-note">Test mode: no email is sent. Any 6 numbers work.</p>}
          <div className="sent-to">
            We sent a code to <b>{email.trim()}</b>
          </div>
          <label className="form-label" htmlFor="code">
            6-digit code
          </label>
          <input
            id="code"
            className="form-control code-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              setError('')
            }}
          />
          <p className="form-text mb-3">Can't find it? Check your spam folder.</p>
          {error && <p className="text-danger small" role="alert">{error}</p>}
          <button type="submit" className="btn btn-brand w-100" disabled={busy}>
            Continue
          </button>
          <div className="d-flex justify-content-between mt-3">
            <button type="button" className="btn-quiet" disabled={busy} onClick={() => sendCode()}>
              Send a new code
            </button>
            <button type="button" className="btn-quiet" onClick={() => setStep('start')}>
              Use a different email
            </button>
          </div>
        </form>
      </main>
    )
  }

  return (
    <main className="shell narrow">
      <form className="card-box" onSubmit={sendCode} noValidate>
        <Logo />
        <h1 className="title center">Book a groom</h1>
        <p className="sub center">Tuesday to Saturday, 9am–1pm</p>
        <div className="choices" role="radiogroup" aria-label="Has your pup been groomed here before?">
          {KINDS.map((k) => (
            <button key={k.value} type="button" role="radio" aria-checked={kind === k.value} className={`choice ${kind === k.value ? 'on' : ''}`} onClick={() => setKind(k.value)}>
              <span className="icon" aria-hidden="true">{k.icon}</span>
              <span>
                <b>{k.label}</b>
                <small>{k.note}</small>
              </span>
            </button>
          ))}
        </div>
        <label className="form-label" htmlFor="email">
          Your email
        </label>
        <input
          id="email"
          className="form-control"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
        />
        <p className="form-text mb-3">We'll email you a 6-digit code. No password needed.</p>
        {error && <p className="text-danger small" role="alert">{error}</p>}
        <button type="submit" className="btn btn-brand w-100" disabled={busy}>
          {busy ? 'Sending…' : 'Send me a code'}
        </button>
        <CallUs />
      </form>
    </main>
  )
}
