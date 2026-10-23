// Grooming services, with the same names and codes as the staff site
// (rooseveltpups/src/lib/services.js), so requests drop straight onto the sheet.

export const SERVICES = {
  full: 'Full groom',
  bath: 'Bath',
  nails: 'Nails only',
  face: 'Face trim only',
  sanitary: 'Sanitary trim only',
  glands: 'Anal glands only',
}

// What clients see when picking. Descriptions match the public site's grooming page.
export const MAIN_CHOICES = [
  { value: 'full', label: 'Full groom', note: 'Everything in a bath, plus a full haircut' },
  { value: 'bath', label: 'Bath and brush', note: 'Hypoallergenic wash, nails, ears and anal glands' },
  { value: 'alc', label: 'Quick services', note: 'Nails, face or sanitary trim, anal glands: about 15 minutes' },
]

// Quick services ("à la carte" on the staff site).
export const A_LA_CARTE = {
  nails: 'Nails',
  face: 'Face trim',
  sanitary: 'Sanitary trim',
  glands: 'Anal glands',
}

// Their prices, from the public site's Services and Rates page. Full grooms and
// baths aren't priced here: they depend on size and coat.
export const QUICK_PRICES = { nails: 25, face: 35, sanitary: 25, glands: 25 }

export const CUT_STYLES = {
  summer: 'Summer cut',
  half: 'Half-off',
  light: 'Light trim',
}

export const DESHED_EXTRA = 30 // deshedding adds about half an hour

const addonLabel = (value) => (value === 'deshed' ? 'Deshed' : A_LA_CARTE[value])

// A pup's choice as the staff site stores it: { service, addons, cut }.
// Quick-service picks become the first one as the service and the rest as add-ons
// ("Nails only + Anal glands"), like the desk books them.
export function toBooking(choice) {
  if (choice.main === 'full') return { service: 'full', addons: [], cut: choice.cut || '' }
  if (choice.main === 'bath') return { service: 'bath', addons: choice.deshed ? ['deshed'] : [], cut: '' }
  const [first, ...rest] = Object.keys(A_LA_CARTE).filter((k) => choice.quick?.includes(k))
  return first ? { service: first, addons: rest, cut: '' } : null
}

// "Full groom + Summer cut", "Nails only + Anal glands"
export function serviceSummary({ service, addons = [], cut }) {
  return [SERVICES[service], ...addons.map(addonLabel), cut ? CUT_STYLES[cut] : null].filter(Boolean).join(' + ')
}

export function formatPrice(price) {
  return `$${Number(price).toFixed(Number.isInteger(Number(price)) ? 0 : 2)}`
}
