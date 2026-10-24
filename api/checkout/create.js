import Stripe from 'stripe'
import { supabaseAdmin } from '../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Free (Sprout) sellers pay a 5% fee; Grower and Harvest plans pay 0%
const PLATFORM_FEE_PERCENT = { sprout: 5, grower: 0, harvest: 0 }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { listingId, buyerEmail } = req.body

    // Look up the price and seller ourselves, so nobody can change the
    // price or payout account from their browser.
    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select('id, name, price, active, is_sample, seller:sellers(id, stripe_account_id, plan, plan_status)')
      .eq('id', listingId)
      .maybeSingle()
    if (error) throw error

    if (!listing || !listing.active) {
      return res.status(404).json({ error: 'This listing is no longer available.' })
    }
    if (listing.is_sample) {
      return res.status(400).json({ error: 'This is a sample listing and can\'t be purchased.' })
    }
    if (!listing.seller?.stripe_account_id) {
      return res.status(400).json({ error: 'This seller hasn\'t finished setting up payouts yet.' })
    }

    const amountCents      = Math.round(Number(listing.price) * 100)
    const paidPlanActive   = ['active', 'trialing'].includes(listing.seller.plan_status)
    const feePercent       = paidPlanActive ? (PLATFORM_FEE_PERCENT[listing.seller.plan] ?? 5) : 5
    const platformFeeCents = Math.round(amountCents * (feePercent / 100))

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: 'usd',
      receipt_email: buyerEmail,
      transfer_data: {
        destination: listing.seller.stripe_account_id,
      },
      ...(platformFeeCents > 0 && { application_fee_amount: platformFeeCents }),
      metadata: {
        listing_id:   listing.id,
        listing_name: listing.name,
        seller_id:    listing.seller.id,
      },
    })

    res.status(200).json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('Checkout error:', err)
    res.status(500).json({ error: err.message })
  }
}
