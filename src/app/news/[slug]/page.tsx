'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type Article = {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  body: string
  tags: string[]
  created_at: string
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  'transfer-bonus': { bg: 'var(--accent-light)', text: '#B8860B' },
  'sweet-spot': { bg: 'var(--primary-light)', text: 'var(--primary)' },
  'tips': { bg: 'var(--success-bg)', text: 'var(--success)' },
  'news': { bg: '#F0F9FF', text: '#0369A1' },
}

const categoryLabels: Record<string, string> = {
  'transfer-bonus': 'Transfer Bonus',
  'sweet-spot': 'Sweet Spot',
  'tips': 'Tip',
  'news': 'News',
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
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📰</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Article not found.</p>
        <a href="/news" style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 500 }}>← Back to News</a>
      </div>
    )
  }

  const colors = categoryColors[article.category] || categoryColors['news']
  const paragraphs = article.body.split('\n\n').filter(p => p.trim())

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>
      <a href="/news" style={{
        color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
        textDecoration: 'none', display: 'inline-block', marginBottom: 24,
      }}>
        ← Back to News
      </a>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 12,
            backgroundColor: colors.bg, color: colors.text,
            fontSize: 11, fontWeight: 600,
          }}>
            {categoryLabels[article.category] || article.category}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {formatDate(article.created_at)}
          </span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
          {article.title}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {article.summary}
        </p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '24px 0' }} />

      <div>
        {paragraphs.map((paragraph, i) => (
          <p key={i} style={{
            fontSize: 15, lineHeight: 1.7, color: 'var(--text)',
            marginBottom: 18,
          }}>
            {paragraph}
          </p>
        ))}
      </div>

      {article.tags.length > 0 && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {article.tags.map(tag => (
              <span key={tag} style={{
                padding: '4px 10px', borderRadius: 12,
                backgroundColor: 'var(--bg-accent)', color: 'var(--text-secondary)',
                fontSize: 12, fontWeight: 500,
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
