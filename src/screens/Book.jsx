import { useState } from 'react'
import FilePick from '../components/FilePick.jsx'
import { PHONE, PHONE_HREF } from '../lib/contact.js'
import { addDays, BOOK_AHEAD_DAYS, dayParts, formatLong, formatTime, fromKey, todayKey } from '../lib/dates.js'
import { A_LA_CARTE, CUT_STYLES, MAIN_CHOICES, QUICK_PRICES, formatPrice, serviceSummary, toBooking } from '../lib/services.js'

const STEPS = ['Service', 'Day and time', 'Details', 'Review']

// Booking a groom in four steps. Siblings (up to two pups) come in together.
export default function Book({ account, timesFor, onSend, onCancel }) {
  const pups = account.pups
  const [step, setStep] = useState(0)
  const [chosen, setChosen] = useState(pups.length === 1 ? [pups[0].id] : [])
  const [choices, setChoices] = useState({})
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)
  const [flexible, setFlexible] = useState(null)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // What each chosen pup is booked for, the way the staff site stores it.
  const picks = chosen.map((id) => ({ pupId: id, ...toBooking(choices[id] || {}) }))
  const picksReady = chosen.length > 0 && chosen.every((id) => toBooking(choices[id] || {}))

  const resetWhen = () => {
    setDate(null)
    setTime(null)
    setFlexible(null)
  }
  const togglePup = (id) => {
    setError('')
    resetWhen()
    setChosen((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < 2 ? [...list, id] : list))
  }
  const setChoice = (id, change) => {
    setError('')
    resetWhen()
    setChoices((all) => ({ ...all, [id]: { ...all[id], ...change } }))
  }

  const next = () => {
    if (step === 0 && !picksReady) return setError(chosen.length ? 'Pick a service for each pup.' : 'Pick which pup is coming.')
    if (step === 1 && !(time != null || flexible)) return setError('Pick a time, or tap "I\'m flexible".')
    setError('')
    setStep(step + 1)
    window.scrollTo(0, 0)
  }
  const back = () => {
    setError('')
    if (step === 0) onCancel()
    else setStep(step - 1)
  }

  const send = async () => {
    setBusy(true)
    const { error: problem } = (await onSend({
      pups: picks,
      date: flexible === 'any' ? null : date,
      time: flexible ? null : time,
      flexible,
      note: note.trim(),
      photo,
    })) || {}
    setBusy(false)
    if (problem) setError(problem)
  }

  return (
    <div className="card-box">
      <div className="steps" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={i <= step ? 'done' : ''} />
        ))}
      </div>
      <p className="step-label mb-1">
        Step {step + 1} of {STEPS.length}
      </p>

      {step === 0 && <ServiceStep pups={pups} chosen={chosen} choices={choices} onToggle={togglePup} onChoice={setChoice} />}
      {step === 1 && (
        <WhenStep
          picks={picks}
          timesFor={timesFor}
          date={date}
          time={time}
          flexible={flexible}
          onDate={(d) => {
            setDate(d)
            setTime(null)
            if (flexible === 'any') setFlexible(null)
            setError('')
          }}
          onTime={(t) => {
            setTime(t)
            setFlexible(null)
            setError('')
          }}
          onFlexible={(f) => {
            setFlexible(f)
            setTime(null)
            if (f === 'any') setDate(null)
            setError('')
          }}
        />
      )}
      {step === 2 && (
        <>
          <h2 className="title">Anything we should know?</h2>
          <p className="sub">Optional. Flor reads this before your visit.</p>
          <label className="form-label" htmlFor="note">Notes for Flor (your groomer)</label>
          <textarea id="note" className="form-control mb-1" rows={4} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          <p className="form-text mb-3">For example: a mat behind the ears, nervous around dryers, a special shampoo.</p>
          <FilePick id="visit-photo" label="A recent photo (optional)" hint="Show us the look you'd like, or a spot to check." accept="image/*" file={photo} onPick={setPhoto} />
        </>
      )}
      {step === 3 && <Review account={account} picks={picks} date={date} time={time} flexible={flexible} note={note.trim()} photo={photo} />}

      {error && <p className="text-danger small mt-3 mb-0" role="alert">{error}</p>}
      <div className="d-flex gap-2 mt-4">
        <button type="button" className="btn btn-outline-secondary" onClick={back}>
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < 3 ? (
          <button type="button" className="btn btn-brand flex-grow-1" onClick={next}>
            Next
          </button>
        ) : (
          <button type="button" className="btn btn-brand flex-grow-1" onClick={send} disabled={busy}>
            {busy ? 'Sending…' : 'Send request'}
          </button>
        )}
      </div>
    </div>
  )
}

function ServiceStep({ pups, chosen, choices, onToggle, onChoice }) {
  return (
    <>
      <h2 className="title">{pups.length > 1 ? "Who's coming in?" : `What would ${pups[0].name} like?`}</h2>
      <p className="sub">{pups.length > 1 ? 'Pick one pup, or two siblings coming in together.' : 'Pick a service.'}</p>
      {pups.length > 1 && (
        <div className="chips mb-3">
          {pups.map((p) => (
            <button key={p.id} type="button" className={`chip ${chosen.includes(p.id) ? 'on' : ''}`} aria-pressed={chosen.includes(p.id)} onClick={() => onToggle(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
      )}
      {chosen.map((id) => {
        const pup = pups.find((p) => p.id === id)
        const choice = choices[id] || {}
        return (
          <div key={id} className="pup-block">
            {pups.length > 1 && <p className="fw-bold mb-1">{pup.name}</p>}
            {pup.linked && pup.lastPrice != null && (
              <p className="last-time">
                Last time: {pup.lastService} · <b>{formatPrice(pup.lastPrice)}</b>
              </p>
            )}
            <div className="choices">
              {MAIN_CHOICES.map((c) => (
                <button key={c.value} type="button" role="radio" aria-checked={choice.main === c.value} className={`choice ${choice.main === c.value ? 'on' : ''}`} onClick={() => onChoice(id, { main: c.value })}>
                  <span>
                    <b>{c.label}</b>
                    <small>{c.note}</small>
                  </span>
                </button>
              ))}
            </div>
            {choice.main === 'full' && (
              <>
                <p className="form-label">Haircut (optional)</p>
                <div className="chips mb-2">
                  {Object.entries(CUT_STYLES).map(([value, label]) => (
                    <button key={value} type="button" className={`chip ${choice.cut === value ? 'on' : ''}`} aria-pressed={choice.cut === value} onClick={() => onChoice(id, { cut: choice.cut === value ? '' : value })}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="form-text">Not sure? Leave it, and Flor will ask at drop-off.</p>
              </>
            )}
            {choice.main === 'bath' && (
              <div className="chips">
                <button type="button" className={`chip ${choice.deshed ? 'on' : ''}`} aria-pressed={!!choice.deshed} onClick={() => onChoice(id, { deshed: !choice.deshed })}>
                  + Deshed
                </button>
              </div>
            )}
            {choice.main === 'alc' && (
              <>
                <p className="form-label">Pick one or more</p>
                <div className="chips">
                  {Object.entries(A_LA_CARTE).map(([value, label]) => {
                    const on = choice.quick?.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`chip ${on ? 'on' : ''}`}
                        aria-pressed={!!on}
                        onClick={() => onChoice(id, { quick: on ? choice.quick.filter((q) => q !== value) : [...(choice.quick || []), value] })}
                      >
                        {label} · {formatPrice(QUICK_PRICES[value])}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )
      })}
    </>
  )
}

function WhenStep({ picks, timesFor, date, time, flexible, onDate, onTime, onFlexible }) {
  const today = todayKey()
  const first = addDays(today, 1)
  const last = addDays(today, BOOK_AHEAD_DAYS)
  const [month, setMonth] = useState(() => (date ?? first).slice(0, 7)) // "2026-11"
  const offered = date ? timesFor(date, picks).times : []
  const soonest = soonestSpots(first, last, picks, timesFor, 3)
  const pick = (d, t) => {
    onDate(d)
    onTime(t)
  }

  return (
    <>
      <h2 className="title">When works for you?</h2>
      <p className="sub">Drop-off between 9am and 1pm. We'll confirm by email.</p>

      {soonest.length > 0 && (
        <div className="soonest">
          {soonest.map((s, i) => (
            <button key={s.date} type="button" className={`soon ${date === s.date && time === s.time ? 'on' : ''}`} aria-pressed={date === s.date && time === s.time} onClick={() => pick(s.date, s.time)}>
              <span>
                <small>{i === 0 ? 'Soonest' : 'Next'}</small>
                {formatShortDay(s.date)}
              </span>
              <b>{formatTime(s.time)}</b>
            </button>
          ))}
        </div>
      )}
      <div className="or">or pick a day</div>

      <MonthCalendar
        month={month}
        onMonth={setMonth}
        first={first}
        last={last}
        selected={date}
        isOpen={(key) => timesFor(key, picks).status === 'ok'}
        onPick={onDate}
      />

      {date && (
        <>
          <p className="form-label mt-3">{formatLong(date)}</p>
          <div className="times">
            {offered.map((t) => (
              <button key={t} type="button" className={`time ${time === t ? 'on' : ''}`} aria-pressed={time === t} onClick={() => onTime(t)}>
                {formatTime(t)}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="or">or</div>
      <p className="fw-bold mb-2">I'm flexible</p>
      <div className="choices row2 mb-0">
        <button type="button" className={`choice ${flexible === 'day' ? 'on' : ''}`} aria-pressed={flexible === 'day'} disabled={!date} onClick={() => onFlexible('day')}>
          <span>
            <b>Any time that day</b>
            <small>{date ? formatLong(date) : 'Pick a day first'}</small>
          </span>
        </button>
        <button type="button" className={`choice ${flexible === 'any' ? 'on' : ''}`} aria-pressed={flexible === 'any'} onClick={() => onFlexible('any')}>
          <span>
            <b>Any day and time</b>
            <small>We'll find the next spot</small>
          </span>
        </button>
      </div>

      <p className="call-note">
        Don't see the time you need? Call us at <a href={PHONE_HREF}>{PHONE}</a> and we'll see what we can do.
      </p>
    </>
  )
}

// The next few open spots: the first offered time on each of the next open days.
function soonestSpots(first, last, picks, timesFor, count) {
  const spots = []
  for (let key = first; key <= last && spots.length < count; key = addDays(key, 1)) {
    const { status, times } = timesFor(key, picks)
    if (status === 'ok') spots.push({ date: key, time: times[0] })
  }
  return spots
}

// One month, Tuesday to Saturday only (the days Flor grooms). Days that can't be
// booked are greyed out; a green dot marks days with open times.
function MonthCalendar({ month, onMonth, first, last, selected, isOpen, onPick }) {
  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  // Weeks already gone aren't shown: start from the week of the first bookable day.
  const firstWeek = addDays(first, 2 - fromKey(first).getDay()) // that week's Tuesday (the next one on a Sunday or Monday)
  const cells = []
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${month}-${String(d).padStart(2, '0')}`
    const weekday = fromKey(key).getDay()
    if (weekday < 2 || key < firstWeek) continue
    // Blank boxes before the month's first grooming day, so it lines up under its weekday.
    if (!cells.length) for (let i = 2; i < weekday; i++) cells.push(null)
    cells.push(key)
  }
  const shift = (n) => {
    const d = new Date(y, m - 1 + n, 1)
    onMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const label = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="calendar">
      <div className="cal-head">
        <button type="button" className="cal-arrow" onClick={() => shift(-1)} disabled={month <= first.slice(0, 7)} aria-label="Previous month">‹</button>
        <b>{label}</b>
        <button type="button" className="cal-arrow" onClick={() => shift(1)} disabled={month >= last.slice(0, 7)} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid">
        {['Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((key, i) => {
          if (!key) return <span key={`blank-${i}`} />
          const inRange = key >= first && key <= last
          const open = inRange && isOpen(key)
          const n = Number(key.slice(8))
          return (
            <button
              key={key}
              type="button"
              className={`cal-day ${open ? 'open' : ''} ${inRange && !open ? 'full' : ''} ${selected === key ? 'on' : ''}`}
              disabled={!open}
              aria-pressed={selected === key}
              aria-label={`${formatLong(key)}${open ? '' : inRange ? ', full or closed' : ''}`}
              onClick={() => onPick(key)}
            >
              {n}
              {open && <span className="cal-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <p className="cal-legend">
        <span><i className="cal-dot" /> open</span>
        <span><s>12</s> full or closed</span>
      </p>
    </div>
  )
}

// "Tue, Oct 27"
function formatShortDay(key) {
  const { day, date, month } = dayParts(key)
  return `${day}, ${month} ${date}`
}

function Review({ account, picks, date, time, flexible, note, photo }) {
  const name = (id) => account.pups.find((p) => p.id === id)?.name
  const when = flexible === 'any' ? "Any day and time: we'll find the next spot" : flexible === 'day' ? `${formatLong(date)}, any time` : `${formatLong(date)} at ${formatTime(time)}`
  return (
    <>
      <h2 className="title">Look right?</h2>
      <p className="sub">This sends a request to the Roosevelt Pups team. We'll email {account.email} when it's confirmed, usually within an hour during store hours.</p>
      <dl className="review">
        {picks.map((p) => (
          <div key={p.pupId}>
            <dt>{name(p.pupId)}</dt>
            <dd>{serviceSummary(p)}</dd>
          </div>
        ))}
        <dt>When</dt>
        <dd>{when}</dd>
        {note && (
          <>
            <dt>Notes for Flor (your groomer)</dt>
            <dd>{note}</dd>
          </>
        )}
        {photo && (
          <>
            <dt>Photo</dt>
            <dd>{photo.name}</dd>
          </>
        )}
      </dl>
    </>
  )
}
