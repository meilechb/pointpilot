'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'

export default function Nav() {
  const { user, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const mobileLinkStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 500,
    textDecoration: 'none', padding: '10px 12px', borderRadius: 6,
    display: 'block',
  }

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

      {/* Desktop nav */}
      <div className="nav-links">
        <a href="/trip/new" className="nav-link">New Trip</a>
        <a href="/trips" className="nav-link">My Trips</a>
        <a href="/wallet" className="nav-link">My Points</a>
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

      {/* Hamburger button */}
      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {menuOpen ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a href="/trip/new" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>New Trip</a>
        <a href="/trips" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>My Trips</a>
        <a href="/wallet" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>My Points</a>
        {!loading && (
          user ? (
            <button
              onClick={() => { signOut(); setMenuOpen(false) }}
              style={{
                color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500,
                background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginTop: 4,
                width: '100%', textAlign: 'left',
              }}
            >
              Sign Out
            </button>
          ) : (
            <a href="/login" style={{
              ...mobileLinkStyle,
              color: 'var(--text-inverse)', fontWeight: 600,
              background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
              textAlign: 'center', marginTop: 4,
            }} onClick={() => setMenuOpen(false)}>Sign In</a>
          )
        )}
      </div>
    </nav>
  )
}
