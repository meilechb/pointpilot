'use client'

import { useState, useEffect } from 'react'

type Article = {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  tags: string[]
  created_at: string
}

const categories = [
  { value: '', label: 'All' },
  { value: 'transfer-bonus', label: 'Transfer Bonuses' },
  { value: 'sweet-spot', label: 'Sweet Spots' },
  { value: 'tips', label: 'Tips' },
  { value: 'news', label: 'News' },
]

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
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = activeCategory
      ? `/api/articles?category=${activeCategory}`
      : '/api/articles'

    fetch(url)
      .then(r => r.json())
      .then(data => { setArticles(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setArticles([]); setLoading(false) })
  }, [activeCategory])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>News & Deals</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Transfer bonuses, sweet spots, and points tips to help you book smarter.
        </p>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            style={{
              padding: '8px 16px',
              border: activeCategory === cat.value ? '2px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeCategory === cat.value ? 'var(--primary-light)' : 'var(--bg-card)',
              cursor: 'pointer',
              fontWeight: activeCategory === cat.value ? 600 : 400,
              fontSize: 13,
              color: activeCategory === cat.value ? 'var(--primary)' : 'var(--text)',
              transition: 'all 0.15s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Loading...
        </div>
      )}

      {/* Empty state */}
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

      {/* Article cards */}
      {articles.map(article => {
        const colors = categoryColors[article.category] || categoryColors['news']
        return (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 12,
                  backgroundColor: colors.bg, color: colors.text,
                  fontSize: 11, fontWeight: 600,
                }}>
                  {categoryLabels[article.category] || article.category}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatDate(article.created_at)}
                </span>
              </div>
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
        )
      })}
    </div>
  )
}
