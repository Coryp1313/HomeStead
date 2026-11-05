/**
 * Homestead — how many active listings each plan allows.
 * The database enforces the same numbers (supabase/listing-limits.sql);
 * this copy just lets the app explain the limit before someone hits it.
 * A paid plan only counts while its subscription is active or trialing.
 */

const LIMITS = { sprout: 3, grower: 25, harvest: Infinity }

export function listingLimit(seller) {
  if (!seller) return LIMITS.sprout
  const paid = ['active', 'trialing'].includes(seller.planStatus)
  return paid ? (LIMITS[seller.plan] ?? LIMITS.sprout) : LIMITS.sprout
}
