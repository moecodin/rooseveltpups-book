// Each test is an example the owners gave when the rules were agreed.
import { describe, expect, it } from 'vitest'
import { offeredTimes } from './availability.js'

const MONDAY = '2026-10-26'
const TUESDAY = '2026-10-27' // tomorrow
const THURSDAY = '2026-10-29' // 3 days away: soon
const SATURDAY = '2026-10-31' // 5 days away: open
const NEXT_TUESDAY = '2026-11-03' // 8 days away: open

const t = (clock) => {
  const [h, m = '0'] = clock.split(':')
  return Number(h) * 60 + Number(m)
}
const at = (clock, service, more = {}) => ({ time: t(clock), service, status: 'booked', ...more })
const one = (service, extra = 0) => ({ dogs: [{ service, extra }] })

function offer(date, request, bookings, more = {}) {
  return offeredTimes({ date, today: MONDAY, request, bookings, ...more })
}
const clocks = (result) => result.times.map((m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`)

describe('which days can be booked', () => {
  it('sends same-day bookings to the phone', () => {
    expect(offer(MONDAY, one('full'), []).status).toBe('call')
  })

  it('skips Sundays and Mondays, Flor\'s days off and days the desk closed', () => {
    expect(offer('2026-11-01', one('full'), []).status).toBe('closed')
    expect(offer('2026-11-02', one('full'), []).status).toBe('closed')
    expect(offer(THURSDAY, one('full'), [], { dayOff: true }).status).toBe('closed')
    expect(offer(NEXT_TUESDAY, one('full'), [], { override: 'closed' }).status).toBe('closed')
  })

  it('treats 6 dogs as full online', () => {
    const six = ['9', '9', '10', '10', '11', '12'].map((c, i) => at(c, i % 2 ? 'bath' : 'full'))
    expect(offer(TUESDAY, one('full'), six).status).toBe('full')
    expect(offer(TUESDAY, one('bath'), six).status).toBe('full')
  })

  it('doesn\'t count à la carte or cancelled dogs toward the 6', () => {
    const five = ['9', '10', '11', '12'].map((c) => at(c, 'full')).concat(at('9:30', 'bath'))
    const extras = [at('9:15', 'nails'), at('10:15', 'glands'), at('12', 'full', { status: 'cancelled' })]
    expect(offer(TUESDAY, one('bath'), [...five, ...extras]).status).toBe('ok')
  })

  it('counts two siblings as two dogs', () => {
    const five = ['9', '10', '11', '12'].map((c) => at(c, 'full')).concat(at('9:30', 'bath'))
    expect(offer(TUESDAY, { dogs: [{ service: 'bath' }, { service: 'bath' }] }, five).status).toBe('full')
  })

  it('still offers à la carte on a full day', () => {
    const six = ['9', '9', '10', '10', '11', '12'].map((c, i) => at(c, i % 2 ? 'bath' : 'full'))
    expect(offer(TUESDAY, one('nails'), six).status).toBe('ok')
  })
})

describe('full grooms', () => {
  it('offers only 9:00 on an empty day coming up soon', () => {
    expect(clocks(offer(THURSDAY, one('full'), []))).toEqual(['9:00'])
  })

  it('offers only the next hour in line when 9 and 10 are booked', () => {
    expect(clocks(offer(THURSDAY, one('full'), [at('9', 'full'), at('10', 'full')]))).toEqual(['11:00'])
  })

  it('fills a gap first: 9 and 12 booked offers 10', () => {
    expect(clocks(offer(THURSDAY, one('full'), [at('9', 'full'), at('12', 'full')]))).toEqual(['10:00'])
  })

  it('tomorrow with spots left offers only the next one', () => {
    expect(clocks(offer(TUESDAY, one('full'), [at('9', 'full')]))).toEqual(['10:00'])
  })

  it('offers every free hour 5 or more days away', () => {
    expect(clocks(offer(SATURDAY, one('full'), [at('9', 'full')]))).toEqual(['10:00', '11:00', '12:00'])
    expect(clocks(offer(NEXT_TUESDAY, one('full'), []))).toEqual(['9:00', '10:00', '11:00', '12:00'])
  })

  it('offers every free hour when the desk opened the day', () => {
    expect(clocks(offer(THURSDAY, one('full'), [], { override: 'open' }))).toEqual(['9:00', '10:00', '11:00', '12:00'])
  })

  it('gives two full-groom siblings that hour and the next', () => {
    const two = { dogs: [{ service: 'full' }, { service: 'full' }] }
    expect(clocks(offer(NEXT_TUESDAY, two, [at('10', 'full')]))).toEqual(['11:00'])
    expect(clocks(offer(THURSDAY, two, []))).toEqual(['9:00'])
  })

  it('blocks the next hour for a dog that needs extra time', () => {
    expect(clocks(offer(NEXT_TUESDAY, one('full'), [at('9', 'full', { extra: 30 })]))).toEqual(['11:00', '12:00'])
    // 10:00 would run into the 11:00 dog; 12:00 is fine, nobody comes after.
    expect(clocks(offer(NEXT_TUESDAY, one('full', 30), [at('11', 'full')]))).toEqual(['9:00', '12:00'])
  })
})

describe('baths', () => {
  it('grooms at 9 and 10 (a small day): 9:00, 9:30, 10:00, 10:30 and 11:00', () => {
    const day = [at('9', 'full'), at('10', 'full')]
    expect(clocks(offer(THURSDAY, one('bath'), day))).toEqual(['9:00', '9:30', '10:00', '10:30', '11:00'])
  })

  it('bath at 9 and grooms at 10 and 11: the half hours, then 12:00', () => {
    const day = [at('9', 'bath'), at('10', 'full'), at('11', 'full')]
    expect(clocks(offer(THURSDAY, one('bath'), day))).toEqual(['9:30', '10:30', '11:30', '12:00'])
  })

  it('only a bath at 9: next bath at 10:00', () => {
    expect(clocks(offer(THURSDAY, one('bath'), [at('9', 'bath')]))).toEqual(['10:00'])
  })

  it('offers only 9:00 on an empty day coming up soon', () => {
    expect(clocks(offer(THURSDAY, one('bath'), []))).toEqual(['9:00'])
  })

  it('never puts two baths at the same time', () => {
    const day = [at('9', 'full'), at('9:30', 'bath')]
    expect(clocks(offer(THURSDAY, one('bath'), day))).toEqual(['9:00', '10:00'])
  })

  it('offers every :00 and :30 5 or more days away, around other baths', () => {
    expect(clocks(offer(NEXT_TUESDAY, one('bath'), [at('10', 'bath')]))).toEqual([
      '9:00', '9:30', '10:30', '11:00', '11:30', '12:00', '12:30',
    ])
  })
})

describe('à la carte', () => {
  it('9 to 11 booked: any 15 minutes between 9 and 11', () => {
    const day = [at('9', 'full'), at('10', 'full')]
    expect(clocks(offer(THURSDAY, one('nails'), day))).toEqual([
      '9:00', '9:15', '9:30', '9:45', '10:00', '10:15', '10:30', '10:45', '11:00',
    ])
  })

  it('skips a time another à la carte dog already has', () => {
    const day = [at('9', 'full'), at('9:15', 'glands')]
    expect(clocks(offer(THURSDAY, one('nails'), day))).toEqual(['9:00', '9:30', '9:45', '10:00'])
  })

  it('offers only 9:00 on an empty day coming up soon', () => {
    expect(clocks(offer(THURSDAY, one('face'), []))).toEqual(['9:00'])
  })

  it('offers every 15 minutes from 9 to 1, 5 or more days away', () => {
    const times = clocks(offer(NEXT_TUESDAY, one('sanitary'), []))
    expect(times[0]).toBe('9:00')
    expect(times.at(-1)).toBe('13:00')
    expect(times).toHaveLength(17)
  })
})
