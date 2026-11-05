/**
 * Homestead — saving paid orders
 *
 * Called from two places, so an order is saved even if one of them misses:
 *   - /api/orders/confirm, right after the buyer's payment goes through
 *   - the Stripe webhook (payment_intent.succeeded)
 * Each payment can only ever create one order (stripe_payment_intent_id is unique).
 */

import { supabaseAdmin } from './supabase.js'

export async function recordPaidOrder(paymentIntent) {
  const pi = paymentIntent
  const m  = pi.metadata || {}
  if (pi.status !== 'succeeded' || !m.buyer_id || !m.listing_name) return null

  const { error } = await supabaseAdmin
    .from('orders')
    .upsert({
      stripe_payment_intent_id: pi.id,
      buyer_id:      m.buyer_id,
      seller_id:     m.seller_id || null,
      listing_id:    m.listing_id || null,
      listing_name:  m.listing_name,
      listing_emoji: m.listing_emoji || '🌾',
      unit:          m.unit || 'each',
      amount:        pi.amount / 100,
      platform_fee:  (pi.application_fee_amount || 0) / 100,
      buyer_name:    m.buyer_name || '',
      buyer_email:   pi.receipt_email || '',
    }, { onConflict: 'stripe_payment_intent_id', ignoreDuplicates: true })

  if (error) throw error
  return true
}
