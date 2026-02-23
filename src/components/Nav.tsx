'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'

export default function Nav() {
  const { user, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMouseEnter = () => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current)
    setDropdownOpen(true)
  }

  const handleMouseLeave = () => {
    dropdownTimer.current = setTimeout(() => setDropdownOpen(false), 200)
  }

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
        <img src="/logo.png" alt="Point Tripper" width={28} height={28} style={{ borderRadius: 8 }} />
        Point Tripper
      </a>

      {/* Desktop nav */}
      <div className="nav-links">
        <a href="/trip/new" className="nav-link">New Trip</a>
        <a href="/trips" className="nav-link">My Trips</a>
        <a href="/wallet" className="nav-link">My Points</a>
        <a href="/news" className="nav-link">News</a>
        {!loading && (
          user ? (
            <div
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{ position: 'relative', marginLeft: 8 }}
            >
              <a href="/account" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Account
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 5L6 8L9 5" />
                </svg>
              </a>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)',
                  minWidth: 160, overflow: 'hidden', zIndex: 200,
                }}>
                  <a href="/account" style={{
                    display: 'block', padding: '10px 16px', fontSize: 14, fontWeight: 500,
                    color: 'var(--text)', textDecoration: 'none',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Manage Account
                  </a>
                  <button
                    onClick={() => { setDropdownOpen(false); signOut() }}
                    style={{
                      display: 'block', width: '100%', padding: '10px 16px', fontSize: 14, fontWeight: 500,
                      color: 'var(--danger)', textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
        <a href="/news" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>News</a>
        {!loading && (
          user ? (
            <>
              <a href="/account" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>Account</a>
              <button
                onClick={() => { setMenuOpen(false); signOut() }}
                style={{
                  color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500,
                  background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                  padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginTop: 4,
                  width: '100%', textAlign: 'left',
                }}
              >
                Sign Out
              </button>
            </>
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
