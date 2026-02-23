'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'

type Props = {
  trigger: 'flight' | 'plan' | null
}

export default function SavePrompt({ trigger }: Props) {
  const { user } = useAuth()
  const [show, setShow] = useState(false)

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

  if (!show) return null

  const isFlight = trigger === 'flight'

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
        padding: 32, maxWidth: 400, width: '90%',
        zIndex: 201,
        animation: 'slideUp 0.25s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>✈</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            {isFlight ? 'Nice — your trip is taking shape!' : 'Your plan is saved!'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {isFlight
              ? 'Create a free account to save your trips across devices and never lose your research.'
              : "You've done great work — don't lose it! Sign up to keep your plans safe and access them anywhere."
            }
          </p>
        </div>

        <a href="/login" style={{
          display: 'block', width: '100%', padding: 12, height: 44,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
          color: 'var(--text-inverse)', border: 'none', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', fontSize: 14, fontWeight: 600,
          textAlign: 'center', textDecoration: 'none',
          boxSizing: 'border-box',
        }}>Create Free Account</a>

        <button
          onClick={dismiss}
          style={{
            display: 'block', width: '100%', marginTop: 8, padding: 10,
            border: 'none', background: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
            textAlign: 'center',
          }}
        >
          Maybe later
        </button>
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