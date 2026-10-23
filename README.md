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
- [ ] Booking screens (React + Vite + Bootstrap, like the staff site)
- [ ] Client sign-in with an email code (Supabase)
- [ ] Requests appear on the staff site; desk confirms and links each client to their dog
- [ ] Confirmation emails from booking@rooseveltpups.com (Resend)
- [ ] "I'm flexible" discount
- [ ] Walks

## Run the tests
Needs [Node.js](https://nodejs.org) installed.

```bash
npm install     # first time only
npm test        # checks the booking rules against the owners' examples
```

## Data rules
Same as the staff site: keep data minimal (dog name, owner last name, breed,
phone, email, service, date/time, notes), no addresses, made-up test data only
during development, and never commit secret keys.
