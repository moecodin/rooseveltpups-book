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

  if (!account) {
    return (
      <SignIn
        onSignIn={store.signIn}
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
  if (!account.pups.length) {
    page = (
      <PupForm
        account={account}
        kind={kind}
        onSave={(pup) => {
          store.addPup(pup)
          go('book')
        }}
      />
    )
  } else if (screen === 'book') {
    page = (
      <Book
        account={account}
        timesFor={store.timesFor}
        onSend={(request) => {
          store.sendRequest(request)
          go('sent')
        }}
        onCancel={() => go('home')}
      />
    )
  } else if (screen === 'addPup') {
    page = (
      <PupForm
        account={account}
        onSave={(pup) => {
          store.addPup(pup)
          go('home')
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
          Our front desk will check the schedule and email <b>{account.email}</b> when it's confirmed.
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
