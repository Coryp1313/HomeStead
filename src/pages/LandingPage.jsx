/**
 * Homestead — Landing Page (animated)
 *
 * Living background: drifting clouds, swaying wheat, floating pollen,
 * pulsing sun, auto-scrolling listing preview. Pure CSS animation —
 * no libraries, no performance cost, respects prefers-reduced-motion.
 */

import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const PREVIEW_LISTINGS = [
  { emoji: '🥚', name: 'Pasture-raised eggs',   seller: 'Sunridge Farm',       price: '$6.50', dist: '3.2 mi', bg: '#FAEEDA' },
  { emoji: '🍯', name: 'Raw wildflower honey',  seller: 'Mesa Bees Co.',       price: '$14',   dist: '5.8 mi', bg: '#FAEEDA' },
  { emoji: '🥩', name: 'Grass-fed ground beef', seller: 'Poudre Valley Ranch', price: '$9',    dist: '8.1 mi', bg: '#FAECE7' },
  { emoji: '🍅', name: 'Heirloom tomatoes',     seller: 'Dirt & Dew Garden',   price: '$4',    dist: '2.1 mi', bg: '#FAECE7' },
  { emoji: '🧀', name: 'Aged goat cheddar',     seller: 'Happy Hooves',        price: '$11',   dist: '4.4 mi', bg: '#E1F5EE' },
  { emoji: '🍓', name: 'Small-batch jam',       seller: 'Kitchen Roots',       price: '$8',    dist: '6.3 mi', bg: '#FAECE7' },
]

export default function LandingPage({ onEnter }) {
  const { setUser } = useApp()
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [mobile, setMobile]   = useState(false)

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function field(k, v) { setForm(f => ({ ...f, [k]: v })); setError(null) }

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    if (!form.email.includes('@'))               { setError('Please enter a valid email address.'); setLoading(false); return }
    if (form.password.length < 6)                { setError('Password must be at least 6 characters.'); setLoading(false); return }
    if (modal === 'signup' && !form.name.trim()) { setError('Please enter your name.'); setLoading(false); return }
    await new Promise(r => setTimeout(r, 500))
    setUser({
      id: 'user_' + Date.now(),
      name: modal === 'signup' ? form.name.trim() : form.email.split('@')[0],
      email: form.email.trim().toLowerCase(),
      seller: null,
    })
    setLoading(false)
    onEnter()
  }

  function browseAsGuest() {
    setUser({ id: 'guest_' + Date.now(), name: 'Guest', email: '', seller: null, isGuest: true })
    onEnter()
  }

  return (
    <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', background: '#f5f5f0', minHeight: '100vh', overflowX: 'hidden' }}>

      <style>{`
        @keyframes hs-drift    { 0%{transform:translateX(-10%)} 100%{transform:translateX(110%)} }
        @keyframes hs-sway     { 0%,100%{transform:rotate(-2.5deg)} 50%{transform:rotate(2.5deg)} }
        @keyframes hs-float    { 0%{transform:translateY(0) translateX(0);opacity:0} 12%{opacity:.65} 88%{opacity:.4} 100%{transform:translateY(-340px) translateX(45px);opacity:0} }
        @keyframes hs-sun      { 0%,100%{opacity:.26;transform:scale(1)} 50%{opacity:.44;transform:scale(1.09)} }
        @keyframes hs-up       { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hs-slide    { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes hs-blink    { 0%,100%{opacity:1} 50%{opacity:.4} }
        .hs-f1{animation:hs-up .7s ease-out both}
        .hs-f2{animation:hs-up .7s .1s ease-out both}
        .hs-f3{animation:hs-up .7s .22s ease-out both}
        .hs-f4{animation:hs-up .7s .34s ease-out both}
        .hs-cloud{position:absolute;background:rgba(234,243,222,.08);border-radius:100px;animation:hs-drift linear infinite;pointer-events:none}
        .hs-wheat{position:absolute;bottom:0;transform-origin:bottom center;animation:hs-sway ease-in-out infinite}
        .hs-pollen{position:absolute;border-radius:50%;background:#C0DD97;animation:hs-float linear infinite;pointer-events:none}
        .hs-track{display:flex;gap:12px;width:max-content;animation:hs-slide 40s linear infinite}
        .hs-track:hover{animation-play-state:paused}
        @media (prefers-reduced-motion:reduce){.hs-cloud,.hs-wheat,.hs-pollen,.hs-track{animation:none}}
      `}</style>

      <nav style={{ background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,.08)', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, background: '#3B6D11', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌾</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#0f0f0e', lineHeight: 1.15 }}>Homestead</div>
            <div style={{ fontSize: 10, color: '#999' }}>Local organic marketplace</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setModal('login')} style={{ padding: '7px 12px', background: 'transparent', border: 'none', fontSize: 14, cursor: 'pointer', color: '#555', fontFamily: 'inherit' }}>Log in</button>
          <button onClick={() => setModal('signup')} style={{ padding: '8px 15px', background: '#3B6D11', color: '#EAF3DE', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Sign up free</button>
        </div>
      </nav>

      <div style={{ position: 'relative', background: 'linear-gradient(175deg,#0d2103 0%,#173404 45%,#27500A 100%)', padding: mobile ? '3rem 1.25rem 0' : '5rem 1.5rem 0', overflow: 'hidden' }}>

        <div style={{ position: 'absolute', top: '8%', right: '12%', width: 230, height: 230, borderRadius: '50%', background: 'radial-gradient(circle,#97C459 0%,transparent 70%)', animation: 'hs-sun 7s ease-in-out infinite', pointerEvents: 'none' }} />

        <div className="hs-cloud" style={{ top: '13%', width: 175, height: 34, animationDuration: '45s' }} />
        <div className="hs-cloud" style={{ top: '27%', width: 115, height: 24, animationDuration: '62s', animationDelay: '-15s' }} />
        <div className="hs-cloud" style={{ top: '20%', width: 225, height: 40, animationDuration: '78s', animationDelay: '-35s' }} />

        {[...Array(15)].map((_, i) => (
          <div key={i} className="hs-pollen" style={{
            left: `${4 + i * 6.4}%`, bottom: 0,
            width: 3 + (i % 3), height: 3 + (i % 3),
            animationDuration: `${12 + (i % 6) * 2.5}s`,
            animationDelay: `${-i * 1.5}s`, opacity: .5,
          }} />
        ))}

        <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div className="hs-f1" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(151,196,89,.16)', color: '#C0DD97', fontSize: 12, fontWeight: 500, padding: '6px 15px', borderRadius: 999, border: '0.5px solid rgba(151,196,89,.3)', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#97C459', animation: 'hs-blink 2s infinite' }} />
            48 farms selling near Fort Collins
          </div>

          <h1 className="hs-f2" style={{ fontSize: mobile ? 32 : 50, fontWeight: 500, color: '#f2f7eb', lineHeight: 1.12, letterSpacing: -0.8, marginBottom: 18 }}>
            Real food from<br />
            <span style={{ fontStyle: 'italic', color: '#C0DD97' }}>real neighbors.</span>
          </h1>

          <p className="hs-f3" style={{ fontSize: mobile ? 15 : 17, color: '#C0DD97', lineHeight: 1.65, maxWidth: 520, margin: '0 auto 14px' }}>
            Homestead connects you directly with the farms, ranches, and home kitchens in your own community.
          </p>
          <p className="hs-f3" style={{ fontSize: mobile ? 13 : 15, color: 'rgba(192,221,151,.75)', lineHeight: 1.7, maxWidth: 545, margin: '0 auto 30px' }}>
            Eggs collected this morning. Honey pulled from the comb last week. Beef from cattle that grazed open pasture eight miles from your door. No middlemen, no warehouses, no mystery — just you, the person who grew it, and a handshake.
          </p>

          <div className="hs-f4" style={{ display: 'flex', gap: 11, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
            <button onClick={() => setModal('signup')} style={{ padding: mobile ? '13px 26px' : '15px 32px', background: '#EAF3DE', color: '#173404', border: 'none', borderRadius: 11, fontSize: mobile ? 15 : 16, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Start shopping free
            </button>
            <button onClick={browseAsGuest} style={{ padding: mobile ? '13px 22px' : '15px 26px', background: 'rgba(234,243,222,.08)', color: '#C0DD97', border: '0.5px solid rgba(192,221,151,.35)', borderRadius: 11, fontSize: mobile ? 15 : 16, cursor: 'pointer', fontFamily: 'inherit' }}>
              Look around first →
            </button>
          </div>

          <div className="hs-f4" style={{ display: 'flex', gap: 7, justifyContent: 'center', flexWrap: 'wrap', marginBottom: mobile ? 34 : 46 }}>
            {['Free to join', 'No subscription to buy', 'Cancel anytime'].map(t => (
              <span key={t} style={{ fontSize: 11, color: '#97C459', background: 'rgba(151,196,89,.1)', padding: '4px 11px', borderRadius: 999 }}>✓ {t}</span>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, overflow: 'hidden', paddingBottom: mobile ? 70 : 95, WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)' }}>
          <div className="hs-track">
            {[...PREVIEW_LISTINGS, ...PREVIEW_LISTINGS].map((l, i) => (
              <div key={i} style={{ width: 160, background: '#fff', borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '0.5px solid rgba(0,0,0,.06)' }}>
                <div style={{ height: 80, background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>{l.emoji}</div>
                <div style={{ padding: '9px 11px 11px' }}>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>{l.seller} ✓</div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3, marginBottom: 6, color: '#1a1a18' }}>{l.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#27500A' }}>{l.price}</span>
                    <span style={{ fontSize: 10, color: '#aaa' }}>{l.dist}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: mobile ? 65 : 85, pointerEvents: 'none' }}>
          {[...Array(42)].map((_, i) => (
            <div key={i} className="hs-wheat" style={{
              left: `${i * 2.4}%`, width: 2, height: 24 + (i % 5) * 10,
              background: 'linear-gradient(to top,#27500A,#639922)',
              borderRadius: '2px 2px 0 0',
              animationDuration: `${3 + (i % 4) * 0.7}s`,
              animationDelay: `${-i * 0.16}s`, opacity: .5,
            }} />
          ))}
          <svg viewBox="0 0 1200 85" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }}>
            <path d="M0,85 L0,55 Q150,36 300,48 T600,42 T900,53 T1200,40 L1200,85 Z" fill="#f5f5f0" />
          </svg>
        </div>
      </div>

      <div style={{ padding: mobile ? '2.5rem 1rem 1.5rem' : '4rem 1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: mobile ? 24 : 36 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, color: '#639922', textTransform: 'uppercase', marginBottom: 9 }}>How it works</div>
          <h2 style={{ fontSize: mobile ? 21 : 27, fontWeight: 500, color: '#0f0f0e', marginBottom: 10, lineHeight: 1.25 }}>Three steps to your table</h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.65, maxWidth: 460, margin: '0 auto' }}>
            No delivery fees, no subscription boxes, no guessing where it came from.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3,1fr)', gap: 14 }}>
          {[
            { n: '01', icon: '🔍', t: "Find what's near you", d: 'Browse by category or distance. Every listing shows how many miles away the farm is, what certifications they hold, and when it was harvested.' },
            { n: '02', icon: '💬', t: 'Talk to the farmer',   d: 'Message them directly. Ask how the hens are raised, whether the honey is heat-treated, when the next batch is ready. Real answers from real people.' },
            { n: '03', icon: '🤝', t: 'Pick it up fresh',     d: 'Pay securely through the app, then arrange a pickup that works for both of you. Farm gate, farmers market, or a meeting spot in town.' },
          ].map(s => (
            <div key={s.n} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.07)', borderRadius: 14, padding: '1.4rem 1.25rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 15, right: 17, fontSize: 11, fontWeight: 500, color: '#C0DD97', letterSpacing: .5 }}>{s.n}</div>
              <div style={{ width: 44, height: 44, background: '#EAF3DE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 13 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: '#0f0f0e' }}>{s.t}</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: mobile ? '1.5rem 1rem' : '2rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#173404', borderRadius: 16, padding: mobile ? '1.75rem 1.4rem' : '2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(151,196,89,.07)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: mobile ? 'block' : 'flex', gap: 36, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, color: '#97C459', textTransform: 'uppercase', marginBottom: 11 }}>For growers &amp; makers</div>
              <h2 style={{ fontSize: mobile ? 20 : 26, fontWeight: 500, color: '#f2f7eb', marginBottom: 12, lineHeight: 1.25 }}>
                You grew it. You should keep the profit.
              </h2>
              <p style={{ fontSize: 14, color: '#C0DD97', lineHeight: 1.7, marginBottom: 18 }}>
                Skip the farmers market fees and the wholesale middlemen. List what you have, set your own price, and keep 95% of every sale. Stripe deposits straight to your bank each week — no invoicing, no chasing payments.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                {['Free to list your first 3 products', 'Automatic 1099s at tax time', 'Message buyers directly in the app', 'Set your own pickup times and terms'].map(b => (
                  <div key={b} style={{ fontSize: 13, color: '#C0DD97', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <span style={{ color: '#97C459', flexShrink: 0 }}>✓</span>{b}
                  </div>
                ))}
              </div>
              <button onClick={() => setModal('signup')} style={{ padding: '13px 26px', background: '#EAF3DE', color: '#173404', border: 'none', borderRadius: 11, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Start selling — it's free →
              </button>
            </div>
            {!mobile && (
              <div style={{ width: 210, flexShrink: 0 }}>
                <div style={{ background: 'rgba(234,243,222,.07)', border: '0.5px solid rgba(151,196,89,.2)', borderRadius: 13, padding: '1.25rem' }}>
                  <div style={{ fontSize: 11, color: '#97C459', marginBottom: 5 }}>Average monthly earnings</div>
                  <div style={{ fontSize: 32, fontWeight: 500, color: '#f2f7eb', marginBottom: 3 }}>$412</div>
                  <div style={{ fontSize: 11, color: 'rgba(192,221,151,.7)', marginBottom: 16, lineHeight: 1.5 }}>for sellers with 5+ active listings</div>
                  <div style={{ height: 1, background: 'rgba(151,196,89,.15)', marginBottom: 14 }} />
                  {[['Platform fee', '5%'], ['Payout speed', 'Weekly'], ['Setup time', '10 min']].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0' }}>
                      <span style={{ color: 'rgba(192,221,151,.7)' }}>{k}</span>
                      <span style={{ color: '#f2f7eb', fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: mobile ? '1.5rem 1rem 2.5rem' : '2rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 11 }}>
          {[
            { i: '🛡️', t: 'Every farm verified', d: 'We check certifications and visit before approving.' },
            { i: '📍', t: 'Always within 25 mi',  d: "If it can't be picked up locally, it isn't listed." },
            { i: '🔒', t: 'Secure payments',      d: 'Stripe handles checkout. Your card never touches us.' },
            { i: '🌱', t: 'Organic or nothing',   d: 'No synthetic pesticides, no GMOs, no exceptions.' },
          ].map(f => (
            <div key={f.t} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.07)', borderRadius: 13, padding: '1.1rem 1rem' }}>
              <div style={{ fontSize: 23, marginBottom: 9 }}>{f.i}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5, color: '#0f0f0e' }}>{f.t}</div>
              <div style={{ fontSize: 12, color: '#777', lineHeight: 1.55 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#27500A', padding: mobile ? '2.75rem 1.25rem' : '4rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="hs-cloud" style={{ top: '20%', width: 150, height: 30, animationDuration: '52s', background: 'rgba(234,243,222,.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: mobile ? 22 : 30, fontWeight: 500, color: '#f2f7eb', marginBottom: 11, lineHeight: 1.25 }}>
            Your neighbors are already growing it.
          </h2>
          <p style={{ fontSize: mobile ? 14 : 15, color: '#C0DD97', lineHeight: 1.65, maxWidth: 420, margin: '0 auto 26px' }}>
            Join free and see what's available within a few miles of your door this week.
          </p>
          <button onClick={() => setModal('signup')} style={{ padding: mobile ? '13px 28px' : '15px 34px', background: '#EAF3DE', color: '#173404', border: 'none', borderRadius: 11, fontSize: mobile ? 15 : 16, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Create your free account
          </button>
          <div style={{ fontSize: 12, color: 'rgba(192,221,151,.65)', marginTop: 15 }}>Takes 30 seconds · No card required</div>
        </div>
      </div>

      <div style={{ background: '#0d2103', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#C0DD97', marginBottom: 4 }}>🌾 Homestead</div>
        <div style={{ fontSize: 11, color: 'rgba(192,221,151,.5)' }}>Connecting communities through organic, local food</div>
      </div>

      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(13,33,3,.6)', display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: mobile ? 0 : '1rem' }}>
          <div style={{ background: '#fff', borderRadius: mobile ? '20px 20px 0 0' : 18, padding: mobile ? '1.5rem 1.25rem 2rem' : '2rem', maxWidth: 410, width: '100%', maxHeight: mobile ? '92vh' : '90vh', overflowY: 'auto', animation: 'hs-up .3s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, background: '#EAF3DE', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 13px' }}>🌾</div>
              <h2 style={{ fontSize: 19, fontWeight: 500, marginBottom: 5, color: '#0f0f0e' }}>
                {modal === 'login' ? 'Welcome back' : 'Join Homestead free'}
              </h2>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                {modal === 'login' ? 'Log in to see your orders and saved farms.' : 'Browse, buy, or start selling your own goods.'}
              </p>
            </div>

            <form onSubmit={handleAuth}>
              {modal === 'signup' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 5 }}>Your name</label>
                  <input value={form.name} onChange={e => field('name', e.target.value)} autoFocus placeholder="Sarah Johnson"
                    style={{ width: '100%', padding: '12px 13px', borderRadius: 9, border: '0.5px solid rgba(0,0,0,.2)', fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 5 }}>Email address</label>
                <input type="email" value={form.email} onChange={e => field('email', e.target.value)} autoFocus={modal === 'login'} placeholder="you@example.com"
                  style={{ width: '100%', padding: '12px 13px', borderRadius: 9, border: '0.5px solid rgba(0,0,0,.2)', fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 5 }}>Password</label>
                <input type="password" value={form.password} onChange={e => field('password', e.target.value)} placeholder={modal === 'signup' ? 'At least 6 characters' : '••••••••'}
                  style={{ width: '100%', padding: '12px 13px', borderRadius: 9, border: '0.5px solid rgba(0,0,0,.2)', fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              {error && <div style={{ background: '#FCEBEB', color: '#A32D2D', borderRadius: 8, padding: '9px 13px', fontSize: 13, marginBottom: 12 }}>{error}</div>}

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px', background: '#3B6D11', color: '#EAF3DE', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit', opacity: loading ? .7 : 1 }}>
                {loading ? 'One moment…' : modal === 'login' ? 'Log in →' : 'Create free account →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '14px 0', fontSize: 12, color: '#bbb' }}>or</div>

            <button onClick={browseAsGuest}
              style={{ width: '100%', padding: '12px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.15)', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#555', fontFamily: 'inherit' }}>
              Browse without an account
            </button>

            <div style={{ textAlign: 'center', marginTop: 15, fontSize: 13, color: '#888' }}>
              {modal === 'login'
                ? <>New here? <button onClick={() => { setModal('signup'); setError(null) }} style={{ background: 'none', border: 'none', color: '#3B6D11', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'inherit' }}>Create an account</button></>
                : <>Already a member? <button onClick={() => { setModal('login'); setError(null) }} style={{ background: 'none', border: 'none', color: '#3B6D11', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'inherit' }}>Log in</button></>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
