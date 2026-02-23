'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'

type Article = {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  body: string
  image_url: string | null
  tags: string[]
  published: boolean
  created_at: string
  updated_at: string
}

const categoryOptions = [
  { value: 'transfer-bonus', label: 'Transfer Bonus' },
  { value: 'sweet-spot', label: 'Sweet Spot' },
  { value: 'tips', label: 'Tips' },
  { value: 'news', label: 'News' },
]

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const fieldLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
  marginBottom: 4, display: 'block',
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [category, setCategory] = useState('news')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [tagsStr, setTagsStr] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const fetchArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
    setArticles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchArticles()
  }, [user])

  if (authLoading) {
    return <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', color: 'var(--text-muted)' }}>Loading...</div>
  }

  const ADMIN_EMAIL = 'meilechbiller18@gmail.com'

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          {!user ? 'You need to sign in to access the admin panel.' : 'You do not have admin access.'}
        </p>
        {!user && (
          <a href="/login" style={{
            padding: '10px 24px', borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'var(--text-inverse)', fontWeight: 600, textDecoration: 'none',
          }}>Sign In</a>
        )}
      </div>
    )
  }

  const resetForm = () => {
    setTitle(''); setSlug(''); setSlugManual(false); setCategory('news')
    setSummary(''); setBody(''); setTagsStr(''); setPublished(false)
    setEditingId(null)
  }

  const startNew = () => {
    resetForm()
    setView('editor')
  }

  const startEdit = (article: Article) => {
    setTitle(article.title)
    setSlug(article.slug)
    setSlugManual(true)
    setCategory(article.category)
    setSummary(article.summary)
    setBody(article.body)
    setTagsStr(article.tags.join(', '))
    setPublished(article.published)
    setEditingId(article.id)
    setView('editor')
  }

  const handleSave = async () => {
    if (!title || !slug || !summary || !body) return
    setSaving(true)

    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean)
    const articleData = {
      title, slug, category, summary, body, tags, published,
      updated_at: new Date().toISOString(),
    }

    if (editingId) {
      await supabase.from('articles').update(articleData).eq('id', editingId)
    } else {
      await supabase.from('articles').insert(articleData)
    }

    setSaving(false)
    resetForm()
    setView('list')
    fetchArticles()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return
    await supabase.from('articles').delete().eq('id', id)
    fetchArticles()
  }

  const togglePublished = async (article: Article) => {
    await supabase.from('articles').update({ published: !article.published }).eq('id', article.id)
    fetchArticles()
  }

  // Editor view
  if (view === 'editor') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={() => { resetForm(); setView('list') }}
          style={{
            color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0,
          }}
        >
          ← Back to articles
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {editingId ? 'Edit Article' : 'New Article'}
        </h1>

        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)', padding: 24,
        }}>
          <label style={fieldLabel}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!slugManual) setSlug(slugify(e.target.value))
            }}
            placeholder="Article title"
            style={{ marginBottom: 14 }}
          />

          <label style={fieldLabel}>Slug (URL)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/news/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
              placeholder="article-slug"
              style={{ flex: 1 }}
            />
          </div>

          <label style={fieldLabel}>Category</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {categoryOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setCategory(opt.value)}
                style={{
                  padding: '8px 14px',
                  border: category === opt.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: category === opt.value ? 'var(--primary-light)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontWeight: category === opt.value ? 600 : 400,
                  fontSize: 13,
                  color: category === opt.value ? 'var(--primary)' : 'var(--text)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label style={fieldLabel}>Summary (1-2 sentences for preview)</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief description shown on the news listing"
            rows={2}
            style={{ marginBottom: 14, resize: 'vertical' }}
          />

          <label style={fieldLabel}>Body (separate paragraphs with blank lines)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your article here...&#10;&#10;Separate paragraphs with blank lines."
            rows={14}
            style={{ marginBottom: 14, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />

          <label style={fieldLabel}>Tags (comma separated)</label>
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="e.g. Chase, United, transfer bonus"
            style={{ marginBottom: 14 }}
          />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
            padding: '12px 14px', backgroundColor: 'var(--bg-accent)', borderRadius: 'var(--radius-sm)',
          }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              Published {published ? '(visible to everyone)' : '(draft — only visible here)'}
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={!title || !slug || !summary || !body || saving}
              style={{
                flex: 1, padding: 12,
                background: (!title || !slug || !summary || !body)
                  ? 'var(--border)'
                  : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: (!title || !slug || !summary || !body) ? 'var(--text-muted)' : 'var(--text-inverse)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: (!title || !slug || !summary || !body) ? 'default' : 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              {saving ? 'Saving...' : editingId ? 'Update Article' : 'Create Article'}
            </button>
            <button
              onClick={() => { resetForm(); setView('list') }}
              style={{
                padding: '12px 20px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                backgroundColor: 'var(--bg-card)', fontSize: 14, color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Admin — Articles</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={startNew}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'var(--text-inverse)', border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}
        >
          + New Article
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      )}

      {!loading && articles.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 40,
          backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No articles yet. Create your first one!</p>
        </div>
      )}

      {articles.map(article => (
        <div
          key={article.id}
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-light)',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 10,
                  backgroundColor: article.published ? 'var(--success-bg)' : 'var(--bg-accent)',
                  color: article.published ? 'var(--success)' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {article.published ? 'Published' : 'Draft'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(article.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{article.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{article.summary}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={() => startEdit(article)}
              style={{
                padding: '4px 12px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                backgroundColor: 'var(--bg-card)', fontSize: 12,
                color: 'var(--text-secondary)', fontWeight: 500,
              }}
            >
              Edit
            </button>
            <button
              onClick={() => togglePublished(article)}
              style={{
                padding: '4px 12px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                backgroundColor: 'var(--bg-card)', fontSize: 12,
                color: 'var(--text-secondary)', fontWeight: 500,
              }}
            >
              {article.published ? 'Unpublish' : 'Publish'}
            </button>
            <button
              onClick={() => handleDelete(article.id)}
              style={{
                padding: '4px 12px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                backgroundColor: 'var(--bg-card)', fontSize: 12,
                color: 'var(--text-muted)', fontWeight: 500,
              }}
            >
              Delete
            </button>
            {article.published && (
              <a
                href={`/news/${article.slug}`}
                target="_blank"
                style={{
                  padding: '4px 12px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)', fontSize: 12,
                  color: 'var(--primary)', fontWeight: 500, textDecoration: 'none',
                }}
              >
                View →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
