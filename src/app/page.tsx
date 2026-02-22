'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [showHow, setShowHow] = useState(false)
  const [showFaq, setShowFaq] = useState(false)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '100px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>PointPilot</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
        Your points are worth more than you think. We'll show you how to use them.
      </p>

      <button
        onClick={() => router.push('/trip/new')}
        style={{
          padding: '14px 32px',
          fontSize: 18,
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Start a Trip →
      </button>

      <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center', gap: 20 }}>
        <span
          onClick={() => { setShowHow(!showHow); setShowFaq(false) }}
          style={{ cursor: 'pointer', color: '#444', textDecoration: 'underline' }}
        >
          How it works
        </span>
        <span
          onClick={() => { setShowFaq(!showFaq); setShowHow(false) }}
          style={{ cursor: 'pointer', color: '#444', textDecoration: 'underline' }}
        >
          FAQ
        </span>
      </div>

      {showHow && (
        <div style={{ marginTop: 20, textAlign: 'left', padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
          <p style={{ marginBottom: 12 }}><strong>1.</strong> Create a trip — tell us where and when you're going</p>
          <p style={{ marginBottom: 12 }}><strong>2.</strong> Add flights — enter every option you find with prices in cash, points, or both</p>
          <p style={{ marginBottom: 12 }}><strong>3.</strong> Add your points — enter your balances across all cards and airlines</p>
          <p><strong>4.</strong> Get your plan — we find the best combination and tell you exactly how to book it</p>
        </div>
      )}

      {showFaq && (
        <div style={{ marginTop: 20, textAlign: 'left', padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
          <p style={{ marginBottom: 8 }}><strong>Is this free?</strong></p>
          <p style={{ color: '#666', marginBottom: 16 }}>Yes, completely free to use.</p>
          <p style={{ marginBottom: 8 }}><strong>Do I need to sign up?</strong></p>
          <p style={{ color: '#666', marginBottom: 16 }}>Not to get started. You can save your progress by creating an account later.</p>
          <p style={{ marginBottom: 8 }}><strong>How does it know which points to use?</strong></p>
          <p style={{ color: '#666' }}>We know every transfer partner for Chase, Amex, Citi, Capital One, and more. We calculate which route gives you the most value.</p>
        </div>
      )}
    </div>
  )
}