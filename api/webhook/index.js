import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const config = {
  api: {
    bodyParser: false,
  },
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig     = req.headers['stripe-signature']
  const rawBody = await getRawBody(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`Stripe event: ${event.type}`)

  switch (event.type) {

    case 'account.updated': {
      const account = event.data.object
      if (account.charges_enabled) {
        console.log(`Seller ${account.metadata?.homestead_seller_id} verified`)
        // TODO: await db.sellers.update({ stripeAccountId: account.id }, { status: 'active' })
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub      = event.data.object
      const sellerId = sub.metadata?.homestead_seller_id
      const plan     = sub.metadata?.plan
      const status   = sub.status
      console.log(`Seller ${sellerId} subscription ${status} on ${plan} plan`)
      // TODO: await db.sellers.update({ id: sellerId }, { plan, subscriptionStatus: status })
      break
    }

    case 'customer.subscription.deleted': {
      const sub      = event.data.object
      const sellerId = sub.metadata?.homestead_seller_id
      console.log(`Seller ${sellerId} cancelled subscription`)
      // TODO: await db.sellers.update({ id: sellerId }, { plan: 'sprout' })
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object
      console.log(`Payment succeeded: $${(pi.amount / 100).toFixed(2)} for "${pi.metadata?.listing_name}"`)
      // TODO: await db.orders.create({ listingId: pi.metadata?.listing_id, amount: pi.amount })
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.metadata?.boost_type) {
        const { listing_id, boost_type } = session.metadata
        const days      = boost_type === 'boost_7' ? 7 : 30
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        console.log(`Listing ${listing_id} boosted for ${days} days until ${expiresAt.toISOString()}`)
        // TODO: await db.listings.update({ id: listing_id }, { boosted: true, boostExpiresAt: expiresAt })
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object
      console.log(`Payment failed for ${pi.receipt_email}: ${pi.last_payment_error?.message}`)
      // TODO: send failure email to buyer
      break
    }

    default:
      break
  }

  res.status(200).json({ received: true })
}
