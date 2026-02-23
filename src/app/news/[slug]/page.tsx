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
        <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>
          {formatDate(article.created_at)}
        </span>
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
    </div>
  )
}
