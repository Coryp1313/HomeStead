/**
 * Homestead — Cart Sidebar
 *
 * Slides in from the right. Each item has its own "Pay" button that
 * opens BuyerCheckout for that specific listing + seller.
 * Multiple items = multiple separate PaymentIntents (one per seller).
 */

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import BuyerCheckout from './BuyerCheckout'

export default function CartSidebar({ open, onClose }) {
  const { cart, removeFromCart, addOrder, showToast, user } = useApp()
  const [checkoutItem, setCheckoutItem] = useState(null)

  function handleItemSuccess(listing) {
    setCheckoutItem(null)
    addOrder(listing)
    removeFromCart(listing.id)
    showToast(`Order placed — message ${listing.seller?.name} to arrange pickup!`, 'success')
  }

  const total = cart.reduce((sum, l) => sum + l.price, 0)

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={s.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div style={s.drawer} role="dialog" aria-label="Cart">
        <div style={s.header}>
          <span style={s.title}>Your cart ({cart.length})</span>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {cart.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Cart is empty</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              Click "Buy now" on any listing to add it here.
            </div>
          </div>
        ) : (
          <>
            <div style={s.items}>
              {cart.map(listing => (
                <div key={listing.id} style={s.item}>
                  <div style={s.itemThumb}>{listing.emoji}</div>
                  <div style={s.itemInfo}>
                    <div style={s.itemName}>{listing.name}</div>
                    <div style={s.itemSeller}>{listing.seller?.name}</div>
                    <div style={s.itemPrice}>${listing.price.toFixed(2)} {listing.unit}</div>
                  </div>
                  <div style={s.itemActions}>
                    <button
                      style={s.payItemBtn}
                      onClick={() => setCheckoutItem(listing)}
                    >
                      Pay
                    </button>
                    <button
                      style={s.removeBtn}
                      onClick={() => removeFromCart(listing.id)}
                      aria-label={`Remove ${listing.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.footer}>
              <div style={s.totalRow}>
                <span style={s.totalLabel}>Cart total</span>
                <span style={s.totalAmount}>${total.toFixed(2)}</span>
              </div>
              <div style={s.footerNote}>
                Each item is paid separately to its seller. Stripe handles the splits.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Per-item checkout modal */}
      {checkoutItem && (
        <BuyerCheckout
          listing={checkoutItem}
          buyerEmail={user.email}
          onSuccess={() => handleItemSuccess(checkoutItem)}
          onClose={() => setCheckoutItem(null)}
        />
      )}
    </>
  )
}

const s = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 200,
  },
  drawer: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 340, maxWidth: '90vw',
    background: '#fff',
    zIndex: 201,
    display: 'flex', flexDirection: 'column',
    fontFamily: 'system-ui, sans-serif',
    borderLeft: '0.5px solid rgba(0,0,0,0.1)',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '0.5px solid rgba(0,0,0,0.09)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title:    { fontSize: 15, fontWeight: 500 },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, color: '#888', padding: 4,
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '2rem',
    textAlign: 'center',
  },
  items: { flex: 1, overflowY: 'auto', padding: '12px 16px' },
  item: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    padding: '12px 0',
    borderBottom: '0.5px solid rgba(0,0,0,0.07)',
  },
  itemThumb: {
    width: 44, height: 44, borderRadius: 10,
    background: '#EAF3DE', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 22, flexShrink: 0,
  },
  itemInfo:   { flex: 1 },
  itemName:   { fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 2 },
  itemSeller: { fontSize: 11, color: '#888', marginBottom: 3 },
  itemPrice:  { fontSize: 13, color: '#27500A', fontWeight: 500 },
  itemActions: { display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' },
  payItemBtn: {
    padding: '5px 12px',
    background: '#3B6D11', color: '#EAF3DE',
    border: 'none', borderRadius: 6,
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  removeBtn: {
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 12, color: '#bbb', padding: 2,
  },
  footer: {
    padding: '14px 20px',
    borderTop: '0.5px solid rgba(0,0,0,0.09)',
  },
  totalRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 6,
  },
  totalLabel:  { fontSize: 13, fontWeight: 500 },
  totalAmount: { fontSize: 18, fontWeight: 500, color: '#27500A' },
  footerNote:  { fontSize: 11, color: '#aaa', lineHeight: 1.5 },
}
