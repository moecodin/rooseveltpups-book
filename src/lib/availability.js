// Which grooming times a client is offered online.
//
// This is the phone rule the front desk already uses, written down:
// - Days 5 or more days away are "open": every free time is shown.
// - Days 1 to 4 days away are "soon": the client only sees what keeps Flor's
//   morning packed from 9:00, so she isn't waiting between dogs (she's paid
//   per dog, not per shift).
// - Today is never offered online; clients call.
// - A day with 6 dogs (full grooms + baths) is full online. The desk can still
//   double-book by phone on busy days, up to about 8.
// Every online booking is a request the desk confirms, so anything unusual is
// sorted out by phone. Why each rule exists: docs/DESIGN.md.
//
// Times are minutes after midnight (540 = 9:00) and dates are "YYYY-MM-DD",
// the same as the staff site.

export const OPEN_FROM_DAYS = 5 // this many days ahead or more: show every free time
export const MAX_DOGS_ONLINE = 6 // full grooms + baths; à la carte doesn't count
export const SMALL_DAY = 2 // on a soon day with this many dogs or fewer, baths may start alongside a groom

const FIRST = 540 // 9:00
const LAST_HOUR = 720 // 12:00, the last full-groom or bath hour (the sheet's 9–12 rows)
const LAST_BATH = 750 // 12:30
const LAST_QUICK = 780 // 1:00, the latest booking on the staff sheet

const FULL_MIN = 60 // Flor takes about one full groom per hour
const BATH_MIN = 30 // the bath table is free again after about 30 minutes; the dog dries in a kennel
const QUICK_MIN = 15 // à la carte: nails, face trim, sanitary trim, anal glands

const QUICK = new Set(['nails', 'face', 'sanitary', 'glands'])
const NOT_COUNTED = new Set(['cancelled', 'noshow', 'moved'])

// Tuesday to Saturday, like the staff sheet.
export function isGroomingDay(date) {
  const day = toDate(date).getDay()
  return day >= 2 && day <= 6
}

export function daysBetween(from, to) {
  return Math.round((toDate(to) - toDate(from)) / 86400000)
}

// The times to offer on one day.
//
// request:  { dogs: [{ service, extra }] }, one dog or two siblings coming together.
//           service is 'full', 'bath' or an à la carte service; extra is the
//           dog's "needs extra time" minutes from its profile (0 if none).
// bookings: that day's appointments from the staff site ({ time, service, status, extra }),
//           including online requests not confirmed yet, so nobody gets the same spot twice.
// dayOff:   Flor is off.
// override: 'closed' or 'open' when the desk has set one for this day.
//
// Returns { status, times }. status is 'ok', 'full' (no times left),
// 'closed' (not a grooming day, or Flor is off) or 'call' (today or earlier).
export function offeredTimes({ date, today, request, bookings = [], dayOff = false, override = null }) {
  const ahead = daysBetween(today, date)
  if (ahead < 1) return { status: 'call', times: [] }
  if (!isGroomingDay(date) || dayOff || override === 'closed') return { status: 'closed', times: [] }

  const active = bookings.filter((b) => b.time != null && !NOT_COUNTED.has(b.status))
  const main = active.filter((b) => !QUICK.has(b.service))
  const dogs = request.dogs
  const quickOnly = dogs.every((d) => QUICK.has(d.service))

  if (!quickOnly && main.length + dogs.length > MAX_DOGS_ONLINE) return { status: 'full', times: [] }

  const open = override === 'open' || ahead >= OPEN_FROM_DAYS
  let times
  if (dogs.some((d) => d.service === 'full')) times = fullTimes(main, dogs, open)
  else if (quickOnly) times = quickTimes(active, main, dogs, open)
  else times = bathTimes(main, dogs, open)

  return { status: times.length ? 'ok' : 'full', times }
}

// Full grooms: one per hour. Two full-groom siblings take that hour and the next.
// A bath sibling with a full groom comes at the same time and dries alongside.
function fullTimes(main, dogs, open) {
  const taken = main.filter((b) => b.service === 'full').map((b) => span(b.time, FULL_MIN + (b.extra || 0)))
  const fulls = dogs.filter((d) => d.service === 'full')
  const length = fulls.length * FULL_MIN + sum(fulls.map((d) => d.extra || 0))
  const free = steps(FIRST, LAST_HOUR, 60).filter(
    (t) => t + (fulls.length - 1) * 60 <= LAST_HOUR && !overlapsAny(span(t, length), taken),
  )
  // A soon day only offers the earliest free hour, so the day fills from 9:00.
  return open ? free : free.slice(0, 1)
}

// Baths run alongside full grooms, but never two baths at once (siblings go one
// after the other). On a soon day, a bath is offered at the half hours inside the
// part of the morning that's already booked, then at the next free hour after it.
// On a small day it may also start at the same time as a groom, so Flor finishes early.
function bathTimes(main, dogs, open) {
  const baths = main.filter((b) => b.service === 'bath').map((b) => span(b.time, BATH_MIN + (b.extra || 0)))
  const length = dogs.length * BATH_MIN + sum(dogs.map((d) => d.extra || 0))
  const fits = (t) => !overlapsAny(span(t, length), baths)

  if (open) return steps(FIRST, LAST_BATH, 30).filter(fits)
  if (!main.length) return steps(FIRST, LAST_HOUR, 60).filter(fits).slice(0, 1)

  const [start, end] = bookedSpan(main)
  const inside = steps(Math.floor(start / 30) * 30, end - 1, 30).filter((t) => t >= start && t <= LAST_BATH)
  const halves = inside.filter((t) => t % 60 === 30)
  const hours = main.length <= SMALL_DAY ? inside.filter((t) => t % 60 === 0) : []
  const next = steps(roundUpToHour(end), LAST_HOUR, 60).filter(fits).slice(0, 1)
  return [...halves, ...hours].filter(fits).concat(next).sort((a, b) => a - b)
}

// À la carte takes about 15 minutes and fits between other dogs. Only another
// à la carte service at the same time gets in the way. On a soon day it's only
// offered while Flor is already there for the other dogs.
function quickTimes(active, main, dogs, open) {
  const quick = active.filter((b) => QUICK.has(b.service)).map((b) => span(b.time, QUICK_MIN))
  const fits = (t) => !overlapsAny(span(t, dogs.length * QUICK_MIN), quick)

  if (open) return steps(FIRST, LAST_QUICK, 15).filter(fits)
  if (!main.length) return steps(FIRST, LAST_QUICK, 15).filter(fits).slice(0, 1)

  const [start, end] = bookedSpan(main)
  return steps(start, Math.min(end, LAST_QUICK), 15).filter(fits)
}

// From the first full groom or bath to when the last one is done.
function bookedSpan(main) {
  const start = Math.min(...main.map((b) => b.time))
  const end = Math.max(...main.map((b) => b.time + (b.service === 'full' ? FULL_MIN : BATH_MIN) + (b.extra || 0)))
  return [start, end]
}

function span(start, length) {
  return [start, start + length]
}

function overlapsAny([start, end], spans) {
  return spans.some(([s, e]) => start < e && s < end)
}

function steps(from, to, every) {
  const list = []
  for (let t = from; t <= to; t += every) list.push(t)
  return list
}

function roundUpToHour(t) {
  return Math.ceil(t / 60) * 60
}

function sum(list) {
  return list.reduce((a, b) => a + b, 0)
}

function toDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
