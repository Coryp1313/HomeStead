import Stripe from 'stripe'
import { getUserFromRequest, getSellerForUser } from '../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Only open the billing portal for the signed-in seller's own subscription
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Please sign in first.' })

    const seller = await getSellerForUser(user.id)
    if (!seller?.stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found for your account.' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   seller.stripe_customer_id,
      return_url: `${process.env.VITE_APP_URL}/`,
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
