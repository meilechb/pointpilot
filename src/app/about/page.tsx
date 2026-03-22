export default function AboutPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>About Point Tripper</h1>
      <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.7 }}>
        We help travelers maximize the value of their credit card points and airline miles.
      </p>

      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <div style={{
          padding: '28px 24px', marginBottom: 24,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>The Problem</h2>
          <p style={{ marginBottom: 0 }}>
            Booking flights with points is confusing. Should you transfer to an airline partner or use your bank&apos;s travel portal? Which combination of flights gives you the best value? With dozens of transfer partners, fluctuating point values, and limited-time bonuses, finding the optimal strategy takes hours of research.
          </p>
        </div>

        <div style={{
          padding: '28px 24px', marginBottom: 24,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Our Solution</h2>
          <p style={{ marginBottom: 0 }}>
            Point Tripper simplifies the entire process. Capture flight options from any booking site with our free Chrome extension, add your loyalty point balances, and let our AI find the best way to book your trip &mdash; whether that&apos;s with cash, points, or a combination of both.
          </p>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16, marginTop: 40 }}>How It Works</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {[
            { step: '1', title: 'Create a Trip', desc: 'Set your origin, destination, dates, and number of travelers.' },
            { step: '2', title: 'Capture Flights', desc: 'Browse booking sites and use our Chrome extension to save flight options in one click.' },
            { step: '3', title: 'Add Your Points', desc: 'Enter your loyalty program balances so we know what you have to work with.' },
            { step: '4', title: 'Build Itineraries', desc: 'Our AI analyzes all combinations and finds the best, cheapest, and fastest options.' },
            { step: '5', title: 'Book with Confidence', desc: 'Save, compare, and share your itinerary. Then book knowing you got the best deal.' },
          ].map(item => (
            <div key={item.step} style={{
              display: 'flex', gap: 16, padding: '16px 20px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 15,
              }}>{item.step}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '28px 24px',
          backgroundColor: 'var(--primary-light)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--primary)',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>Ready to get started?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
            Point Tripper is completely free. Start planning your next trip today.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'white', borderRadius: 'var(--radius-sm)',
              textDecoration: 'none', fontWeight: 700, fontSize: 15,
              transition: 'opacity 0.15s',
            }}
          >
            Start Planning
          </a>
        </div>
      </div>
    </div>
  )
}
