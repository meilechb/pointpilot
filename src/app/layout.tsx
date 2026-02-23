'use client'

import "./globals.css"
import AuthProvider, { useAuth } from '@/components/AuthProvider'

function Nav() {
  const { user, loading, signOut } = useAuth()

  return (
    <nav style={{
      backgroundColor: 'var(--bg-nav)', padding: '0 24px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }}>
      <a href="/" style={{
        color: 'var(--text-inverse)', fontWeight: 700, fontSize: 18,
        letterSpacing: -0.5, textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>✈</span>
        Point Tripper
      </a>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <a href="/trip/new" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '6px 14px', borderRadius: 6 }}>New Trip</a>
     <a href="/trips" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '6px 14px', borderRadius: 6 }}>My Trips</a>
        <a href="/wallet" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '6px 14px', borderRadius: 6 }}>My Points</a>
        {!loading && (
          user ? (
            <button
              onClick={signOut}
              style={{
                color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500,
                background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                padding: '5px 12px', borderRadius: 6, cursor: 'pointer', marginLeft: 8,
              }}
            >
              Sign Out
            </button>
          ) : (
            <a href="/login" style={{
              color: 'var(--text-inverse)', fontSize: 14, fontWeight: 600,
              textDecoration: 'none', padding: '6px 16px', borderRadius: 6, marginLeft: 8,
              background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
            }}>Sign In</a>
          )
        )}
      </div>
    </nav>
  )
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <title>Point Tripper — Maximize Your Points & Miles</title>
        <meta name="description" content="Find the best way to use your credit card points and airline miles for flights." />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5751210990513261"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AuthProvider>
          <Nav />
          <main style={{ minHeight: 'calc(100vh - 56px)' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}