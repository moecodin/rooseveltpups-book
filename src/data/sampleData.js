// Made-up data for trying the site before it's connected to Supabase.
// Nothing here is a real client.

import { daysBetween } from '../lib/availability.js'
import { addDays, todayKey } from '../lib/dates.js'

// Dogs already on the staff site. In test mode, "Pretend the desk linked it"
// finds a match here (dog name + owner last name + phone, like the desk would).
export const STAFF_DOGS = [
  { name: 'Biscuit', lastName: 'Tester', phone: '5550100', breed: 'Maltipoo', lastService: 'Full groom + Summer cut', lastPrice: 110 },
  { name: 'Mochi', lastName: 'Sample', phone: '5550111', breed: 'Shih Tzu', lastService: 'Bath + Deshed', lastPrice: 75 },
  { name: 'Pepper', lastName: 'Example', phone: '5550122', breed: 'Mini Poodle', lastService: 'Full groom', lastPrice: 105 },
]

// Other clients' bookings on each grooming day, made up but the same every time
// for a given date, so the time rules have something to work with.
export function sampleBookings(date) {
  const ahead = daysBetween(todayKey(), date)
  const random = seeded(date)
  // Days coming up soon are busier, like real life.
  const dogs = Math.floor(random() * (ahead < 7 ? 7 : 4))
  const list = []
  const hours = [540, 600, 660, 720]
  for (let i = 0; i < dogs; i++) {
    const full = random() < 0.6
    if (full && hours.length) list.push({ time: hours.splice(Math.floor(random() * Math.min(2, hours.length)), 1)[0], service: 'full', status: 'booked' })
    else list.push({ time: 540 + 30 * (1 + 2 * Math.floor(random() * 4)), service: 'bath', status: 'booked' })
  }
  if (random() < 0.3) list.push({ time: 555, service: 'nails', status: 'booked' })
  return list
}

// A sample day off for Flor, two weeks out, to show how closed days look.
export const SAMPLE_DAYS_OFF = [addDays(todayKey(), 15)]

function seeded(text) {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}
