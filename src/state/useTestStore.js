// Test mode: the client's data and every way it can change, saved only in this
// browser, with a made-up schedule. Same shape as useRemoteStore.js, which is
// what the real site uses.

import { useCallback, useEffect, useState } from 'react'
import { offeredTimes } from '../lib/availability.js'
import { todayKey } from '../lib/dates.js'
import { DESHED_EXTRA } from '../lib/services.js'
import { SAMPLE_DAYS_OFF, STAFF_DOGS, sampleBookings } from '../data/sampleData.js'

const STORAGE_KEY = 'rp-book-test'
const EMPTY = { accounts: {}, signedIn: null }

// The shape of one account:
// { email, firstName, lastName, phone,
//   pups: [{ id, name, breed, isNew, linked, lastService, lastPrice, vaccines, photo }],
//   requests: [{ id, pups: [{ pupId, service, addons, cut }], date, time, flexible, note, photo, status, sentAt }] }
// flexible: null, 'day' (any time that day) or 'any' (any day and time).
// status: 'requested', 'confirmed' or 'cancelled'.

export function useTestStore() {
  const [data, setData] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Private window or storage blocked: it still works until the page closes.
    }
  }, [data])

  const account = data.signedIn ? data.accounts[data.signedIn] : null

  const changeAccount = useCallback((change) => {
    setData((d) => ({ ...d, accounts: { ...d.accounts, [d.signedIn]: change(d.accounts[d.signedIn]) } }))
  }, [])

  // In test mode no email is sent and any code works.
  const sendCode = useCallback(async () => ({}), [])
  const verifyCode = useCallback(async (email) => {
    const key = email.trim().toLowerCase()
    setData((d) => ({
      ...d,
      signedIn: key,
      accounts: d.accounts[key] ? d.accounts : { ...d.accounts, [key]: { email: key, pups: [], requests: [] } },
    }))
    return {}
  }, [])

  const signOut = useCallback(() => setData((d) => ({ ...d, signedIn: null })), [])

  // details: { firstName, lastName, phone } plus the pup's { name, breed, vaccines, photo }
  const addPup = useCallback(
    async ({ firstName, lastName, phone, name, breed, vaccines = null, photo = null, isNew }) => {
      changeAccount((a) => ({
        ...a,
        firstName: firstName ?? a.firstName ?? '',
        lastName: lastName || a.lastName,
        phone: phone || a.phone,
        pups: [...a.pups, { id: crypto.randomUUID(), name: name.trim(), breed: breed.trim(), isNew, linked: false, vaccines: fileName(vaccines), photo: fileName(photo) }],
      }))
      return {}
    },
    [changeAccount],
  )

  // Test mode only: what the desk does on the staff site when it links a pup to its record.
  const pretendDeskLinked = useCallback(
    (pupId) => {
      changeAccount((a) => ({
        ...a,
        pups: a.pups.map((p) => {
          if (p.id !== pupId) return p
          const match = STAFF_DOGS.find(
            (s) => same(s.name, p.name) && same(s.lastName, a.lastName) && digits(s.phone) === digits(a.phone).slice(-7),
          )
          return { ...p, linked: true, lastService: match?.lastService ?? null, lastPrice: match?.lastPrice ?? null }
        }),
      }))
    },
    [changeAccount],
  )

  const sendRequest = useCallback(
    async (request) => {
      changeAccount((a) => ({
        ...a,
        requests: [...a.requests, { ...request, photo: fileName(request.photo), id: crypto.randomUUID(), status: 'requested', sentAt: new Date().toISOString() }],
      }))
      return {}
    },
    [changeAccount],
  )

  const cancelRequest = useCallback(
    async (id) => changeAccount((a) => ({ ...a, requests: a.requests.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)) })),
    [changeAccount],
  )

  // Test mode only: what the desk's Confirm button will do.
  const pretendDeskConfirmed = useCallback(
    (id) => changeAccount((a) => ({ ...a, requests: a.requests.map((r) => (r.id === id ? { ...r, status: 'confirmed' } : r)) })),
    [changeAccount],
  )

  // The times to offer on one day for the chosen pups and services.
  // picks: [{ pupId, service, addons }]
  const timesFor = useCallback(
    (date, picks) => {
      const own = Object.values(data.accounts)
        .flatMap((a) => a.requests.flatMap((r) => (r.date === date && r.time != null && r.status !== 'cancelled' ? r.pups.map((p) => ({ time: r.time, service: p.service, status: 'booked' })) : [])))
      const dogs = picks.map((p) => ({ service: p.service, extra: p.addons?.includes('deshed') ? DESHED_EXTRA : 0 }))
      return offeredTimes({
        date,
        today: todayKey(),
        request: { dogs },
        bookings: [...sampleBookings(date), ...own],
        dayOff: SAMPLE_DAYS_OFF.includes(date),
      })
    },
    [data.accounts],
  )

  const resetTestData = useCallback(() => setData(EMPTY), [])

  return { account, loading: false, sendCode, verifyCode, signOut, addPup, pretendDeskLinked, sendRequest, cancelRequest, pretendDeskConfirmed, timesFor, resetTestData }
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || EMPTY
  } catch {
    return EMPTY
  }
}

// Files can't be saved in the browser's storage; test mode keeps just the name.
const fileName = (picked) => (picked ? { name: picked.name } : null)
const same = (a, b) => a.trim().toLowerCase() === (b || '').trim().toLowerCase()
const digits = (text) => (text || '').replace(/\D/g, '')
