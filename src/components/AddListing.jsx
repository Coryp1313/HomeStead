/**
 * Homestead — Add Listing
 *
 * Form sellers use to put a new product on the marketplace. Saves to the
 * listings table in Supabase, with an optional photo in Supabase Storage.
 * Phone photos are shrunk in the browser first so uploads stay quick.
 */

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { uploadListingPhoto } from '../lib/supabase'

const CATEGORIES = [
  { key: 'eggs',      label: 'Eggs',      emoji: '🥚', bg: 'bg-amber' },
  { key: 'meat',      label: 'Meat',      emoji: '🥩', bg: 'bg-coral' },
  { key: 'honey',     label: 'Honey',     emoji: '🍯', bg: 'bg-amber' },
  { key: 'dairy',     label: 'Dairy',     emoji: '🥛', bg: 'bg-teal'  },
  { key: 'produce',   label: 'Produce',   emoji: '🥬', bg: 'bg-green' },
  { key: 'preserves', label: 'Preserves', emoji: '🍓', bg: 'bg-coral' },
]

const UNITS = ['per dozen', 'per lb', 'per jar', 'per pint', 'per quart', 'per bundle', 'per piece', 'each']

export default function AddListing({ onClose }) {
  const { user, addListing, showToast } = useApp()

  const [form, setForm] = useState({
    name: '', category: 'eggs', price: '', unit: 'per dozen', description: '', tags: '',
  })
  const [photo, setPhoto]     = useState(null)   // File
  const [preview, setPreview] = useState(null)   // object URL for the preview
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  function field(k, v) { setForm(f => ({ ...f, [k]: v })); setError(null) }

  async function pickPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose a photo (JPG or PNG).'); return }
    try {
      const small = await shrinkImage(file)
      setPhoto(small)
      setPreview(URL.createObjectURL(small))
    } catch {
      setError('That photo couldn\'t be read. Try a different one.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const price = Number(form.price)
    if (!form.name.trim())         { setError('Give your listing a name.'); return }
    if (!(price >= 0.5))           { setError('Price must be at least $0.50.'); return }

    setSaving(true)
    setError(null)
    try {
      const photoUrl = photo ? await uploadListingPhoto(user.id, photo) : null
      const cat      = CATEGORIES.find(c => c.key === form.category)

      await addListing({
        name:        form.name.trim(),
        category:    form.category,
        price:       Math.round(price * 100) / 100,
        unit:        form.unit,
        description: form.description.trim(),
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
        emoji:       cat.emoji,
        bg:          cat.bg,
        photo_url:   photoUrl,
      })
      showToast('Your listing is live!', 'success')
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not save your listing. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <form style={s.card} onSubmit={handleSubmit}>
        <div style={s.hd}>
          <div style={{ fontSize: 17, fontWeight: 500 }}>Add a listing</div>
          <button type="button" style={s.xBtn} onClick={onClose} aria-label="Close" disabled={saving}>✕</button>
        </div>

        {/* Photo */}
        <label style={s.photoBox}>
          {preview
            ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>📸</div>
                <div style={{ fontSize: 13 }}>Add a photo (optional)</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>Listings with photos sell much better</div>
              </div>}
          <input type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
        </label>

        <label style={s.label}>What are you selling?</label>
        <input style={s.input} value={form.name} onChange={e => field('name', e.target.value)}
          placeholder="e.g. Farm-fresh brown eggs" maxLength={80} />

        <label style={s.label}>Category</label>
        <div style={s.chips}>
          {CATEGORIES.map(c => (
            <button type="button" key={c.key}
              style={{ ...s.chip, ...(form.category === c.key ? s.chipOn : {}) }}
              onClick={() => field('category', c.key)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>Price ($)</label>
            <input style={s.input} type="number" inputMode="decimal" step="0.01" min="0.50"
              value={form.price} onChange={e => field('price', e.target.value)} placeholder="6.50" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={s.label}>Unit</label>
            <select style={s.input} value={form.unit} onChange={e => field('unit', e.target.value)}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <label style={s.label}>Description</label>
        <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={form.description}
          onChange={e => field('description', e.target.value)} maxLength={600}
          placeholder="How it's raised or made, pickup details, anything buyers should know." />

        <label style={s.label}>Tags <span style={{ color: '#aaa' }}>(separate with commas)</span></label>
        <input style={s.input} value={form.tags} onChange={e => field('tags', e.target.value)}
          placeholder="Pasture-raised, Non-GMO" />

        {error && <div style={s.error}>{error}</div>}

        <button type="submit" style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
          {saving ? 'Saving…' : 'Publish listing'}
        </button>
      </form>
    </div>
  )
}

// Resizes a photo to at most 1600px on its longest side and saves it as JPEG
function shrinkImage(file, maxSize = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale  = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Could not process image'))
        resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.85)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(13,33,3,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' },
  card:    { background: '#fff', borderRadius: 18, padding: '1.25rem 1.25rem 1.5rem', maxWidth: 440, width: '100%', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' },
  hd:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  xBtn:    { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#999', padding: 4 },
  photoBox:{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, borderRadius: 12, background: '#f8f8f5', border: '1px dashed rgba(0,0,0,0.15)', cursor: 'pointer', overflow: 'hidden', marginBottom: 6 },
  label:   { display: 'block', fontSize: 12, color: '#555', margin: '12px 0 5px' },
  input:   { width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.2)', fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' },
  chips:   { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip:    { padding: '6px 11px', borderRadius: 999, border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  chipOn:  { background: '#EAF3DE', borderColor: '#97C459', color: '#27500A', fontWeight: 500 },
  error:   { background: '#FCEBEB', color: '#A32D2D', borderRadius: 8, padding: '9px 13px', fontSize: 13, marginTop: 12 },
  saveBtn: { width: '100%', marginTop: 16, padding: '13px', background: '#3B6D11', color: '#EAF3DE', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
}
