'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  )
}

function PricingContent() {
  const { user, session, signOut } = useAuth()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const expectedEmail = searchParams.get('email')
  const wrongAccount = expectedEmail && user && user.email !== expectedEmail

  const handleUpgrade = async () => {
    if (!user || !session) {
      window.location.href = expectedEmail
        ? `/login?redirect=${encodeURIComponent('/pricing?email=' + encodeURIComponent(expectedEmail))}`
        : '/login?redirect=/pricing'
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout')
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const checkItem = (text: string) => (
    <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
      <span style={{ color: 'var(--success)', fontSize: 16, lineHeight: '1.4' }}>&#10003;</span>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: '1.4' }}>{text}</span>
    </div>
  )

  const card: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--border-light)',
    padding: 28,
    flex: 1,
    minWidth: 280,
    maxWidth: 380,
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 20,
          backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
          fontSize: 13, fontWeight: 600, marginBottom: 16,
        }}>
          Chrome Extension
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
          Add flights to your trips in one click
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.6 }}>
          Stop copying flight details by hand. Point Tripper&apos;s Chrome extension automatically detects flights
          from any search results page and lets you save them to your trips instantly.
        </p>
        <a
          href="https://chromewebstore.google.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
            fontWeight: 600, fontSize: 15, textDecoration: 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Chrome Extension
        </a>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>
          How it works
        </h2>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { step: '1', title: 'Search flights', desc: 'Browse any flight booking or airline website as you normally would' },
            { step: '2', title: 'Auto-detect', desc: 'Open the extension — AI reads the page and extracts every flight automatically' },
            { step: '3', title: 'Save to trip', desc: 'Pick a flight, choose your pricing tiers, and add it to your trip with one click' },
          ].map(s => (
            <div key={s.step} style={{
              flex: 1, minWidth: 180, textAlign: 'center', padding: '20px 16px',
              backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto 10px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16,
              }}>{s.step}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wrong account warning */}
      {wrongAccount && (
        <div style={{
          maxWidth: 560, margin: '0 auto 24px', padding: '14px 18px',
          backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 'var(--radius)',
          fontSize: 14, lineHeight: 1.6,
        }}>
          <strong>Wrong account.</strong> You&apos;re logged in as <strong>{user.email}</strong>, but the extension
          is signed in as <strong>{expectedEmail}</strong>.{' '}
          <button
            onClick={async () => {
              await signOut()
              window.location.href = `/login?redirect=${encodeURIComponent('/pricing?email=' + encodeURIComponent(expectedEmail!))}`
            }}
            style={{
              background: 'none', border: 'none', color: '#B45309',
              textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: 0,
            }}
          >
            Switch account
          </button>
        </div>
      )}

      {/* Two pricing cards */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>

        {/* Try Free card */}
        <div style={card}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Try it free
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800 }}>$0</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              1 free scan to test it out
            </div>
          </div>

          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24, textAlign: 'center' }}>
            Try it out with 1 free scan each month. No credit card required.
          </div>

          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center', padding: '12px 20px',
              border: '1.5px solid var(--primary)', color: 'var(--primary)',
              borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Try It Free
          </a>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Install from Chrome Web Store
          </div>
        </div>

        {/* Pro card */}
        <div style={{
          ...card,
          border: '2px solid var(--primary)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
            padding: '4px 14px', borderRadius: 20,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'white', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            Recommended
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Point Tripper Pro
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800 }}>$4.99</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/month</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Unlimited flight detection
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            {checkItem('Unlimited flight scans')}
            {checkItem('Auto-detect flights from any page')}
            {checkItem('Save flights to your trips')}
            {checkItem('Compare cash vs. points pricing')}
            {checkItem('Works on any airline or travel site')}
            {checkItem('Priority support')}
          </div>

          {error && (
            <div style={{
              padding: '8px 12px', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)',
              border: '1px solid #FECACA', fontSize: 13, color: 'var(--danger)', marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              width: '100%', padding: '13px 20px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
              fontWeight: 600, fontSize: 15, cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Redirecting...' : user ? 'Get Pro Access' : 'Sign in to upgrade'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Cancel anytime from your account
          </div>
        </div>
      </div>

      {/* Download CTA banner */}
      <div style={{
        maxWidth: 560, margin: '0 auto 48px', padding: '24px 28px',
        backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
          Already have an account?
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Download the Chrome extension and sign in to start scanning flights.
        </div>
        <a
          href="https://chromewebstore.google.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 24px',
            backgroundColor: 'var(--bg)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14,
            color: 'var(--text)', textDecoration: 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Chrome Extension
        </a>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
          Frequently Asked Questions
        </h2>
        {[
          {
            q: 'Which booking sites are supported?',
            a: 'Point Tripper works with any flight booking website. Our AI analyzes the page content to detect flights — no special integration required.',
          },
          {
            q: 'Can I try it before paying?',
            a: 'Yes! Install the extension and get 1 free scan per month. If you like it, upgrade to Pro for unlimited scans at $4.99/month.',
          },
          {
            q: 'What counts as a "scan"?',
            a: 'Each time you open the extension and it analyzes a page for flights, that counts as one scan. Viewing previously detected flights does not count.',
          },
          {
            q: 'Can I cancel anytime?',
            a: 'Yes. You can cancel your subscription from your account page at any time. You\'ll keep Pro access until the end of your billing period.',
          },
          {
            q: 'How do I install the extension?',
            a: 'Click "Try It Free" or "Download Chrome Extension" above to install from the Chrome Web Store. After installing, click the extension icon on any flight search page to get started.',
          },
        ].map((faq, i) => (
          <div key={i} style={{
            padding: '16px 0',
            borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{faq.q}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{faq.a}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
