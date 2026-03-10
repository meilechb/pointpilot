'use client'

export default function ExtensionPage() {
  const checkItem = (text: string) => (
    <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
      <span style={{ color: 'var(--success)', fontSize: 16, lineHeight: '1.4' }}>&#10003;</span>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: '1.4' }}>{text}</span>
    </div>
  )

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
          from any search results page and lets you save them to your trips instantly. Completely free.
        </p>
        <a
          href="https://chromewebstore.google.com/detail/point-tripper-%E2%80%93-add-fligh/ddiknjcbiedmmcbhgamdbeljcafljapi"
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
          Download Free Extension
        </a>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
          Free forever. No credit card required.
        </div>
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

      {/* Features card */}
      <div style={{
        maxWidth: 480, margin: '0 auto 48px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow)',
        border: '2px solid var(--primary)',
        padding: 28,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          padding: '4px 14px', borderRadius: 20,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
          color: 'white', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          100% Free
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 800 }}>$0</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Free forever. Unlimited scans.
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          {checkItem('Unlimited flight scans')}
          {checkItem('Auto-detect flights from any page')}
          {checkItem('Save flights to your trips')}
          {checkItem('Compare cash vs. points pricing')}
          {checkItem('Works on any airline or travel site')}
        </div>

        <a
          href="https://chromewebstore.google.com/detail/point-tripper-%E2%80%93-add-fligh/ddiknjcbiedmmcbhgamdbeljcafljapi"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center', padding: '13px 20px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
            fontWeight: 600, fontSize: 15, textDecoration: 'none',
          }}
        >
          Install Free Extension
        </a>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Install from Chrome Web Store
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
          href="https://chromewebstore.google.com/detail/point-tripper-%E2%80%93-add-fligh/ddiknjcbiedmmcbhgamdbeljcafljapi"
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
            q: 'Is it really free?',
            a: 'Yes! The Chrome extension is completely free with unlimited scans. No credit card required, no hidden fees.',
          },
          {
            q: 'What counts as a "scan"?',
            a: 'Each time you open the extension and it analyzes a page for flights, that counts as one scan. Viewing previously detected flights does not count.',
          },
          {
            q: 'How do I install the extension?',
            a: 'Click "Download Free Extension" above to install from the Chrome Web Store. After installing, click the extension icon on any flight search page to get started.',
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
