'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const canSend = form.name && form.email && form.message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend) return
    setSending(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSent(true)
    } catch {
      alert('Failed to send. Please try emailing us directly.')
    }
    setSending(false)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Contact Us</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
        Have a question, feedback, or need help? We&apos;d love to hear from you. Fill out the form below or email us
        at <a href="mailto:support@pointtripper.com" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>support@pointtripper.com</a>
      </p>

      {sent ? (
        <div style={{
          textAlign: 'center', padding: 48,
          backgroundColor: 'var(--success-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #A7F3D0',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>&#10003;</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Message Sent!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Thanks for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Subject
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="What is this about?"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Message *
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us what's on your mind..."
              rows={6}
              required
              style={{ resize: 'vertical', height: 'auto' }}
            />
          </div>

          <button
            type="submit"
            disabled={!canSend || sending}
            style={{
              width: '100%', padding: 14,
              background: canSend && !sending ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'var(--border)',
              color: canSend && !sending ? 'white' : 'var(--text-muted)',
              border: 'none', borderRadius: 'var(--radius)',
              cursor: canSend && !sending ? 'pointer' : 'not-allowed',
              fontSize: 15, fontWeight: 700,
              transition: 'all 0.15s',
            }}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}

      {/* FAQ section */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Frequently Asked Questions</h2>
        {[
          {
            q: 'Is Point Tripper free?',
            a: 'Yes! Point Tripper is free to use. Our Chrome extension for capturing flights is also free.',
          },
          {
            q: 'How does the AI itinerary builder work?',
            a: 'Add your flight options to a trip, then the AI analyzes all combinations to find the best, cheapest, and fastest itineraries using your saved flights.',
          },
          {
            q: 'What loyalty programs do you support?',
            a: 'We support Chase Ultimate Rewards, Amex Membership Rewards, Citi ThankYou Points, Capital One Miles, Bilt Points, and all major airline miles programs.',
          },
          {
            q: 'How do I capture flights?',
            a: 'Install our free Chrome extension, search for flights on any booking site, and click the extension to save them directly to your trip.',
          },
        ].map((faq, i) => (
          <div key={i} style={{
            padding: '16px 20px', marginBottom: 12,
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{faq.q}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{faq.a}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
