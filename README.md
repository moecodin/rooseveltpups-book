# Roosevelt Pups – Client Booking

A simple booking site for grooming (and later walks), planned for
**book.rooseveltpups.com**. Clients ask for a spot in a few taps, without Gingr's
long sign-up. Every booking is a **request** that goes straight to the front
desk on the staff site (staff.rooseveltpups.com), and the client gets an email
once the desk confirms.

Gingr stays for boarding, daycare, and pick-up/drop-off.

How it works and why: [docs/DESIGN.md](docs/DESIGN.md).

## Status
- [x] Grooming availability rules, with tests (`src/lib/availability.js`)
- [x] Booking screens (React + Vite + Bootstrap, like the staff site), in test mode
- [ ] Client sign-in with an email code (Supabase)
- [ ] Requests appear on the staff site; desk confirms and links each client to their dog
- [ ] Confirmation emails from booking@rooseveltpups.com (Resend)
- [ ] "I'm flexible" discount
- [ ] Walks

## Run it on your computer
Needs [Node.js](https://nodejs.org) installed.

```bash
npm install     # first time only
npm run dev     # starts the site at http://localhost:5173
npm test        # checks the booking rules against the owners' examples
```

Until it's connected to Supabase the site runs in **test mode**: a made-up
schedule, any 6-digit code signs you in, nothing is emailed, and everything is
saved only in your browser ("Start over" at the bottom erases it). Buttons marked
"Test:" pretend to be the front desk linking a pup or confirming a request.

## Where things are
| Folder | What's in it |
|---|---|
| `src/App.jsx` | Which screen to show |
| `src/screens/` | `SignIn` (mockup A), `PupForm` (first time / returning), `Book` (the 4 steps), `Home` |
| `src/state/useStore.js` | All the data and every way it can change. The only file that will talk to Supabase |
| `src/lib/availability.js` | Which times clients are offered (with tests) |
| `src/lib/` | Dates, services, contact details |
| `src/data/sampleData.js` | Made-up schedule and staff records for test mode |
| `mockups/` | The sign-in page mockups the owners picked from |

## Data rules
Same as the staff site: keep data minimal (dog name, owner last name, breed,
phone, email, service, date/time, notes), no addresses, made-up test data only
during development, and never commit secret keys.
