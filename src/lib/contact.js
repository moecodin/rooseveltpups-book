import { supabase } from './supabase.js'

// The shop's phone number, shown wherever a client might want to call instead.
export const PHONE = '(212) 371-8901'
export const PHONE_HREF = 'tel:+12123718901'

// True until the site is connected to Supabase: data stays in this browser,
// any code works, and the desk's buttons can be pretended from here.
export const TEST_MODE = !supabase
