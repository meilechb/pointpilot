'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveTrip } from '@/lib/dataService'

type Article = {
  id: string
  slug: string
  title: string
  summary: string
  created_at: string
}

export default function Home() {
  const router = useRouter()
  const [showFaq, setShowFaq] = useState(false)

  // Mini trip form state
  const [tripName, setTripName] = useState('')

  // News articles
  const [articles, setArticles] = useState<Article[]>([])
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(data => setArticles(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setArticles([]))
  }, [])

  const handleStartTrip = async () => {
    const trip = {
      id: crypto.randomUUID(),
      tripName: tripName || 'My Trip',
      tripType: 'roundtrip',
      departureCity: '',
      destinationCity: '',
      stops: [],
      legs: [],
      departureDate: '',
      returnDate: '',
      travelers: 1,
      dateFlexibility: 'exact',
      flights: [],
      itineraries: [],
      createdAt: new Date().toISOString(),
    }
    await saveTrip(trip)
    router.push(`/trip/${trip.id}`)
  }

  // Carousel: show 3 articles at a time on desktop
  const visibleArticles = articles.slice(carouselIndex, carouselIndex + 3)
  const canPrev = carouselIndex > 0
  const canNext = carouselIndex + 3 < articles.length

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

  const fieldInput: React.CSSProperties = {
    width: '100%',
    height: 42,
    padding: '10px 12px',
    fontSize: 14,
    color: 'var(--text)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    border: '1.5px solid rgba(255,255,255,0.3)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
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
            Ditch the spreadsheets
          </div>
          <h1 className="hero-title">
            Finally, one place for all your flight options
          </h1>
          <p className="hero-subtitle">
            Stop juggling spreadsheets and browser tabs! Organize all of your booking options, compare cash vs. points, and see exactly which combo saves you the most.
          </p>

          {/* Mini trip form */}
          <div style={{
            maxWidth: 340,
            margin: '28px auto 0',
            display: 'flex',
            gap: 0,
          }}>
            <input
              type="text"
              placeholder="Trip name"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStartTrip() }}
              style={{ ...fieldInput, flex: 1, borderRadius: '10px 0 0 10px', borderRight: 'none' }}
            />
            <button
              onClick={handleStartTrip}
              style={{
                padding: '0 24px',
                height: 42,
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
                color: '#1A1A2E',
                border: 'none',
                borderRadius: '0 10px 10px 0',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(212, 168, 71, 0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 168, 71, 0.4)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 168, 71, 0.3)' }}
            >
              Create Trip
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button
              onClick={() => router.push(tripName ? `/trip/new?name=${encodeURIComponent(tripName)}` : '/trip/new')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500,
              }}
            >
              More options →
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
        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            {
              icon: '💳',
              title: 'Rewards Tracker',
              desc: 'Track balances across Chase, Amex, Citi, Capital One, Bilt, and 90+ airline programs. See transfer partners and bonuses.',
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
              { step: '2', title: 'Check Transfer Partners', desc: 'See transfer partners, active bonuses, and calculate your best options' },
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
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* News Carousel */}
      {articles.length > 0 && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Latest News</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {articles.length > 3 && (
                <>
                  <button
                    onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 3))}
                    disabled={!canPrev}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-card)',
                      cursor: canPrev ? 'pointer' : 'default',
                      color: canPrev ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: 14, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: canPrev ? 1 : 0.4,
                    }}
                  >←</button>
                  <button
                    onClick={() => setCarouselIndex(Math.min(articles.length - 3, carouselIndex + 3))}
                    disabled={!canNext}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-card)',
                      cursor: canNext ? 'pointer' : 'default',
                      color: canNext ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: 14, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: canNext ? 1 : 0.4,
                    }}
                  >→</button>
                </>
              )}
              <a
                href="/news"
                style={{
                  fontSize: 14, color: 'var(--primary)', fontWeight: 600,
                  textDecoration: 'none', marginLeft: 4,
                }}
              >
                All articles →
              </a>
            </div>
          </div>

          <div className="news-carousel" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {visibleArticles.map(article => (
              <a
                key={article.id}
                href={`/news/${article.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div
                  style={{
                    padding: '20px 18px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-light)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <h3 style={{
                    fontSize: 16, fontWeight: 700, lineHeight: 1.3,
                    marginBottom: 8, flex: 1,
                  }}>
                    {article.title}
                  </h3>
                  <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5,
                    marginBottom: 10,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {article.summary}
                  </p>
                  <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                    Read →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

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
              { q: 'How do Transfer Partners work?', a: 'Every wallet entry has a Transfer Partners popup showing transfer partners, ratios, active bonuses, and a calculator to see exactly how many miles your points are worth with bonus transfers.' },
              { q: "How is this different from a spreadsheet?", a: "Built-in transfer partner data, bonus tracking, drag-and-drop trip planning, flight lookup by code, and step-by-step booking playbooks. It knows things a spreadsheet can't." },
              { q: 'Do you book flights for me?', a: "No — we tell you exactly what to do and you book it yourself. You keep full control and earn any booking bonuses." },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '16px 20px',
                borderBottom: i < 5 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.q}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.a}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
