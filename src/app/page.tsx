'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [showFaq, setShowFaq] = useState(false)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Point Tripper',
    url: 'https://pointtripper.com',
    description: 'Track your points, discover transfer bonuses, plan trips, and get step-by-step booking instructions to maximize your credit card rewards.',
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-nav) 0%, #2D2B55 100%)',
        padding: '80px 20px 60px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 20,
            backgroundColor: 'rgba(212, 168, 71, 0.15)',
            color: 'var(--accent)',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
            letterSpacing: 0.5,
          }}>
            Your points command center
          </div>
          <h1 className="hero-title">
            Stop leaving points on the table
          </h1>
          <p className="hero-subtitle">
            Track every point balance, discover transfer bonuses, plan trips with drag-and-drop, and get step-by-step booking playbooks — all in one place.
          </p>
          <div className="hero-buttons">
            <button
              onClick={() => router.push('/wallet')}
              style={{
                padding: '14px 32px',
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
                color: '#1A1A2E',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(212, 168, 71, 0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 168, 71, 0.4)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 168, 71, 0.3)' }}
            >
              Track My Points
            </button>
            <button
              onClick={() => router.push('/trip/new')}
              style={{
                padding: '14px 32px',
                fontSize: 16,
                fontWeight: 600,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'var(--text-inverse)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)' }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
            >
              Plan a Trip
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 20px 40px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          Everything you need to maximize rewards
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
          From tracking balances to booking flights — one app replaces your spreadsheets, browser tabs, and guesswork.
        </p>
        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            {
              icon: '💳',
              title: 'Points Wallet',
              desc: 'Track balances across Chase, Amex, Citi, Capital One, Bilt, and 90+ airline programs. All in one dashboard.',
              link: '/wallet',
            },
            {
              icon: '🔥',
              title: 'Travel Hacks',
              desc: 'See every transfer partner, ratio, and active bonus. Calculate exactly how many miles you\'ll get with bonus transfers.',
              link: '/wallet',
            },
            {
              icon: '✈️',
              title: 'Trip Planner',
              desc: 'Log every flight option you find — cash, points, or both. Drag and drop to build the perfect itinerary.',
              link: '/trip/new',
            },
            {
              icon: '📰',
              title: 'Points News',
              desc: 'Stay on top of transfer bonuses, new routes, and deals. Never miss a limited-time points promotion.',
              link: '/news',
            },
          ].map((item) => (
            <div
              key={item.title}
              onClick={() => router.push(item.link)}
              style={{
                padding: 24,
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
            >
              <div style={{ fontSize: 28, marginBottom: 14 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{
        maxWidth: 800, margin: '0 auto', padding: '20px 20px 40px',
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-light)',
          padding: '32px 36px',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>How it works</h2>
          <div className="how-it-works-steps">
            {[
              { step: '1', title: 'Add your points', desc: 'Enter balances from every bank and airline program you have' },
              { step: '2', title: 'Check Travel Hacks', desc: 'See transfer partners, active bonuses, and calculate your best options' },
              { step: '3', title: 'Plan a trip', desc: 'Create a trip, log every flight option, and drag-drop your favorites into a plan' },
              { step: '4', title: 'Get the playbook', desc: 'See exactly which points to transfer, where to book, and step-by-step instructions' },
            ].map((item, i) => (
              <div key={item.step} className="how-it-works-step">
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: 'var(--text-inverse)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 15, margin: '0 auto 10px',
                }}>
                  {item.step}
                </div>
                {i < 3 && <div className="how-it-works-connector" />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap',
          padding: '24px 20px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-light)',
        }}>
          {[
            { num: '5', label: 'Bank Programs' },
            { num: '90+', label: 'Airline Programs' },
            { num: '78', label: 'Transfer Partners' },
            { num: '100%', label: 'Free' },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{item.num}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 20px 60px' }}>
        <h2
          onClick={() => setShowFaq(!showFaq)}
          style={{
            fontSize: 20, fontWeight: 700, textAlign: 'center',
            cursor: 'pointer', color: 'var(--text)',
            marginBottom: showFaq ? 20 : 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          Frequently Asked Questions
          <span style={{
            fontSize: 14, color: 'var(--text-muted)',
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: showFaq ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>▼</span>
        </h2>

        {showFaq && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border-light)',
            overflow: 'hidden',
          }}>
            {[
              { q: 'Is this free?', a: 'Yes, completely free. No hidden fees, no premium tier.' },
              { q: 'Do I need an account?', a: "Not to get started — your points are saved locally. Sign up for free whenever you want to sync across devices." },
              { q: 'Which points programs do you support?', a: 'Chase Ultimate Rewards, Amex Membership Rewards, Citi ThankYou Points, Capital One Miles, Bilt Rewards, plus 90+ airline frequent flyer programs.' },
              { q: 'What are Travel Hacks?', a: 'Every wallet entry has a Travel Hacks popup showing transfer partners, ratios, active bonuses, and a calculator to see exactly how many miles your points are worth with bonus transfers.' },
              { q: "How is this different from a spreadsheet?", a: "Built-in transfer partner data, bonus tracking, drag-and-drop trip planning, flight lookup by code, and step-by-step booking playbooks. It knows things a spreadsheet can't." },
              { q: 'Do you book flights for me?', a: "No — we tell you exactly what to do and you book it yourself. You keep full control and earn any booking bonuses." },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '16px 20px',
                borderBottom: i < 5 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.q}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.a}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
