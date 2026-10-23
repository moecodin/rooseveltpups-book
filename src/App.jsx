import { useState } from 'react'
import Logo from './components/Logo.jsx'
import { TEST_MODE } from './lib/contact.js'
import { useStore } from './state/useStore.js'
import Book from './screens/Book.jsx'
import Home from './screens/Home.jsx'
import PupForm from './screens/PupForm.jsx'
import SignIn from './screens/SignIn.jsx'

// Which screen to show. Signed out: sign-in. Signed in with no pups yet: the
// first-time or returning form. Otherwise: home, booking, adding a pup, or "sent".
export default function App() {
  const store = useStore()
  const { account } = store
  const [kind, setKind] = useState(null)
  const [screen, setScreen] = useState('home')

  if (store.loading) return <p className="call mt-5">Loading…</p>
  if (!account) {
    return (
      <SignIn
        onSendCode={store.sendCode}
        onVerify={store.verifyCode}
        onDone={(chosenKind) => {
          setKind(chosenKind)
          setScreen('home')
        }}
      />
    )
  }

  const go = (next) => {
    setScreen(next)
    window.scrollTo(0, 0)
  }

  let page
  if (account.isStaff) {
    page = (
      <div className="card-box center">
        <h1 className="title">This is a staff account</h1>
        <p className="sub">Staff book on the grooming sheet. To book as a client, sign out and use your personal email.</p>
      </div>
    )
  } else if (account.loadError) {
    page = (
      <div className="card-box center">
        <h1 className="title">Something went wrong</h1>
        <p className="sub">We couldn't load your pups. Please refresh the page, or call us to book.</p>
      </div>
    )
  } else if (!account.pups.length) {
    page = (
      <PupForm
        account={account}
        kind={kind}
        onSave={async (pup) => {
          const result = await store.addPup(pup)
          if (!result.error) go('book')
          return result
        }}
      />
    )
  } else if (screen === 'book') {
    page = (
      <Book
        account={account}
        timesFor={store.timesFor}
        onSend={async (request) => {
          const result = await store.sendRequest(request)
          if (!result.error) go('sent')
          return result
        }}
        onCancel={() => go('home')}
      />
    )
  } else if (screen === 'addPup') {
    page = (
      <PupForm
        account={account}
        onSave={async (pup) => {
          const result = await store.addPup(pup)
          if (!result.error) go('home')
          return result
        }}
        onCancel={() => go('home')}
      />
    )
  } else if (screen === 'sent') {
    page = (
      <div className="card-box center">
        <div className="done-mark" aria-hidden="true">🐾</div>
        <h1 className="title">Request sent!</h1>
        <p className="sub">
          The Roosevelt Pups team will check the schedule and email <b>{account.email}</b> when it's confirmed. We'll respond within an hour during store hours.
        </p>
        <button type="button" className="btn btn-brand w-100" onClick={() => go('home')}>
          Done
        </button>
      </div>
    )
  } else {
    page = (
      <Home
        account={account}
        onBook={() => go('book')}
        onAddPup={() => go('addPup')}
        onCancelRequest={store.cancelRequest}
        onTestLink={store.pretendDeskLinked}
        onTestConfirm={store.pretendDeskConfirmed}
      />
    )
  }

  return (
    <main className="shell">
      <header className="topbar">
        <button type="button" className="btn p-0 border-0" onClick={() => go('home')} aria-label="Home">
          <Logo className="" />
        </button>
        <button type="button" className="btn-quiet" onClick={() => { store.signOut(); setScreen('home') }}>
          Sign out
        </button>
      </header>
      {page}
      {TEST_MODE && (
        <p className="call">
          Test mode: made-up schedule, saved only in this browser.{' '}
          <button type="button" className="btn-quiet" onClick={() => window.confirm('Erase all test accounts, pups and requests?') && store.resetTestData()}>
            Start over
          </button>
        </p>
      )}
    </main>
  )
}
