/**
 * Homestead — Email Notifications API
 * POST /api/notifications/email
 *
 * Sends transactional emails via Resend (resend.com).
 * Free tier: 3,000 emails/month — plenty to start.
 *
 * Setup (2 minutes):
 *   1. Sign up at resend.com (free)
 *   2. Add your domain or use their test domain
 *   3. Copy your API key
 *   4. Add RESEND_API_KEY to Vercel environment variables
 *
 * Email types handled:
 *   - order_confirmed   → buyer gets receipt + pickup instructions
 *   - new_message       → seller or buyer gets message notification
 *   - seller_welcome    → new seller welcome + next steps
 *   - boost_expiring    → seller reminder that boost ends in 24h
 *   - subscription_trial_ending → seller reminder 3 days before trial ends
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, to, data } = req.body

  if (!type || !to) {
    return res.status(400).json({ error: 'Missing required fields: type, to' })
  }

  if (!process.env.RESEND_API_KEY) {
    // Silently succeed in dev if key not set — don't break the UI
    console.log(`[Email skipped — no RESEND_API_KEY] type=${type} to=${to}`)
    return res.status(200).json({ sent: false, reason: 'No API key configured' })
  }

  const email = buildEmail(type, to, data)
  if (!email) {
    return res.status(400).json({ error: `Unknown email type: ${type}` })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    process.env.EMAIL_FROM ?? 'Homestead <hello@gethomestead.app>',
        to:      [to],
        subject: email.subject,
        html:    email.html,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend error:', result)
      return res.status(500).json({ error: result.message ?? 'Email send failed' })
    }

    res.status(200).json({ sent: true, id: result.id })
  } catch (err) {
    console.error('Email API error:', err)
    res.status(500).json({ error: err.message })
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

function buildEmail(type, to, data = {}) {
  const base = baseStyle()

  switch (type) {

    case 'order_confirmed':
      return {
        subject: `Order confirmed — ${data.listingName}`,
        html: wrap(`
          ${header('Order confirmed ✅')}
          <p style="${p}">Your order from <strong>${data.sellerName}</strong> is confirmed.</p>
          <div style="${card}">
            <div style="font-size:15px;font-weight:500;margin-bottom:4px;">${data.listingName}</div>
            <div style="color:#666;font-size:13px;">$${data.amount} · ${data.unit}</div>
          </div>
          <p style="${p}">Message <strong>${data.sellerName}</strong> through the app to arrange a pickup time that works for both of you.</p>
          ${cta('View your order', data.appUrl + '/orders')}
          ${footer()}
        `, base),
      }

    case 'new_message':
      return {
        subject: `New message from ${data.senderName} on Homestead`,
        html: wrap(`
          ${header('You have a new message 💬')}
          <p style="${p}"><strong>${data.senderName}</strong> sent you a message about <strong>${data.listingName ?? 'your listing'}</strong>:</p>
          <div style="${card};font-style:italic;color:#444;">"${data.messagePreview}"</div>
          ${cta('Reply now', data.appUrl + '/messages')}
          ${footer()}
        `, base),
      }

    case 'seller_welcome':
      return {
        subject: `Welcome to Homestead, ${data.businessName}! 🌾`,
        html: wrap(`
          ${header('Welcome to Homestead! 🌾')}
          <p style="${p}">You're now set up as a seller on Homestead. Here's how to get your first buyer:</p>
          <div style="margin:20px 0;">
            ${['Add photos to your listing — listings with photos get 3× more views.', 'Write a description that tells your farming story, not just the product specs.', 'Respond to buyer messages within a few hours — speed builds trust.'].map((tip, i) => `
              <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
                <div style="width:24px;height:24px;border-radius:50%;background:#EAF3DE;color:#27500A;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;">${i + 1}</div>
                <div style="font-size:13px;color:#444;line-height:1.5;padding-top:3px;">${tip}</div>
              </div>
            `).join('')}
          </div>
          ${cta('Go to your dashboard', data.appUrl + '/')}
          ${footer()}
        `, base),
      }

    case 'boost_expiring':
      return {
        subject: `Your listing boost expires tomorrow — ${data.listingName}`,
        html: wrap(`
          ${header('Your boost expires in 24 hours ⚡')}
          <p style="${p}">Your boosted listing <strong>"${data.listingName}"</strong> loses its top placement tomorrow.</p>
          <p style="${p}">Renew for another 7 days ($5) or 30 days ($25) to keep appearing at the top of search results.</p>
          ${cta('Renew boost', data.appUrl + '/seller/boost/' + data.listingId)}
          ${footer()}
        `, base),
      }

    case 'subscription_trial_ending':
      return {
        subject: `Your free trial ends in 3 days`,
        html: wrap(`
          ${header('Your trial ends soon 📅')}
          <p style="${p}">Your 14-day free trial of the <strong>${data.plan}</strong> plan ends in 3 days.</p>
          <p style="${p}">After that, your account will move to the free Sprout tier (3 listings, 5% fee). To keep your current features, no action needed — you'll be charged automatically.</p>
          <p style="${p}">To cancel before the trial ends, visit your billing portal.</p>
          ${cta('Manage your plan', data.appUrl + '/seller/plans')}
          ${footer()}
        `, base),
      }

    default:
      return null
  }
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

const p    = 'font-size:14px;color:#444;line-height:1.6;margin:12px 0;'
const card = 'background:#f8f8f5;border-radius:10px;padding:14px 16px;margin:14px 0;font-size:14px;'

function baseStyle() {
  return `body{margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f5f5f0;}
.wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:16px;border:0.5px solid rgba(0,0,0,0.08);overflow:hidden;}
.inner{padding:28px 32px;}`
}

function wrap(content, style) {
  return `<style>${style}</style><div class="wrap"><div class="inner">${content}</div></div>`
}

function header(text) {
  return `
    <div style="margin-bottom:20px;">
      <div style="width:44px;height:44px;background:#EAF3DE;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;">🌾</div>
      <h1 style="font-size:20px;font-weight:500;color:#0f0f0e;margin:0;">${text}</h1>
    </div>
  `
}

function cta(text, url) {
  return `<a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#3B6D11;color:#EAF3DE;text-decoration:none;border-radius:10px;font-size:14px;font-weight:500;">${text} →</a>`
}

function footer() {
  return `
    <div style="margin-top:32px;padding-top:20px;border-top:0.5px solid rgba(0,0,0,0.08);font-size:12px;color:#aaa;line-height:1.6;">
      You're receiving this from Homestead because you have an account. Questions? Reply to this email.
    </div>
  `
}
