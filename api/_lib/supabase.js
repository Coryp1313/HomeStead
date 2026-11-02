/**
 * Homestead — server-side Supabase helpers
 *
 * Uses the secret service-role key, which bypasses Row Level Security.
 * Only ever import this from files in /api — never from /src.
 * (Vercel doesn't turn files in folders starting with "_" into routes.)
 */

import { createClient } from '@supabase/supabase-js'

// Only the https://xxxx.supabase.co part is wanted; drop any /rest/v1 etc.
function cleanUrl(raw) {
  if (!raw) return raw
  try { return new URL(raw.trim()).origin } catch { return raw.trim() }
}

export const supabaseAdmin = createClient(
  cleanUrl(process.env.SUPABASE_URL),
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

/**
 * Works out who is calling from the "Authorization: Bearer <token>" header
 * the browser sends. Returns the Supabase user, or null if not signed in.
 */
export async function getUserFromRequest(req) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error) return null
  return data.user
}

/**
 * Returns the seller row belonging to the signed-in caller, or null.
 */
export async function getSellerForUser(userId) {
  const { data } = await supabaseAdmin
    .from('sellers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}
