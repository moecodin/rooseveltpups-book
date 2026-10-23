// The site's data: the real one in Supabase, or test mode when it isn't set up.
import { TEST_MODE } from '../lib/contact.js'
import { useRemoteStore } from './useRemoteStore.js'
import { useTestStore } from './useTestStore.js'

export const useStore = TEST_MODE ? useTestStore : useRemoteStore
