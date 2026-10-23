// Date and time helpers. Dates are "YYYY-MM-DD" strings ("date keys") and times
// are minutes after midnight (540 = 9:00), the same as the staff site.

export const BOOK_AHEAD_DAYS = 56 // 8 weeks

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function dateKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return dateKey(new Date())
}

export function addDays(key, days) {
  const date = fromKey(key)
  date.setDate(date.getDate() + days)
  return dateKey(date)
}

// "Tuesday, Oct 27"
export function formatLong(key) {
  const date = fromKey(key)
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}

// { day: "Tue", date: 27, month: "Oct" } for the day buttons
export function dayParts(key) {
  const date = fromKey(key)
  return { day: DAYS[date.getDay()].slice(0, 3), date: date.getDate(), month: MONTHS[date.getMonth()] }
}

// "9:30 AM"
export function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = String(minutes % 60).padStart(2, '0')
  return `${h > 12 ? h - 12 : h}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}
