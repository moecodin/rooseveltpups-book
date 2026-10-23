# Design decisions

Why the booking site works the way it does. Decided with the Roosevelt Pups
owners in October 2026; change this file when a decision changes.

## Why a separate booking site
- Gingr makes grooming-only and walk-only clients answer about 30 questions
  that have nothing to do with grooming, so the desk asks clients to call.
- In Gingr, clients can pick any open time unless the desk blocks slots by hand
  every day. Clients are flexible but pick later times for small reasons, which
  leaves Flor waiting between dogs. She's paid per dog, not per shift.
- This site asks only what grooming needs, offers only the times the desk would
  offer on the phone, and lets the shop finally tell clients to book online.

## Booking flow
- **Requests, not instant bookings.** The client picks a day and a time (or
  "I'm flexible"). The request shows on the staff site as "Requested", and the
  desk confirms it. The client then gets an email and sees "Confirmed".
- **Accounts** use an emailed 6-digit code (no passwords to forget), so returning
  clients don't type everything again.
- **Linking to the staff records:** the desk links a new online client to their
  dog's profile once. The staff site only suggests a match when the **dog name,
  owner last name and phone** all match. Nobody can see someone else's dog.
- **Grooming first, walks second.** The staff site handles grooming today; walks
  need their own staff screen first. Walks will use time windows.

## Which grooming times are offered
The rules live in `src/lib/availability.js`, and each example below is a test in
`src/lib/availability.test.js`.

- **No same-day bookings online**: clients call.
- Tuesday to Saturday only; Flor's days off and days the desk closed are hidden.
- **Soon** (tomorrow to 4 days away): the client sees only what keeps the morning
  packed from 9:00. **Open** (5 or more days away): every free time.
- **6 dogs** (full grooms + baths) makes a day full online. À la carte doesn't
  count. On busy days (holidays, helpers drying) the desk double-books by phone,
  up to about 8.
- **Siblings** come together and count as two dogs. Two full grooms take that
  hour and the next.
- **Needs extra time:** a dog marked on the staff site (nervous, husky, heavy
  deshed) blocks the extra minutes too.
- **Desk overrides** per day: close it, or open every time.

| Service | Soon | Open |
|---|---|---|
| Full groom (about 1 hour, on the hour 9–12) | The earliest free hour only | Every free hour |
| Bath (on :00 and :30, up to 12:30) | Half hours inside the booked part of the morning, then the next free hour. On a day with 2 dogs or fewer, also the same :00 time as a groom, so Flor finishes early | Every free time |
| À la carte (about 15 min, 9:00–1:00) | Any 15 minutes inside the booked part of the morning | Every free 15 minutes |

Examples (Thursday is 3 days away, so it's "soon"):
- Grooms at 9 and 10 → full groom sees **11:00**; bath sees **9:00, 9:30, 10:00,
  10:30, 11:00**; nails sees **9:00 to 11:00** every 15 minutes.
- Bath at 9, grooms at 10 and 11 → bath sees **9:30, 10:30, 11:30, 12:00**.
- Only a bath at 9 → the next bath sees **10:00**.
- Grooms at 9 and 12 → full groom sees **10:00** (fill the gap first).
- Empty day → **9:00** only, for any service.

Two baths never start at the same time; the bath table is free again after
about 30 minutes while the first dog dries in a kennel.

Under the times, the site says:

> Don't see the time you want? Please call us at (212) 371-8901. We try to keep
> things fair for everyone, and we'll do our best to fit you in depending on
> who's already booked that day.

## "I'm flexible"
- On the time step, the client can choose **"Any time that day"** or **"Any day
  and time"** instead of picking a time. The desk picks when it confirms.
- Later: a client's **second** flexible booking gets **10% off** grooming, once.
  Only visits that happened count (not cancelled or no-shows).

## Email
- The domain's email is Google Workspace; DNS is in Squarespace Domains.
- **booking@rooseveltpups.com** is an alias of the info@ mailbox, so replies
  land in the same inbox.
- **Resend** sends the emails (sign-in codes and confirmations) from
  booking@. Its DNS records live on their own names (`resend._domainkey`,
  `send`), so Gmail's records stay untouched.
