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
    width: '100%', height: 42, padding: '10px 12px', fontSize: 14,
    color: 'var(--text)', backgroundColor: 'rgba(255,255,255,0.95)',
    border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-sm)', outline: 'none',
  }

  const sectionPadding: React.CSSProperties = {
    maxWidth: 960, margin: '0 auto', padding: '64px 20px',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 26, fontWeight: 800, textAlign: 'center', marginBottom: 12, lineHeight: 1.2,
  }

  const sectionSubtitle: React.CSSProperties = {
    fontSize: 15, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 40,
    maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.6,
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ========== HERO ========== */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-nav) 0%, #2D2B55 100%)',
        padding: '80px 20px 60px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 20,
            backgroundColor: 'rgba(212, 168, 71, 0.15)', color: 'var(--accent)',
            fontSize: 13, fontWeight: 600, marginBottom: 20, letterSpacing: 0.5,
          }}>
            Your flight planning command center
          </div>
          <h1 className="hero-title">
            Organize every flight option.<br />See the best way to book.
          </h1>
          <p className="hero-subtitle">
            Collect flight options from anywhere, track your points and miles balances, and get a step-by-step plan showing exactly which points to use and where to book.
          </p>

          {/* Mini trip form */}
          <div style={{ maxWidth: 340, margin: '28px auto 0', display: 'flex', gap: 0 }}>
            <input
              type="text" placeholder="Trip name" value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStartTrip() }}
              style={{ ...fieldInput, flex: 1, borderRadius: '10px 0 0 10px', borderRight: 'none' }}
            />
            <button
              onClick={handleStartTrip}
              style={{
                padding: '0 24px', height: 42, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent), #E8C36A)', color: '#1A1A2E',
                border: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(212, 168, 71, 0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s', whiteSpace: 'nowrap',
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500 }}
            >
              More options →
            </button>
          </div>

          {/* Trust signals */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            {['Free to use', 'No booking required', '90+ loyalty programs'].map(t => (
              <span key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--accent)', fontSize: 14 }}>&#10003;</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ========== WHAT IT DOES — 3 pillars ========== */}
      <div style={sectionPadding}>
        <h2 style={sectionTitle}>Three tools, one place</h2>
        <p style={sectionSubtitle}>
          Point Tripper replaces your spreadsheets, sticky notes, and open browser tabs with one organized workspace.
        </p>
        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            {
              icon: '✈️',
              title: 'Trip Planner',
              desc: 'Create a trip, add every flight option you find, and drag them into a plan. Compare itineraries side by side — total cost, duration, stops, and layovers.',
              link: '/trip/new',
              cta: 'Start a trip',
            },
            {
              icon: '💳',
              title: 'Points Wallet',
              desc: 'Track your balances across Chase, Amex, Citi, Capital One, Bilt, and 90+ airline programs. See transfer partners, active bonuses, and calculate conversions.',
              link: '/wallet',
              cta: 'View wallet',
            },
            {
              icon: '🧩',
              title: 'Chrome Extension',
              desc: 'Browse any flight booking site and the extension reads the page, detects flights, and lets you save them to your trips — no manual entry needed.',
              link: '/pricing',
              cta: 'Get the extension',
            },
          ].map((item) => (
            <div
              key={item.title}
              onClick={() => router.push(item.link)}
              style={{
                padding: 28, backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)',
                cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                display: 'flex', flexDirection: 'column',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, marginBottom: 16 }}>{item.desc}</div>
              <span style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>{item.cta} →</span>
            </div>
          ))}
        </div>
      </div>

      {/* ========== HOW IT WORKS — detailed flow ========== */}
      <div style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ ...sectionPadding }}>
          <h2 style={sectionTitle}>How it works</h2>
          <p style={sectionSubtitle}>
            From first search to final booking — here&apos;s the workflow.
          </p>

          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {[
              {
                step: '1',
                title: 'Add your points and miles',
                desc: 'Enter your balances from every credit card and airline program. Point Tripper knows all the transfer partners and shows active bonuses.',
              },
              {
                step: '2',
                title: 'Create a trip and add flights',
                desc: 'Set up your route — one-way, round trip, or multi-city. Then add every flight option you find: airline, times, cash price, points price, or both.',
              },
              {
                step: '3',
                title: 'Build and compare itineraries',
                desc: 'Drag flights into a plan. Save multiple versions and compare them side by side — total cost, points, duration, stops, and taxes.',
              },
              {
                step: '4',
                title: 'Get your booking playbook',
                desc: 'Point Tripper matches your flights to your points balances and gives you step-by-step instructions: which points to transfer, where, and how to book.',
              },
            ].map((item, i) => (
              <div key={item.step} style={{
                display: 'flex', gap: 20, marginBottom: i < 3 ? 32 : 0, alignItems: 'flex-start',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 18, position: 'relative', zIndex: 1,
                  }}>
                    {item.step}
                  </div>
                  {i < 3 && (
                    <div style={{
                      position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)',
                      width: 2, height: 32, backgroundColor: 'var(--border)',
                    }} />
                  )}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== DETAILED FEATURES ========== */}
      <div style={sectionPadding}>
        <h2 style={sectionTitle}>Built for points and miles travelers</h2>
        <p style={sectionSubtitle}>
          Every feature is designed around how award travelers actually plan trips.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 760, margin: '0 auto' }} className="features-grid">
          {[
            { title: 'Cash vs. points comparison', desc: 'Log both the cash price and points price for every flight. See the true cost of each option at a glance.' },
            { title: 'Multi-city trip support', desc: 'Plan complex itineraries with multiple legs. Round trips, one-ways, and open jaws — all in one trip.' },
            { title: 'Transfer partner calculator', desc: 'See every transfer partner for your bank points, including active bonuses. Calculate exactly how many miles you get.' },
            { title: 'Booking step-by-step', desc: 'After you pick a plan, get exact instructions: transfer X points from Chase to United, then book on united.com.' },
            { title: 'Side-by-side itinerary comparison', desc: 'Compare 2-3 itineraries at once. See total cost, duration, stops, flying time, and taxes across options.' },
            { title: 'Share via email or print', desc: 'Email a formatted itinerary to your travel companions or print it for your records.' },
          ].map(f => (
            <div key={f.title} style={{
              padding: '20px 22px', backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)', border: '1px solid var(--border-light)',
            }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== CHROME EXTENSION CALLOUT ========== */}
      <div style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ ...sectionPadding, display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ flex: 1, minWidth: 280, maxWidth: 420 }}>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 16,
              backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
              fontSize: 12, fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Chrome Extension
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
              Save flights without typing a thing
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Browse any flight booking website. Open the extension and it reads the page, pulls out every flight with its pricing, and lets you add it to your trip in one click.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href="/pricing"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                Get the extension
              </a>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                $4.99/mo &middot; 1 free scan to try
              </span>
            </div>
          </div>
          <div style={{
            width: 280, height: 200, backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{
              width: '100%', height: 36, backgroundColor: 'var(--primary)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
            }}>
              <img src="/logo.png" alt="" width={16} height={16} style={{ borderRadius: 3 }} />
              <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>Point Tripper</span>
            </div>
            <div style={{ padding: 16, width: '100%', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>3 flights detected</div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 28, backgroundColor: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border-light)',
                  display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8,
                }}>
                  <div style={{ width: 40, height: 8, backgroundColor: 'var(--border)', borderRadius: 4 }} />
                  <div style={{ flex: 1 }} />
                  <div style={{ width: 30, height: 8, backgroundColor: 'var(--primary-light)', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========== SOCIAL PROOF / TRUST ========== */}
      <div style={sectionPadding}>
        <div style={{
          maxWidth: 700, margin: '0 auto', textAlign: 'center',
          padding: '40px 32px', backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow)',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
            Built for people who already know points have value
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 24px' }}>
            You&apos;ve already done the hard part — earning points across multiple programs. Point Tripper helps you organize the booking side so you can confidently use them instead of paying cash.
          </p>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { num: '90+', label: 'Loyalty programs' },
              { num: '6', label: 'Bank programs' },
              { num: 'Free', label: 'Trip planning' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{s.num}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== NEWS CAROUSEL ========== */}
      {articles.length > 0 && (
        <div style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
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
                  All articles →
                </a>
              </div>
            </div>

            <div className="news-carousel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {visibleArticles.map(article => (
                <a key={article.id} href={`/news/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div
                    style={{
                      padding: '20px 18px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
                      transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer',
                      height: '100%', display: 'flex', flexDirection: 'column',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 8, flex: 1 }}>
                      {article.title}
                    </h3>
                    <p style={{
                      fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {article.summary}
                    </p>
                    <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Read →</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== FAQ ========== */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 20px 40px' }}>
        <h2 style={{ ...sectionTitle, marginBottom: 24 }}>Frequently Asked Questions</h2>
        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)', overflow: 'hidden',
        }}>
          {[
            { q: 'Is Point Tripper free?', a: 'The website is completely free — create trips, track your points, plan itineraries, and compare options at no cost. The Chrome extension is $4.99/month with 1 free scan to try.' },
            { q: 'Do I need an account?', a: 'Not to get started. Your data is saved locally in your browser. Create a free account whenever you want to sync across devices and access your trips anywhere.' },
            { q: 'Which points programs do you support?', a: 'Chase Ultimate Rewards, Amex Membership Rewards, Citi ThankYou Points, Capital One Miles, Bilt Rewards, plus 90+ airline and hotel loyalty programs with full transfer partner data.' },
            { q: 'How do I add flights to a trip?', a: 'You can add flights manually on the website by entering the details, or use the Chrome extension to automatically detect and save flights from any booking website.' },
            { q: 'What does the booking playbook do?', a: 'After you build an itinerary, Point Tripper looks at your points balances and tells you exactly which points to transfer, to which airline program, and how to complete each booking.' },
            { q: 'Do you book flights for me?', a: 'No. Point Tripper organizes your options and tells you exactly how to book. You book directly with the airline or through the booking site — keeping full control and earning any booking bonuses.' },
            { q: 'Can I cancel the extension subscription?', a: 'Yes, anytime. Go to your account page and cancel with one click. You keep Pro access until the end of your billing period.' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '16px 22px',
              borderBottom: i < 6 ? '1px solid var(--border-light)' : 'none',
            }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.q}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== FINAL CTA ========== */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-nav) 0%, #2D2B55 100%)',
        padding: '56px 20px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-inverse)', marginBottom: 12, lineHeight: 1.2 }}>
            Ready to stop guessing and start planning?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 28, lineHeight: 1.6 }}>
            Create your first trip in 10 seconds. It&apos;s free.
          </p>
          <div style={{ maxWidth: 340, margin: '0 auto', display: 'flex', gap: 0 }}>
            <input
              type="text" placeholder="Trip name" value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStartTrip() }}
              style={{ ...fieldInput, flex: 1, borderRadius: '10px 0 0 10px', borderRight: 'none' }}
            />
            <button
              onClick={handleStartTrip}
              style={{
                padding: '0 24px', height: 42, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent), #E8C36A)', color: '#1A1A2E',
                border: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(212, 168, 71, 0.3)', whiteSpace: 'nowrap',
              }}
            >
              Create Trip
            </button>
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <a href="/wallet" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Track your points →</a>
            <a href="/pricing" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Get the Chrome extension →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
