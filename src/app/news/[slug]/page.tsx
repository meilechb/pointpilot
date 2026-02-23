'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type Article = {
  id: string
  slug: string
  title: string
  summary: string
  body: string
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function ArticlePage() {
  const params = useParams()
  const slug = params.slug as string
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/articles?slug=${slug}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => { if (data) { setArticle(data); setLoading(false) } })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug])

  if (loading) {
    return (
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 16 }}>
        Loading...
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📰</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 18, marginBottom: 20 }}>Article not found.</p>
        <a href="/news" style={{ color: 'var(--primary)', fontSize: 16, fontWeight: 600 }}>← Back to News</a>
      </div>
    )
  }

  const paragraphs = article.body.split('\n\n').filter(p => p.trim())

  return (
    <div>
      {/* Article header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-nav) 0%, #2D2B55 100%)',
        padding: '48px 20px 44px',
      }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <a href="/news" style={{
            color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500,
            textDecoration: 'none', display: 'inline-block', marginBottom: 24,
            transition: 'color 0.15s',
          }}>
            ← Back to News
          </a>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 14 }}>
            {formatDate(article.created_at)}
          </div>
          <h1 style={{
            fontSize: 36, fontWeight: 800, lineHeight: 1.2,
            color: 'var(--text-inverse)', letterSpacing: -0.5,
            marginBottom: 14,
          }}>
            {article.title}
          </h1>
          <p style={{
            fontSize: 19, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5,
            maxWidth: 620,
          }}>
            {article.summary}
          </p>
        </div>
      </div>

      {/* Article body */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '40px 20px 60px' }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-light)',
          padding: '40px 36px',
          marginTop: -24,
          position: 'relative',
          zIndex: 1,
        }}>
          {paragraphs.map((paragraph, i) => (
            <p key={i} style={{
              fontSize: 17, lineHeight: 1.8, color: 'var(--text)',
              marginBottom: 22,
            }}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="/news" style={{
            display: 'inline-block',
            padding: '12px 28px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--primary)',
            fontWeight: 600, fontSize: 15,
            textDecoration: 'none',
            transition: 'box-shadow 0.15s',
          }}>
            ← More articles
          </a>
        </div>
      </div>
    </div>
  )
}
