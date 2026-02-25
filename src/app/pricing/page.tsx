'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'

export default function PricingPage() {
  const { user, session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async () => {
    if (!user || !session) {
      window.location.href = '/login'
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

  const card: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--border-light)',
    padding: 28,
    flex: 1,
    minWidth: 260,
    maxWidth: 360,
  }

  const checkItem = (text: string) => (
    <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
      <span style={{ color: 'var(--success)', fontSize: 16, lineHeight: '1.4' }}>&#10003;</span>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: '1.4' }}>{text}</span>
    </div>
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px 80px' }}>
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
          Detect flights from any booking site
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
          Browse United, Skyscanner, Google Flights, or any airline site. Point Tripper's AI detects flights
          and lets you save them to your trips with one click.
        </p>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>
          How it works
        </h2>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { step: '1', title: 'Browse', desc: 'Search flights on any booking site as usual' },
            { step: '2', title: 'Detect', desc: 'Open the side panel — AI analyzes the page and extracts flights' },
            { step: '3', title: 'Save', desc: 'Pick a flight, select pricing tiers, and add it to your trip' },
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

      {/* Pricing Cards */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
        {/* Free */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Free
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 800 }}>$0</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Try the extension
          </div>
          <div style={{ marginBottom: 20 }}>
            {checkItem('1 flight scan per month')}
            {checkItem('Save flights to trips')}
            {checkItem('Compare cash vs. points')}
            {checkItem('All booking sites supported')}
          </div>
          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center', padding: '11px 20px',
              border: '1.5px solid var(--primary)', color: 'var(--primary)',
              borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Install Extension
          </a>
        </div>

        {/* Pro */}
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
            Most Popular
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Pro
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 800 }}>$4.99</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/month</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Unlimited flight detection
          </div>
          <div style={{ marginBottom: 20 }}>
            {checkItem('Unlimited flight scans')}
            {checkItem('Save flights to trips')}
            {checkItem('Compare cash vs. points')}
            {checkItem('All booking sites supported')}
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
              width: '100%', padding: '12px 20px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
              fontWeight: 600, fontSize: 14, cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Redirecting...' : user ? 'Get Pro' : 'Sign in to upgrade'}
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
          Frequently Asked Questions
        </h2>
        {[
          {
            q: 'Which booking sites are supported?',
            a: 'Point Tripper works with any flight booking website — United, Delta, American Airlines, Skyscanner, Google Flights, Kayak, and more. Our AI analyzes the page content to detect flights.',
          },
          {
            q: 'What counts as a "scan"?',
            a: 'Each time you open the extension side panel and it analyzes a page for flights, that counts as one scan. Viewing previously detected flights does not count.',
          },
          {
            q: 'Can I cancel anytime?',
            a: 'Yes. You can cancel your subscription from your account page at any time. You\'ll keep Pro access until the end of your billing period.',
          },
          {
            q: 'How do I install the extension?',
            a: 'Search for "Point Tripper" in the Chrome Web Store, or click the "Install Extension" button above. After installing, click the extension icon to open the side panel.',
          },
        ].map((faq, i) => (
          <div key={i} style={{
            padding: '16px 0',
            borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{faq.q}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{faq.a}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
