import Stripe from 'stripe'
import { getUserFromRequest, getSellerForUser } from '../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Only open the payout dashboard for the signed-in seller's own account
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Please sign in first.' })

    const seller = await getSellerForUser(user.id)
    if (!seller?.stripe_account_id) {
      return res.status(400).json({ error: 'Connect your bank account first.' })
    }

    const loginLink = await stripe.accounts.createLoginLink(seller.stripe_account_id)
    res.status(200).json({ url: loginLink.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
