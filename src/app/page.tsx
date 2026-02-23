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
    description: 'Organize flight options, compare cash vs. points, and get step-by-step booking instructions using your credit card rewards.',
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
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
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
            Ditch the spreadsheets
          </div>
          <h1 className="hero-title">
            Finally, one place for all your flight options
          </h1>
          <p className="hero-subtitle">
            Stop juggling spreadsheets and browser tabs! Organize all of your booking options, compare cash vs. points, and see exactly which combo saves you the most.
          </p>
          <div className="hero-buttons">
            <button
              onClick={() => router.push('/trip/new')}
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
              Start a Trip →
            </button>
            <button
              onClick={() => router.push('/wallet')}
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
              My Points
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '56px 20px 40px' }}>
        <div className="features-grid">
          {[
            { icon: '📋', title: 'Organize options', desc: 'Log every flight you find — cash price, points cost, airline, routing. All in one place instead of scattered notes.' },
            { icon: '⚖️', title: 'Compare everything', desc: 'See all your options side by side. Drag flights into plans and instantly see total costs across points and cash.' },
            { icon: '🗺️', title: 'Get the playbook', desc: 'We know every transfer partner. Once you pick a plan, we tell you exactly which points to transfer and where.' },
          ].map((item) => (
            <div key={item.title} style={{
              padding: 24,
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-light)',
            }}>
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
              { step: '1', title: 'Create a trip', desc: 'Set your route — round trip, one-way, or multi-city' },
              { step: '2', title: 'Add every option', desc: 'Log flights with cash prices, points costs, or both' },
              { step: '3', title: 'Enter your balances', desc: 'Add your points across all banks and airlines' },
              { step: '4', title: 'Build your plan', desc: 'Assign the best flights and get step-by-step booking instructions' },
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
              { q: 'Is this free?', a: 'Yes, completely free.' },
              { q: 'Do I need an account?', a: "Not to get started — just dive in. Sign up for free whenever you're ready to save your work." },              { q: 'Which points programs do you support?', a: 'Chase, Amex, Citi, Capital One, Bilt, and all major airline programs. We know every transfer partner and ratio.' },
              { q: "How is this different from a spreadsheet?", a: "It's built for this. Auto-lookup flights by code, drag-and-drop trip planning, transfer partner logic built in, and step-by-step booking instructions you'd never get from a spreadsheet." },
              { q: 'Do you book flights for me?', a: "No — we tell you exactly what to do and you book it yourself. That way you keep full control and earn any booking bonuses." },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '16px 20px',
                borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none',
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
