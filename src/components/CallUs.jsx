import { PHONE, PHONE_HREF } from '../lib/contact.js'

export default function CallUs({ text = 'Prefer to call?' }) {
  return (
    <p className="call">
      {text} <a href={PHONE_HREF}>{PHONE}</a>
    </p>
  )
}
