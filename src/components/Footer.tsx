'use client'

import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      backgroundColor: 'var(--bg-nav)',
      color: 'rgba(255,255,255,0.7)',
      marginTop: 60,
    }}>
      {/* Main footer content */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '48px 24px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 40,
      }}>
        {/* Brand column */}
        <div style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <img src="/logo.png" alt="Point Tripper" width={24} height={24} style={{ borderRadius: 4 }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>Point Tripper</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>
            Maximize your travel rewards. Compare flights, optimize points, and build the perfect itinerary.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.15s', fontSize: 18 }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >&#120143;</a>
          </div>
        </div>

        {/* Product column */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Product
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FooterLink href="/trips">My Trips</FooterLink>
            <FooterLink href="/wallet">My Points</FooterLink>
            <FooterLink href="/news">Travel News</FooterLink>
            <FooterLink href="https://chromewebstore.google.com/detail/point-tripper/ogdahpmanlbjfcmpklbachojcihjakoa" external>Chrome Extension</FooterLink>
          </div>
        </div>

        {/* Company column */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Company
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contact">Contact Us</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
          </div>
        </div>

        {/* Support column */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Support
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FooterLink href="/contact">Help Center</FooterLink>
            <FooterLink href="mailto:support@pointtripper.com">Email Support</FooterLink>
          </div>
          <div style={{ marginTop: 20, padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              Get the Extension
            </div>
            <a
              href="https://chromewebstore.google.com/detail/point-tripper/ogdahpmanlbjfcmpklbachojcihjakoa"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', padding: '8px 16px',
                background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
                color: '#1A1A2E', borderRadius: 6,
                fontSize: 12, fontWeight: 700, textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Free for Chrome
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 24px',
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          &copy; {year} Point Tripper. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >Privacy</Link>
          <Link href="/terms" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >Terms</Link>
          <Link href="/contact" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >Contact</Link>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          footer > div:first-child {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 480px) {
          footer > div:first-child {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </footer>
  )
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const style: React.CSSProperties = {
    fontSize: 13, color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none', transition: 'color 0.15s',
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}
        onMouseOver={(e) => e.currentTarget.style.color = 'white'}
        onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
      >{children}</a>
    )
  }

  return (
    <Link href={href} style={style}
      onMouseOver={(e) => e.currentTarget.style.color = 'white'}
      onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
    >{children}</Link>
  )
}
