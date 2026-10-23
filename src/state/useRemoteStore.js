// The real site: the client's data and every way it can change, in Supabase.
// Same shape as useTestStore.js. What a client may see and do is enforced by
// the database itself (staff repo: supabase/updates/008-online-booking.sql).

import { useCallback, useEffect, useState } from 'react'
import { offeredTimes } from '../lib/availability.js'
import { addDays, todayKey } from '../lib/dates.js'
import { DESHED_EXTRA, serviceSummary } from '../lib/services.js'
import { supabase } from '../lib/supabase.js'

const BUCKET = 'client-files'
const LOOK_AHEAD = 60 // days of busy times to load (booking goes up to 56)

export function useRemoteStore() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [account, setAccount] = useState(null)
  const [busy, setBusy] = useState({ times: [], days: {} })
  const uid = session?.user?.id

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  // Everything the client sees, read fresh from the database.
  const load = useCallback(async () => {
    if (!session) return
    const today = todayKey()
    const last = addDays(today, LOOK_AHEAD)
    const [client, pups, requests, visits, busyTimes, days] = await Promise.all([
      supabase.from('clients').select('*').eq('id', session.user.id).maybeSingle(),
      supabase.from('client_pups').select('*').order('created_at'),
      supabase.from('booking_requests').select('*, booking_request_pups(*)').order('created_at'),
      supabase.rpc('my_last_visits'),
      supabase.rpc('booking_busy', { from_date: today, to_date: last }),
      supabase.rpc('booking_days', { from_date: today, to_date: last }),
    ])
    const problem = [client, pups, requests, visits, busyTimes, days].find((r) => r.error)
    if (problem) {
      setAccount((a) => (a?.uid === session.user.id ? a : { uid: session.user.id, email: session.user.email, pups: [], requests: [], loadError: problem.error.message }))
      return
    }
    const lastVisit = Object.fromEntries((visits.data || []).map((v) => [v.pup_id, v]))
    setAccount({
      uid: session.user.id,
      email: session.user.email,
      isStaff: ['staff', 'groomer'].includes(session.user.app_metadata?.role),
      hasDetails: Boolean(client.data),
      firstName: client.data?.first_name ?? '',
      lastName: client.data?.last_name ?? '',
      phone: client.data?.phone ?? '',
      pups: pups.data.map((p) => ({
        id: p.id,
        name: p.name,
        breed: p.breed,
        isNew: p.is_new,
        linked: Boolean(p.dog_id),
        lastService: lastVisit[p.id] ? serviceSummary(lastVisit[p.id]) : null,
        lastPrice: lastVisit[p.id]?.price ?? null,
      })),
      requests: requests.data.map((r) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        flexible: r.flexible || null,
        note: r.note,
        status: r.status,
        deskNote: r.desk_note,
        pups: r.booking_request_pups.map((rp) => ({ pupId: rp.pup_id, service: rp.service, addons: rp.addons, cut: rp.cut })),
      })),
    })
    setBusy({
      times: busyTimes.data,
      days: Object.fromEntries(days.data.map((d) => [d.date, d.mode])),
    })
  }, [session])

  useEffect(() => {
    if (!uid) return
    load()
    // When the desk confirms or declines, the page updates by itself.
    const channel = supabase
      .channel(`client-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_requests', filter: `client_id=eq.${uid}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_pups', filter: `client_id=eq.${uid}` }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [uid, load])

  // Email a 6-digit code. New emails get a client account.
  const sendCode = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
    return { error: error && friendly(error) }
  }, [])

  const verifyCode = useCallback(async (email, code) => {
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' })
    return { error: error && friendly(error) }
  }, [])

  const signOut = useCallback(() => supabase.auth.signOut(), [])

  // Saves the owner's details (the first time) and the pup, with its files.
  const addPup = useCallback(
    async ({ firstName, lastName, phone, name, breed, vaccines, photo, isNew }) => {
      if (!account.hasDetails) {
        const { error } = await supabase.from('clients').insert({
          id: uid,
          email: session.user.email,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
        })
        if (error) return { error: friendly(error) }
      }
      const vaccinesPath = await upload(uid, vaccines)
      const photoPath = await upload(uid, photo)
      if (vaccinesPath?.error || photoPath?.error) return { error: "That file didn't upload. Please try again, or try a smaller file." }
      const { error } = await supabase.from('client_pups').insert({
        client_id: uid,
        name: name.trim(),
        breed: breed.trim(),
        is_new: isNew,
        vaccines_path: vaccinesPath,
        photo_path: photoPath,
      })
      if (error) return { error: friendly(error) }
      await load()
      return {}
    },
    [account, uid, session, load],
  )

  const sendRequest = useCallback(
    async (request) => {
      const photoPath = await upload(uid, request.photo)
      if (photoPath?.error) return { error: "The photo didn't upload. Please try again, or leave it out." }
      const { error } = await supabase.rpc('send_booking_request', {
        p_pups: request.pups.map((p) => ({ pup_id: p.pupId, service: p.service, addons: p.addons, cut: p.cut || '' })),
        p_date: request.date,
        p_time: request.time,
        p_flexible: request.flexible || '',
        p_note: request.note,
        p_photo_path: photoPath,
      })
      if (error) return { error: friendly(error) }
      await load()
      return {}
    },
    [uid, load],
  )

  const cancelRequest = useCallback(
    async (id) => {
      const { error } = await supabase.rpc('cancel_booking_request', { req_id: id })
      if (error) window.alert(friendly(error))
      await load()
    },
    [load],
  )

  // The times to offer on one day for the chosen pups and services.
  const timesFor = useCallback(
    (date, picks) =>
      offeredTimes({
        date,
        today: todayKey(),
        request: { dogs: picks.map((p) => ({ service: p.service, extra: p.addons?.includes('deshed') ? DESHED_EXTRA : 0 })) },
        bookings: busy.times
          .filter((b) => b.date === date)
          .map((b) => ({ time: b.time, service: b.service, status: 'booked', extra: b.extra })),
        dayOff: busy.days[date] === 'closed',
        override: busy.days[date] === 'open' ? 'open' : null,
      }),
    [busy],
  )

  // Only the signed-in client's own account (never the one before a sign-out).
  const mine = uid && account?.uid === uid ? account : null
  return { account: mine, loading: checking || Boolean(uid && !mine), sendCode, verifyCode, signOut, addPup, sendRequest, cancelRequest, timesFor }
}

// Puts a picked file in the client's own folder. Returns its path, null when
// nothing was picked, or { error }.
async function upload(uid, picked) {
  if (!picked?.file) return null
  const ext = (picked.name.split('.').pop() || 'file').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${uid}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, picked.file, { contentType: picked.type })
  return error ? { error } : path
}

// Database messages the client might see, in plain words.
function friendly(error) {
  const text = error.message || String(error)
  if (/expired|invalid/i.test(text) && /token|otp/i.test(text)) return "That code didn't work. Check the numbers, or send a new code."
  if (/rate limit|too many/i.test(text)) return 'Too many tries. Please wait a minute and try again.'
  if (/signups not allowed/i.test(text)) return "Online booking isn't open yet. Please call us to book."
  if (/row-level security/i.test(text)) return 'Something went wrong saving that. Please try again or call us.'
  return text
}
