/**
 * POST /api/orders/confirm  { paymentIntentId }
 *
 * The buyer's browser calls this right after Stripe says the payment went
 * through. We double-check with Stripe ourselves before saving the order.
 */

import Stripe from 'stripe'
import { getUserFromRequest } from '../_lib/supabase.js'
import { recordPaidOrder } from '../_lib/orders.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Please log in.' })

    const { paymentIntentId } = req.body || {}
    if (typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
      return res.status(400).json({ error: 'Missing payment.' })
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (pi.metadata?.buyer_id !== user.id) {
      return res.status(403).json({ error: 'This payment belongs to someone else.' })
    }
    if (pi.status !== 'succeeded') {
      return res.status(409).json({ error: 'The payment hasn\'t gone through yet.' })
    }

    await recordPaidOrder(pi)
    res.status(200).json({ saved: true })
  } catch (err) {
    console.error('Order confirm error:', err)
    res.status(500).json({ error: err.message })
  }
}
