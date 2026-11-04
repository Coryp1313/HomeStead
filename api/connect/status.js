import Stripe from 'stripe'
import { supabaseAdmin, getUserFromRequest, getSellerForUser } from '../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

/**
 * Checks the signed-in seller's Stripe account and updates their
 * verified badge. Called when Stripe sends them back to Homestead, so it
 * works even if the webhook is slow.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Please sign in first.' })

    const seller = await getSellerForUser(user.id)
    if (!seller?.stripe_account_id) {
      return res.status(200).json({ isActive: false, chargesEnabled: false, payoutsEnabled: false, requirementsDue: [] })
    }

    const account = await stripe.accounts.retrieve(seller.stripe_account_id)

    if (seller.verified !== !!account.charges_enabled) {
      await supabaseAdmin
        .from('sellers')
        .update({ verified: !!account.charges_enabled })
        .eq('id', seller.id)
    }

    res.status(200).json({
      isActive:        account.charges_enabled && account.payouts_enabled,
      chargesEnabled:  account.charges_enabled,
      payoutsEnabled:  account.payouts_enabled,
      requirementsDue: account.requirements?.currently_due ?? [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
