/**
 * Homestead — Supabase browser client
 *
 * Uses the public "anon" key, which is safe to ship to the browser.
 * What it can read and write is limited by the Row Level Security rules
 * in supabase/schema.sql.
 */

import { createClient } from '@supabase/supabase-js'

// Only the https://xxxx.supabase.co part is wanted. Supabase's dashboard sometimes
// shows the address with /rest/v1 on the end, so strip any extra path.
const url     = cleanUrl(import.meta.env.VITE_SUPABASE_URL)
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — add them in Vercel → Settings → Environment Variables.')
}

function cleanUrl(raw) {
  if (!raw) return raw
  try { return new URL(raw.trim()).origin } catch { return raw.trim() }
}

export const supabaseConfigured = !!(url && anonKey)

// Which Supabase project this build talks to (the address isn't secret)
export const supabaseHost = (() => { try { return new URL(url).host } catch { return url || 'not set' } })()

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing-key')

/**
 * Turns a failed listings load into a plain-language reason, so a setup
 * problem can be spotted from the page itself.
 */
export function explainLoadError(error) {
  const msg  = error?.message ?? String(error ?? '')
  const code = error?.code ?? ''
  if (!supabaseConfigured) {
    return 'The Supabase keys aren\'t in this build. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then redeploy.'
  }
  if (code === '42P01' || code === 'PGRST205' || /does not exist|could not find the table/i.test(msg)) {
    return 'The listings table wasn\'t found. Run supabase/schema.sql in this Supabase project\'s SQL Editor.'
  }
  if (/invalid api key|jwt|apikey|no api key/i.test(msg) || code === 'PGRST301') {
    return 'Supabase rejected the key. Check that VITE_SUPABASE_ANON_KEY is the publishable/anon key from this project.'
  }
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return 'Couldn\'t reach Supabase. Check that VITE_SUPABASE_URL is the Project URL (https://….supabase.co).'
  }
  return msg || 'Unknown error'
}

const BOOST_ACTIVE = l => l.boosted && (!l.boost_expires_at || new Date(l.boost_expires_at) > new Date())

/**
 * Turns a database row (listing + its seller) into the shape the
 * components already use: listing.seller.name, listing.price, etc.
 */
export function toListing(row) {
  const seller = row.seller ?? {}
  return {
    id:          row.id,
    sellerId:    row.seller_id,
    name:        row.name,
    description: row.description,
    price:       Number(row.price),
    unit:        row.unit,
    category:    row.category,
    emoji:       row.emoji,
    bg:          row.bg,
    tags:        row.tags ?? [],
    photoUrl:    row.photo_url,
    boosted:     BOOST_ACTIVE(row),
    active:      row.active,
    isSample:    row.is_sample,
    seller: {
      id:       seller.id,
      name:     seller.business_name,
      location: seller.location,
      dist:     seller.dist,
      emoji:    seller.emoji,
      verified: seller.verified,
      rating:   seller.rating,
      reviews:  seller.reviews,
    },
  }
}

/**
 * Turns a seller row into the shape the dashboard uses.
 */
export function toSeller(row) {
  if (!row) return null
  return {
    id:               row.id,
    businessName:     row.business_name,
    location:         row.location,
    stripeAccountId:  row.stripe_account_id,
    stripeCustomerId: row.stripe_customer_id,
    verified:         row.verified,
    plan:             row.plan,
    planStatus:       row.plan_status,
    joinedAt:         row.created_at,
  }
}

export const LISTING_SELECT = '*, seller:sellers(id, business_name, location, dist, emoji, verified, rating, reviews)'

/**
 * Uploads a listing photo into the signed-in user's own folder and
 * returns its public URL.
 */
export async function uploadListingPhoto(userId, file) {
  const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('listing-photos').upload(path, file, {
    cacheControl: '3600',
    contentType:  file.type,
  })
  if (error) throw error
  return supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl
}
