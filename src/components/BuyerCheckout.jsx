/**
 * Homestead — Buyer Checkout Component
 *
 * Uses Stripe Elements to collect card details securely in the browser.
 * The card number never touches your server — Stripe tokenises it directly.
 *
 * Usage:
 *   <BuyerCheckout
 *     listing={{ id, name, price, unit, sellerAccountId }}
 *     buyerEmail="buyer@example.com"
 *     onSuccess={() => navigate('/order/success')}
 *     onClose={() => setCheckoutOpen(false)}
 *   />
 */

import { useState, useEffect } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise, createListingPayment } from '../lib/stripe'

// ─── Outer wrapper — loads the PaymentIntent then mounts Stripe Elements ─────

export default function BuyerCheckout({ listing, buyerEmail, onSuccess, onClose }) {
  const [clientSecret, setClientSecret] = useState(null)
  const [loadError, setLoadError]       = useState(null)

  useEffect(() => {
    createListingPayment({
      listingId:       listing.id,
      listingName:     listing.name,
      amountCents:     Math.round(listing.price * 100),
      sellerAccountId: listing.sellerAccountId,
      buyerEmail,
    })
      .then(({ clientSecret }) => setClientSecret(clientSecret))
      .catch(err => setLoadError(err.message))
  }, [listing, buyerEmail])

  if (loadError) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h2 style={styles.modalTitle}>Something went wrong</h2>
          <p style={{ fontSize: 13, color: '#A32D2D' }}>{loadError}</p>
          <button style={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.loadingRow}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <span style={{ fontSize: 14, color: '#555' }}>Preparing checkout…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary:       '#3B6D11',
                colorBackground:    '#ffffff',
                colorText:          '#1a1a18',
                colorDanger:        '#A32D2D',
                fontFamily:         'system-ui, sans-serif',
                borderRadius:       '8px',
              },
            },
          }}
        >
          <CheckoutForm
            listing={listing}
            buyerEmail={buyerEmail}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>
      </div>
    </div>
  )
}

// ─── Inner form — runs inside <Elements> so it can use useStripe() ────────────

function CheckoutForm({ listing, buyerEmail, onSuccess, onClose }) {
  const stripe   = useStripe()
  const elements = useElements()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url:      `${window.location.origin}/order/success`,
        receipt_email:   buyerEmail,
        payment_method_data: {
          billing_details: { email: buyerEmail },
        },
      },
      // Don't redirect — handle success inline
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message)
      setSubmitting(false)
    } else {
      // Payment succeeded
      onSuccess()
    }
  }

  const platformFee = (listing.price * 0.05).toFixed(2)
  const sellerGets  = (listing.price * 0.95).toFixed(2)

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div style={styles.modalHeader}>
        <div>
          <div style={styles.modalTitle}>Complete your order</div>
          <div style={styles.modalSub}>
            {listing.name} — ${listing.price.toFixed(2)} {listing.unit}
          </div>
        </div>
        <button type="button" style={styles.xBtn} onClick={onClose} aria-label="Close">✕</button>
      </div>

      {/* Order summary */}
      <div style={styles.summaryBox}>
        <div style={styles.summaryRow}>
          <span style={{ fontSize: 13 }}>{listing.name}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>${listing.price.toFixed(2)}</span>
        </div>
        <div style={{ ...styles.summaryRow, color: '#888', fontSize: 12 }}>
          <span>Platform fee (5%)</span>
          <span>${platformFee}</span>
        </div>
        <div style={{ ...styles.summaryRow, color: '#888', fontSize: 12 }}>
          <span>Goes to seller</span>
          <span>${sellerGets}</span>
        </div>
        <div style={{ ...styles.summaryRow, borderTop: '0.5px solid #eee', paddingTop: 8, marginTop: 4 }}>
          <span style={{ fontWeight: 500 }}>Total</span>
          <span style={{ fontWeight: 500, color: '#27500A' }}>${listing.price.toFixed(2)}</span>
        </div>
      </div>

      {/* Stripe card element — fully PCI compliant */}
      <div style={{ marginBottom: 16 }}>
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { email: 'never' } },
          }}
        />
      </div>

      {error && <div style={styles.errorMsg}>{error}</div>}

      <button
        type="submit"
        style={{ ...styles.payBtn, opacity: submitting ? 0.7 : 1 }}
        disabled={!stripe || submitting}
      >
        {submitting ? 'Processing…' : `Pay $${listing.price.toFixed(2)}`}
      </button>

      <div style={styles.secureNote}>
        🔒 Payments secured by Stripe. Your card details are never shared with Homestead.
      </div>
    </form>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: '#fff', borderRadius: 16,
    border: '0.5px solid rgba(0,0,0,0.1)',
    padding: '1.5rem', maxWidth: 440, width: '100%',
  },
  loadingRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: '2rem 0',
  },
  modalHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: 500, marginBottom: 2 },
  modalSub:   { fontSize: 12, color: '#666' },
  xBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, color: '#999', padding: 4,
  },
  summaryBox: {
    background: '#f8f8f5', borderRadius: 10,
    padding: '12px 14px', marginBottom: 16,
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between',
    padding: '3px 0',
  },
  errorMsg: {
    background: '#FCEBEB', color: '#A32D2D',
    padding: '8px 12px', borderRadius: 8,
    fontSize: 13, marginBottom: 12,
  },
  payBtn: {
    width: '100%', padding: '13px',
    background: '#3B6D11', color: '#EAF3DE',
    border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  closeBtn: {
    marginTop: 12, padding: '9px 18px',
    border: '0.5px solid rgba(0,0,0,0.15)',
    borderRadius: 8, background: 'transparent',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
  },
  secureNote: {
    fontSize: 11, color: '#999', textAlign: 'center', marginTop: 12,
  },
}
