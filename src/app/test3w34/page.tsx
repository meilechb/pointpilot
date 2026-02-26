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

export default function NewHomepage() {
  const router = useRouter()
  const [tripName, setTripName] = useState('')
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
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  const fieldInput: React.CSSProperties = {
    width: '100%', height: 48, padding: '12px 16px', fontSize: 15,
    color: 'var(--text)', backgroundColor: 'rgba(255,255,255,0.95)',
    border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-sm)', outline: 'none',
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ===== HERO ===== */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-nav) 0%, #2D2B55 100%)',
        padding: '100px 20px 80px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{
            fontSize: 44, fontWeight: 800, color: 'var(--text-inverse)',
            lineHeight: 1.15, marginBottom: 16, letterSpacing: -0.5,
          }}>
            Flight planning, visualized.
          </h1>
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
            maxWidth: 480, margin: '0 auto 36px',
          }}>
            Stop juggling spreadsheets and browser tabs! Organize all of your booking options, compare cash vs. points, and see exactly which combo saves you the most.
          </p>

          <div style={{ maxWidth: 380, margin: '0 auto', display: 'flex', gap: 0 }}>
            <input
              type="text" placeholder="Name your trip" value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStartTrip() }}
              style={{ ...fieldInput, flex: 1, borderRadius: '12px 0 0 12px', borderRight: 'none' }}
            />
            <button
              onClick={handleStartTrip}
              style={{
                padding: '0 28px', height: 48, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent), #E8C36A)', color: '#1A1A2E',
                border: 'none', borderRadius: '0 12px 12px 0', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(212, 168, 71, 0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 168, 71, 0.4)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(212, 168, 71, 0.3)' }}
            >
              Start Free
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button
              onClick={() => router.push(tripName ? `/trip/new?name=${encodeURIComponent(tripName)}` : '/trip/new')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 500 }}
            >
              Advanced options &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
            {['Free to use', 'No booking required', '90+ loyalty programs'].map(t => (
              <span key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--accent)', fontSize: 14 }}>&#10003;</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 3 PILLARS ===== */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 20px 56px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Three tools. One place.</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto' }}>
            Replace your spreadsheets, sticky notes, and open tabs.
          </p>
        </div>

        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            {
              icon: '✈',
              title: 'Trip Planner',
              desc: 'Add flights, build itineraries, compare side by side.',
              link: '/trip/new',
              cta: 'Start a trip',
            },
            {
              icon: '💳',
              title: 'Points Wallet',
              desc: 'Track balances, transfer partners, and active bonuses.',
              link: '/wallet',
              cta: 'View wallet',
            },
            {
              icon: '🧩',
              title: 'Chrome Extension',
              desc: 'Auto-detect flights from any booking site. One click to save.',
              link: '/pricing',
              cta: 'Get extension',
            },
          ].map((item) => (
            <div
              key={item.title}
              onClick={() => router.push(item.link)}
              style={{
                padding: 28, backgroundColor: 'var(--bg-card)', borderRadius: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border-light)',
                cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <div style={{ fontSize: 36, marginBottom: 18, lineHeight: 1 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, flex: 1, marginBottom: 18 }}>{item.desc}</div>
              <span style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>{item.cta} &rarr;</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <div style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>How it works</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Four steps from search to booking.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }} className="how-it-works-steps">
            {[
              { num: '1', title: 'Add points', desc: 'Enter your balances' },
              { num: '2', title: 'Add flights', desc: 'Log every option you find' },
              { num: '3', title: 'Compare', desc: 'Cash vs. points, side by side' },
              { num: '4', title: 'Book', desc: 'Follow step-by-step instructions' },
            ].map((s, i) => (
              <div key={s.num} style={{ textAlign: 'center', position: 'relative', padding: '0 12px' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 20, margin: '0 auto 14px', position: 'relative', zIndex: 1,
                }}>{s.num}</div>
                {i < 3 && (
                  <div style={{
                    position: 'absolute', top: 24, left: '60%', width: '80%',
                    height: 2, backgroundColor: 'var(--border)',
                  }} className="how-it-works-connector" />
                )}
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FEATURE HIGHLIGHTS ===== */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>The trip planner built for points travelers</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
            Organize flights. Maximize points. Book confidently.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="features-grid">
          {[
            { icon: '⚖️', title: 'Cash vs. Points', desc: 'See the real cost of every option' },
            { icon: '🗺️', title: 'Multi-city', desc: 'Round trips, one-ways, open jaws' },
            { icon: '🔄', title: 'Transfer Partners', desc: 'Ratios, bonuses, and calculators' },
            { icon: '📋', title: 'Booking Playbook', desc: 'Step-by-step: transfer, then book' },
            { icon: '📊', title: 'Side-by-side Compare', desc: 'Cost, duration, stops at a glance' },
            { icon: '📧', title: 'Email & Print', desc: 'Share itineraries with anyone' },
          ].map(f => (
            <div key={f.title} style={{
              padding: '22px 24px', backgroundColor: 'var(--bg-card)',
              borderRadius: 12, border: '1px solid var(--border-light)',
              transition: 'transform 0.15s',
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CHROME EXTENSION BANNER ===== */}
      <div style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 20px', display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Mockup */}
          <div style={{
            width: 260, flexShrink: 0,
            backgroundColor: 'var(--bg-card)', borderRadius: 16,
            border: '1px solid var(--border-light)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: 38, background: 'linear-gradient(135deg, #4338ca, #6366f1)',
              display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8,
            }}>
              <img src="/logo.png" alt="" width={18} height={18} style={{ borderRadius: 4 }} />
              <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Point Tripper</span>
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>3 flights detected</div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 32, backgroundColor: 'var(--bg)', borderRadius: 8,
                  border: '1px solid var(--border-light)',
                  display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10,
                }}>
                  <div style={{ width: 50, height: 8, backgroundColor: 'var(--border)', borderRadius: 4 }} />
                  <div style={{ flex: 1 }} />
                  <div style={{ width: 36, height: 8, backgroundColor: 'var(--primary-light)', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Copy */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 16,
              backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
              fontSize: 12, fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Chrome Extension
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, lineHeight: 1.2 }}>
              Save flights without typing
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Browse any booking site. The extension detects flights on the page and adds them to your trip in one click.
            </p>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <a
                href="/pricing"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: 'white', borderRadius: 10, fontWeight: 600, fontSize: 14,
                  textDecoration: 'none', transition: 'transform 0.15s',
                }}
              >
                Get the extension
              </a>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                $4.99/mo &middot; Try free
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATS BAR ===== */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 20px' }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap',
        }}>
          {[
            { num: '90+', label: 'Loyalty programs' },
            { num: '6', label: 'Bank card programs' },
            { num: 'Free', label: 'Trip planning' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>{s.num}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== NEWS ===== */}
      {articles.length > 0 && (
        <div style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>Points & Miles News</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {articles.length > 3 && (
                  <>
                    <button
                      onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 3))}
                      disabled={!canPrev}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-card)', cursor: canPrev ? 'pointer' : 'default',
                        color: canPrev ? 'var(--text)' : 'var(--text-muted)', fontSize: 14, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: canPrev ? 1 : 0.4,
                      }}
                    >&#8592;</button>
                    <button
                      onClick={() => setCarouselIndex(Math.min(articles.length - 3, carouselIndex + 3))}
                      disabled={!canNext}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-card)', cursor: canNext ? 'pointer' : 'default',
                        color: canNext ? 'var(--text)' : 'var(--text-muted)', fontSize: 14, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: canNext ? 1 : 0.4,
                      }}
                    >&#8594;</button>
                  </>
                )}
                <a href="/news" style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', marginLeft: 4 }}>
                  All articles &rarr;
                </a>
              </div>
            </div>

            <div className="news-carousel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {visibleArticles.map(article => (
                <a key={article.id} href={`/news/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div
                    style={{
                      padding: '20px 18px', backgroundColor: 'var(--bg-card)', borderRadius: 14,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid var(--border-light)',
                      transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer',
                      height: '100%', display: 'flex', flexDirection: 'column',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginBottom: 8, flex: 1 }}>
                      {article.title}
                    </h3>
                    <p style={{
                      fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {article.summary}
                    </p>
                    <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Read &rarr;</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== FAQ ===== */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 20px 40px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 24 }}>FAQ</h2>
        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid var(--border-light)', overflow: 'hidden',
        }}>
          {[
            { q: 'Is it free?', a: 'The website is completely free. The Chrome extension is $4.99/mo with 1 free scan to try.' },
            { q: 'Do I need an account?', a: 'Not to start. Data saves locally. Create a free account to sync across devices.' },
            { q: 'Which programs are supported?', a: 'Chase, Amex, Citi, Capital One, Bilt, plus 90+ airline loyalty programs.' },
            { q: 'Do you book flights?', a: 'No. We tell you exactly how to book — you do it directly and keep full control.' },
            { q: 'Can I cancel the extension?', a: 'Yes, anytime from your account page.' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '14px 20px',
              borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none',
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.q}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== FINAL CTA ===== */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-nav) 0%, #2D2B55 100%)',
        padding: '64px 20px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-inverse)', marginBottom: 12, lineHeight: 1.2 }}>
            Start planning your next trip
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 32 }}>
            Free. No account required.
          </p>
          <div style={{ maxWidth: 380, margin: '0 auto', display: 'flex', gap: 0 }}>
            <input
              type="text" placeholder="Name your trip" value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStartTrip() }}
              style={{ ...fieldInput, flex: 1, borderRadius: '12px 0 0 12px', borderRight: 'none' }}
            />
            <button
              onClick={handleStartTrip}
              style={{
                padding: '0 28px', height: 48, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent), #E8C36A)', color: '#1A1A2E',
                border: 'none', borderRadius: '0 12px 12px 0', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(212, 168, 71, 0.3)', whiteSpace: 'nowrap',
              }}
            >
              Start Free
            </button>
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 20 }}>
            <a href="/wallet" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Track your points &rarr;</a>
            <a href="/pricing" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Chrome extension &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  )
}
