// Connection to Supabase (database + logins), the same project as the staff site.
// The two values come from .env.local (and from Netlify's settings once it's online).
// If they're missing, the site runs in test mode: a made-up schedule saved only in
// this browser.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null
