'use client'

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const fieldLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block',
}
const fieldInput: React.CSSProperties = {
  width: '100%', height: 42, padding: '10px 12px', fontSize: 14,
  color: 'var(--text)', backgroundColor: 'var(--bg-input)',
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
  outline: 'none',
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (error) { setError(error.message); setLoading(false); return }
      setMessage('Check your email for a password reset link.')
      setLoading(false)
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) { setError(error.message); setLoading(false); return }
      setMessage('Check your email for a confirmation link.')
      setLoading(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      // Tell Chrome to save the credential via the Credential Management API.
      // This is the recommended approach for SPAs that use e.preventDefault().
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any
        if (win.PasswordCredential) {
          const cred = new win.PasswordCredential({
            id: email,
            password: password,
          })
          await navigator.credentials.store(cred)
        }
      } catch (_) { /* ignore if browser doesn't support it */ }

      // Navigate away — this causes pushState + form unmount, which is
      // Chrome's secondary signal that login succeeded.
      window.location.href = redirectTo || '/'
      return
    }
  }

  const handleGoogleLogin = async () => {
    const callbackUrl = redirectTo
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
    if (error) setError(error.message)
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '60px 20px' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)', padding: 28,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>✈</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {mode === 'forgot' ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {mode === 'forgot' ? 'Enter your email to receive a reset link' : mode === 'login' ? 'Sign in to Point Tripper' : 'Start maximizing your points'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <>
            <button
              onClick={handleGoogleLogin}
              style={{
                width: '100%', height: 44, padding: '10px 16px', marginBottom: 20,
                border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 14, fontWeight: 500, color: 'var(--text)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92a8.78 8.78 0 002.68-6.62z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 009 18z" fill="#34A853"/>
                <path d="M3.97 10.71A5.41 5.41 0 013.68 9c0-.6.1-1.18.28-1.71V4.96H.96A8.99 8.99 0 000 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 00.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
            }}>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
            </div>
          </>
        )}

        <form
          onSubmit={handleEmailAuth}
          autoComplete="on"
        >

          {mode === 'signup' && (
            <>
              <label style={fieldLabel} htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                name="name"
                type="text" placeholder="John Doe" value={fullName}
                autoComplete="name"
                onChange={(e) => setFullName(e.target.value)}
                style={{ ...fieldInput, marginBottom: 12 }}
              />
            </>
          )}

          <label style={fieldLabel} htmlFor="email">Email</label>
          <input
            id="email"
            name="username"
            type="email" placeholder="you@email.com" value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...fieldInput, marginBottom: mode === 'forgot' ? 16 : 12 }}
          />

          {mode !== 'forgot' && (
            <>
              <label style={fieldLabel} htmlFor="password">Password</label>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'} placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                  value={password}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...fieldInput, marginBottom: 0, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px 2px', lineHeight: 1 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                    {!showPassword && <line x1="1" y1="1" x2="23" y2="23"/>}
                  </svg>
                </button>
              </div>
              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <span
                    onClick={() => { setMode('forgot'); setError(''); setMessage('') }}
                    style={{ fontSize: 13, color: 'var(--primary)', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </span>
                </div>
              )}
              {mode === 'signup' && <div style={{ marginBottom: 12 }} />}
            </>
          )}

          {error && (
            <div style={{
              padding: '8px 12px', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)',
              border: '1px solid #FECACA', fontSize: 13, color: 'var(--danger)', marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              padding: '8px 12px', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-sm)',
              border: '1px solid #A7F3D0', fontSize: 13, color: 'var(--success)', marginBottom: 12,
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || (mode !== 'forgot' && !password)}
            style={{
              width: '100%', height: 44, padding: 12,
              background: !email || (mode !== 'forgot' && !password) ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: !email || (mode !== 'forgot' && !password) ? 'var(--text-muted)' : 'var(--text-inverse)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: !email || (mode !== 'forgot' && !password) ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            {loading ? '...' : mode === 'forgot' ? 'Send Reset Link' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
          {mode === 'forgot' ? 'Remember your password? ' : mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setMode(mode === 'signup' ? 'login' : mode === 'forgot' ? 'login' : 'signup'); setError(''); setMessage('') }}
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            {mode === 'forgot' ? 'Sign in' : mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}
