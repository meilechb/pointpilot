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
    month: 'long', day: 'numeric', year: 'numeric',
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

  const featured = articles[0]
  const rest = articles.slice(1)

  return (
    <div>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-nav) 0%, #2D2B55 100%)',
        padding: '56px 20px 48px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 36, fontWeight: 800, color: 'var(--text-inverse)',
          letterSpacing: -1, marginBottom: 8,
        }}>
          Travel News
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', maxWidth: 500, margin: '0 auto' }}>
          Points deals, transfer bonuses, and booking strategies
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 16 }}>Loading...</div>
        )}

        {!loading && articles.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 80,
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--border)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📰</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 18 }}>No articles yet. Check back soon!</p>
          </div>
        )}

        {/* Featured / latest article — big card */}
        {featured && (
          <a
            href={`/news/${featured.slug}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 32 }}
          >
            <div
              style={{
                padding: '40px 36px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-light)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 16,
                textTransform: 'uppercase',
              }}>
                Latest
              </div>
              <h2 style={{
                fontSize: 32, fontWeight: 800, lineHeight: 1.2,
                marginBottom: 12, letterSpacing: -0.5,
              }}>
                {featured.title}
              </h2>
              <p style={{
                fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6,
                marginBottom: 16, maxWidth: 700,
              }}>
                {featured.summary}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {formatDate(featured.created_at)}
                </span>
                <span style={{ fontSize: 15, color: 'var(--primary)', fontWeight: 600 }}>
                  Read article →
                </span>
              </div>
            </div>
          </a>
        )}

        {/* Rest of articles */}
        {rest.length > 0 && (
          <div className="news-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
          }}>
            {rest.map(article => (
              <a
                key={article.id}
                href={`/news/${article.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div
                  style={{
                    padding: '28px 24px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-light)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                    {formatDate(article.created_at)}
                  </span>
                  <h3 style={{
                    fontSize: 22, fontWeight: 700, lineHeight: 1.3,
                    marginBottom: 10, letterSpacing: -0.3, flex: 1,
                  }}>
                    {article.title}
                  </h3>
                  <p style={{
                    fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5,
                    marginBottom: 14,
                  }}>
                    {article.summary}
                  </p>
                  <span style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>
                    Read more →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
