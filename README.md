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
- [x] Connected to Supabase: email-code sign-in, pups, uploads, requests (needs the email settings below)
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

To use the real database, copy `.env.example` to `.env.local` and fill in the
same two values as the staff site. With them empty, the site runs in **test mode**: a made-up
schedule, any 6-digit code signs you in, nothing is emailed, and everything is
saved only in your browser ("Start over" at the bottom erases it). Buttons marked
"Test:" pretend to be the front desk linking a pup or confirming a request.

## Where things are
| Folder | What's in it |
|---|---|
| `src/App.jsx` | Which screen to show |
| `src/screens/` | `SignIn` (mockup A), `PupForm` (first time / returning), `Book` (the 4 steps), `Home` |
| `src/state/useRemoteStore.js` | All the data and every way it can change, in Supabase. The only file that talks to it |
| `src/state/useTestStore.js` | The same, for test mode (saved in this browser) |
| `src/lib/availability.js` | Which times clients are offered (with tests) |
| `src/lib/` | Dates, services, contact details |
| `src/data/sampleData.js` | Made-up schedule and staff records for test mode |
| `mockups/` | The sign-in page mockups the owners picked from |

## Data rules
Same as the staff site: keep data minimal (dog name, owner last name, breed,
phone, email, service, date/time, notes), no addresses, made-up test data only
during development, and never commit secret keys.

## Supabase settings this site needs
In the Supabase dashboard (the same project as the staff site):
- **Authentication → Emails → SMTP Settings:** custom SMTP through Resend
  (host `smtp.resend.com`, port `465`, username `resend`, password = a Resend API
  key), sender `booking@rooseveltpups.com`, name "Roosevelt Pups".
- **Authentication → Emails → Templates:** "Magic Link" and "Confirm signup"
  show the code with `{{ .Token }}`.
- **Authentication → Sign In / Providers → Email:** OTP length 6, OTP expiry 600 seconds.
- **Allow new users to sign up: on**, only once the staff site has the Requests
  screen (new accounts are clients and see nothing of the staff data; update 007).
