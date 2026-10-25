import Stripe from 'stripe'
import { supabaseAdmin, getUserFromRequest, getSellerForUser } from '../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Please sign in first.' })

    const { businessName, location } = req.body ?? {}

    // Find this account's seller row, or create it the first time
    let seller = await getSellerForUser(user.id)
    if (!seller) {
      if (!businessName?.trim()) {
        return res.status(400).json({ error: 'Please enter your farm or business name.' })
      }
      const { data, error } = await supabaseAdmin
        .from('sellers')
        .insert({ user_id: user.id, business_name: businessName.trim(), location: (location ?? '').trim() })
        .select()
        .single()
      if (error) throw error
      seller = data
    }

    // Create the Stripe Express account once, and remember it
    let accountId = seller.stripe_account_id
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        business_profile: { name: seller.business_name },
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
        metadata: { homestead_seller_id: seller.id },
      })
      accountId = account.id

      const { error } = await supabaseAdmin
        .from('sellers')
        .update({ stripe_account_id: accountId })
        .eq('id', seller.id)
      if (error) throw error
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.VITE_APP_URL}/seller/onboard/refresh`,
      return_url:  `${process.env.VITE_APP_URL}/seller/onboard/complete`,
      type: 'account_onboarding',
    })

    res.status(200).json({ url: accountLink.url, accountId, sellerId: seller.id })
  } catch (err) {
    console.error('Onboard error:', err)
    res.status(500).json({ error: err.message })
  }
}
