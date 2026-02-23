'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'

type Props = {
  trigger: 'flight' | 'plan' | 'trip' | 'wallet' | null
}

const messages: Record<string, { title: string; desc: string }> = {
  flight: { title: 'Nice — your trip is taking shape!', desc: 'Sign up to save your flights and never lose your research.' },
  plan: { title: 'Your plan is saved!', desc: "Great work — sign up to keep your plans safe." },
  trip: { title: 'Trip created!', desc: 'Sign up to save your trips and access them anytime.' },
  wallet: { title: 'Points logged!', desc: 'Sign up to save your balances and keep everything in one place.' },
}

const fieldInput: React.CSSProperties = {
  width: '100%', height: 42, padding: '10px 12px', fontSize: 14,
  color: 'var(--text)', backgroundColor: 'var(--bg-input)',
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
  outline: 'none', boxSizing: 'border-box',
}

export default function SavePrompt({ trigger }: Props) {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!trigger || user) return
    const dismissedKey = `save_prompt_dismissed_${trigger}`
    const dismissed = localStorage.getItem(dismissedKey)
    if (dismissed) return
    const timer = setTimeout(() => setShow(true), 600)
    return () => clearTimeout(timer)
  }, [trigger, user])

  const dismiss = () => {
    setShow(false)
    if (trigger) {
      localStorage.setItem(`save_prompt_dismissed_${trigger}`, 'true')
    }
  }

  const handleSignup = async () => {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
  }

  if (!show) return null

  const msg = messages[trigger || 'flight']

  return (
    <>
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: 28, maxWidth: 380, width: '90%',
        zIndex: 201,
        animation: 'slideUp 0.25s ease',
      }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Check your email</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              We sent a confirmation link. Click it to activate your account.
            </p>
            <button onClick={dismiss} style={{
              padding: '10px 24px', border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'var(--text-inverse)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>
              Got it
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
                background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>✈</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{msg.title}</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{msg.desc}</p>
            </div>

            <button onClick={handleGoogleSignup} style={{
              width: '100%', height: 40, padding: '8px 16px', marginBottom: 14,
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-card)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 13, fontWeight: 500, color: 'var(--text)',
            }}>
              <svg width="16" height="16" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92a8.78 8.78 0 002.68-6.62z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 009 18z" fill="#34A853"/>
                <path d="M3.97 10.71A5.41 5.41 0 013.68 9c0-.6.1-1.18.28-1.71V4.96H.96A8.99 8.99 0 000 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 00.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
            </div>

            <input
              type="text" placeholder="Full name" value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ ...fieldInput, marginBottom: 8 }}
            />
            <input
              type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...fieldInput, marginBottom: 8 }}
            />
            <input
              type="password" placeholder="Password (min 6 chars)" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && email && password) handleSignup() }}
              style={{ ...fieldInput, marginBottom: 12 }}
            />

            {error && (
              <div style={{
                padding: '6px 10px', backgroundColor: 'var(--danger-bg)',
                borderRadius: 'var(--radius-sm)', border: '1px solid #FECACA',
                fontSize: 13, color: 'var(--danger)', marginBottom: 10,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSignup}
              disabled={loading || !email || !password}
              style={{
                width: '100%', height: 40, border: 'none',
                background: !email || !password ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: !email || !password ? 'var(--text-muted)' : 'var(--text-inverse)',
                borderRadius: 'var(--radius-sm)', cursor: !email || !password ? 'default' : 'pointer',
                fontSize: 14, fontWeight: 600,
              }}
            >
              {loading ? '...' : 'Create Free Account'}
            </button>

            <button onClick={dismiss} style={{
              display: 'block', width: '100%', marginTop: 8, padding: 8,
              border: 'none', background: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
              textAlign: 'center',
            }}>
              Maybe later
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%) }
          to { opacity: 1; transform: translate(-50%, -50%) }
        }
      `}</style>
    </>
  )
}