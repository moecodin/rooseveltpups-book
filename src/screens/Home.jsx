import CallUs from '../components/CallUs.jsx'
import { TEST_MODE } from '../lib/contact.js'
import { formatLong, formatTime, todayKey } from '../lib/dates.js'
import { formatPrice, serviceSummary } from '../lib/services.js'

const STATUS = { requested: 'Waiting for Roosevelt Pups Team to confirm', confirmed: 'Confirmed', declined: 'Not available', cancelled: 'Cancelled' }

// The signed-in page: the client's pups and their requests.
export default function Home({ account, onBook, onAddPup, onCancelRequest, onTestLink, onTestConfirm }) {
  const today = todayKey()
  const upcoming = account.requests.filter((r) => ['requested', 'confirmed'].includes(r.status) && (!r.date || r.date >= today))
  const past = account.requests.filter((r) => !upcoming.includes(r)).slice(-5).reverse()
  const pupName = (id) => account.pups.find((p) => p.id === id)?.name

  const cancel = (r) => {
    if (window.confirm('Cancel this request?')) onCancelRequest(r.id)
  }

  return (
    <>
      <section className="card-box">
        <h1 className="title">{greeting(account)}</h1>
        <p className="sub">{account.pups.length > 1 ? 'Are your pups ready for a spa day?' : `Is ${account.pups[0]?.name ?? 'your pup'} ready for a spa day?`}</p>
        <button type="button" className="btn btn-brand w-100" onClick={onBook}>
          Book a groom
        </button>
      </section>

      {upcoming.length > 0 && (
        <section className="card-box">
          <h2 className="title mb-3">Your bookings</h2>
          {upcoming.map((r) => (
            <div key={r.id} className="request">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <span className="request-when">{when(r)}</span>
                <span className={`status ${r.status}`}>{STATUS[r.status]}</span>
              </div>
              {r.pups.map((p) => (
                <div key={p.pupId} className="request-what">
                  {pupName(p.pupId)}: {serviceSummary(p)}
                </div>
              ))}
              <div className="request-actions">
                <button type="button" className="btn-quiet" onClick={() => cancel(r)}>
                  Cancel
                </button>
                {TEST_MODE && r.status === 'requested' && (
                  <button type="button" className="btn-quiet" onClick={() => onTestConfirm(r.id)}>
                    Test: pretend the desk confirmed
                  </button>
                )}
              </div>
            </div>
          ))}
          <p className="form-text mt-3 mb-0">
            We'll respond within an hour during store hours. Need to change a time? Cancel and book again, or give us a call.
          </p>
        </section>
      )}

      <section className="card-box">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="title mb-0">Your pups</h2>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onAddPup}>
            + Add a pup
          </button>
        </div>
        {account.pups.map((p) => (
          <div key={p.id} className="pup">
            <span className="pup-face" aria-hidden="true">🐶</span>
            <div className="pup-info">
              <b>{p.name}</b>
              <small>{p.breed}</small>
              <small>{pupNote(p)}</small>
              {TEST_MODE && !p.linked && (
                <button type="button" className="btn-quiet" onClick={() => onTestLink(p.id)}>
                  Test: pretend the desk linked it
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {past.length > 0 && (
        <section className="card-box">
          <h2 className="title mb-3">Past and cancelled</h2>
          {past.map((r) => (
            <div key={r.id} className={`request ${['cancelled', 'declined'].includes(r.status) ? 'cancelled' : ''}`}>
              <div className="d-flex justify-content-between gap-2">
                <span className="request-when">{when(r)}</span>
                <span className={`status ${r.status}`}>{r.status === 'confirmed' ? 'Done' : STATUS[r.status]}</span>
              </div>
              {r.deskNote && <div className="request-what">From the desk: {r.deskNote}</div>}
              <div className="request-what">{r.pups.map((p) => `${pupName(p.pupId)}: ${serviceSummary(p)}`).join(' · ')}</div>
            </div>
          ))}
        </section>
      )}

      <CallUs text="Questions? Call us at" />
    </>
  )
}

// "Hi, Jane and Biscuit!" / "Hi, Jane, Biscuit and Coco!"
function greeting(account) {
  const names = [account.firstName, ...account.pups.map((p) => p.name)].filter(Boolean)
  if (!names.length) return 'Hi!'
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
  return `Hi, ${list}!`
}

function when(r) {
  if (r.flexible === 'any') return "I'm flexible: any day"
  if (r.flexible === 'day') return `${formatLong(r.date)}, any time`
  return `${formatLong(r.date)} at ${formatTime(r.time)}`
}

function pupNote(p) {
  if (p.linked && p.lastPrice != null) return `Last visit: ${p.lastService} · ${formatPrice(p.lastPrice)}`
  if (p.linked) return 'All set'
  if (p.isNew) return 'New pup! We\'ll check the vaccine records before the first visit.'
  return 'We\'re matching your pup to our records.'
}
