'use client'

import { useState, useEffect } from 'react'

type Article = {
  id: string
  slug: string
  title: string
  summary: string
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(data => { setArticles(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setArticles([]); setLoading(false) })
  }, [])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Travel News</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          The latest on points, miles, transfer bonuses, and booking strategies.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      )}

      {!loading && articles.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 40,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📰</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No articles yet. Check back soon!</p>
        </div>
      )}

      {articles.map(article => (
        <a
          key={article.id}
          href={`/news/${article.slug}`}
          style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 12 }}
        >
          <div
            style={{
              padding: '20px 22px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-light)',
              transition: 'box-shadow 0.15s, transform 0.15s',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
              {formatDate(article.created_at)}
            </span>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>
              {article.title}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
              {article.summary}
            </p>
            <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
              Read more →
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
