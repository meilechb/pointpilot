'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'
import ProgramSelect from '@/components/ProgramSelect'
import { transferPartners } from '@/data/transferPartners'

type Article = {
  id: string
  slug: string
  title: string
  summary: string
  body: string
  published: boolean
  created_at: string
}

type Bonus = {
  id: string
  bank_program: string
  partner: string
  bonus_percent: number
  expires_at: string | null
  notes: string | null
  created_at: string
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const fieldLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
  marginBottom: 4, display: 'block',
}

const smallBtn: React.CSSProperties = {
  padding: '4px 12px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
  backgroundColor: 'var(--bg-card)', fontSize: 13,
  color: 'var(--text-secondary)', fontWeight: 500,
}

const ADMIN_EMAIL = 'meilechbiller18@gmail.com'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Tab state
  const [tab, setTab] = useState<'articles' | 'bonuses'>('articles')

  // Articles state
  const [articles, setArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(true)
  const [articleView, setArticleView] = useState<'list' | 'editor'>('list')
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [published, setPublished] = useState(false)
  const [savingArticle, setSavingArticle] = useState(false)

  // Bonuses state
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [bonusesLoading, setBonusesLoading] = useState(true)
  const [bonusView, setBonusView] = useState<'list' | 'editor'>('list')
  const [editingBonusId, setEditingBonusId] = useState<string | null>(null)
  const [bankProgram, setBankProgram] = useState('')
  const [partner, setPartner] = useState('')
  const [bonusPercent, setBonusPercent] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [bonusNotes, setBonusNotes] = useState('')
  const [savingBonus, setSavingBonus] = useState(false)

  const fetchArticles = async () => {
    const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false })
    setArticles(data || [])
    setArticlesLoading(false)
  }

  const fetchBonuses = async () => {
    const { data } = await supabase.from('transfer_bonuses').select('*').order('created_at', { ascending: false })
    setBonuses(data || [])
    setBonusesLoading(false)
  }

  useEffect(() => {
    if (user && user.email === ADMIN_EMAIL) {
      fetchArticles()
      fetchBonuses()
    }
  }, [user])

  if (authLoading) {
    return <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', color: 'var(--text-muted)' }}>Loading...</div>
  }

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

  // ── Article helpers ──
  const resetArticleForm = () => {
    setTitle(''); setSlug(''); setSlugManual(false)
    setSummary(''); setBody(''); setPublished(false)
    setEditingArticleId(null)
  }

  const startNewArticle = () => { resetArticleForm(); setArticleView('editor') }

  const startEditArticle = (a: Article) => {
    setTitle(a.title); setSlug(a.slug); setSlugManual(true)
    setSummary(a.summary); setBody(a.body); setPublished(a.published)
    setEditingArticleId(a.id); setArticleView('editor')
  }

  const handleSaveArticle = async () => {
    if (!title || !slug || !summary || !body) return
    setSavingArticle(true)
    const data = {
      title, slug, summary, body, published,
      category: 'news', tags: [],
      updated_at: new Date().toISOString(),
    }
    if (editingArticleId) {
      await supabase.from('articles').update(data).eq('id', editingArticleId)
    } else {
      await supabase.from('articles').insert(data)
    }
    setSavingArticle(false); resetArticleForm(); setArticleView('list'); fetchArticles()
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return
    await supabase.from('articles').delete().eq('id', id); fetchArticles()
  }

  const togglePublished = async (a: Article) => {
    await supabase.from('articles').update({ published: !a.published }).eq('id', a.id); fetchArticles()
  }

  // ── Bonus helpers ──
  const resetBonusForm = () => {
    setBankProgram(''); setPartner(''); setBonusPercent('')
    setExpiresAt(''); setBonusNotes('')
    setEditingBonusId(null)
  }

  const startNewBonus = () => { resetBonusForm(); setBonusView('editor') }

  const startEditBonus = (b: Bonus) => {
    setBankProgram(b.bank_program); setPartner(b.partner)
    setBonusPercent(b.bonus_percent.toString())
    setExpiresAt(b.expires_at ? b.expires_at.split('T')[0] : '')
    setBonusNotes(b.notes || '')
    setEditingBonusId(b.id); setBonusView('editor')
  }

  const handleSaveBonus = async () => {
    if (!bankProgram || !partner || !bonusPercent) return
    setSavingBonus(true)
    const data = {
      bank_program: bankProgram,
      partner,
      bonus_percent: parseInt(bonusPercent),
      expires_at: expiresAt || null,
      notes: bonusNotes || null,
    }
    if (editingBonusId) {
      await supabase.from('transfer_bonuses').update(data).eq('id', editingBonusId)
    } else {
      await supabase.from('transfer_bonuses').insert(data)
    }
    setSavingBonus(false); resetBonusForm(); setBonusView('list'); fetchBonuses()
  }

  const deleteBonus = async (id: string) => {
    if (!confirm('Delete this bonus?')) return
    await supabase.from('transfer_bonuses').delete().eq('id', id); fetchBonuses()
  }

  // ── Article editor view ──
  if (tab === 'articles' && articleView === 'editor') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={() => { resetArticleForm(); setArticleView('list') }}
          style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >← Back to articles</button>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {editingArticleId ? 'Edit Article' : 'New Article'}
        </h1>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)', padding: 24 }}>
          <label style={fieldLabel}>Title</label>
          <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); if (!slugManual) setSlug(slugify(e.target.value)) }} placeholder="Article title" style={{ marginBottom: 14 }} />

          <label style={fieldLabel}>Slug (URL)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/news/</span>
            <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }} placeholder="article-slug" style={{ flex: 1 }} />
          </div>

          <label style={fieldLabel}>Summary (1-2 sentences for preview)</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief description shown on the news listing" rows={2} style={{ marginBottom: 14, resize: 'vertical' }} />

          <label style={fieldLabel}>Body (separate paragraphs with blank lines)</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={"Write your article here...\n\nSeparate paragraphs with blank lines."} rows={14} style={{ marginBottom: 14, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 14px', backgroundColor: 'var(--bg-accent)', borderRadius: 'var(--radius-sm)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              Published {published ? '(visible to everyone)' : '(draft — only visible here)'}
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSaveArticle} disabled={!title || !slug || !summary || !body || savingArticle} style={{
              flex: 1, padding: 12,
              background: (!title || !slug || !summary || !body) ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: (!title || !slug || !summary || !body) ? 'var(--text-muted)' : 'var(--text-inverse)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: (!title || !slug || !summary || !body) ? 'default' : 'pointer', fontWeight: 600, fontSize: 14,
            }}>
              {savingArticle ? 'Saving...' : editingArticleId ? 'Update Article' : 'Create Article'}
            </button>
            <button onClick={() => { resetArticleForm(); setArticleView('list') }} style={{ padding: '12px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: 'var(--bg-card)', fontSize: 14, color: 'var(--text-secondary)' }}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Bonus editor view ──
  if (tab === 'bonuses' && bonusView === 'editor') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={() => { resetBonusForm(); setBonusView('list') }}
          style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >← Back to bonuses</button>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {editingBonusId ? 'Edit Transfer Bonus' : 'New Transfer Bonus'}
        </h1>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)', padding: 24 }}>
          <label style={fieldLabel}>Bank Program</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {['Chase Ultimate Rewards', 'Amex Membership Rewards', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards'].map(prog => (
              <button key={prog} onClick={() => { setBankProgram(prog); if (prog !== bankProgram) setPartner('') }} style={{
                padding: '8px 14px',
                border: bankProgram === prog ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: bankProgram === prog ? 'var(--primary-light)' : 'var(--bg-card)',
                cursor: 'pointer', fontWeight: bankProgram === prog ? 600 : 400,
                fontSize: 13, color: bankProgram === prog ? 'var(--primary)' : 'var(--text)',
              }}>
                {prog.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>

          <label style={fieldLabel}>Transfer Partner {bankProgram ? `(${transferPartners.find(p => p.name === bankProgram)?.partners.length || 0} airlines)` : ''}</label>
          <ProgramSelect
            value={partner}
            onChange={setPartner}
            options={
              transferPartners
                .find(p => p.name === bankProgram)
                ?.partners.map(p => ({ value: p.partner, label: p.partner })) || []
            }
            placeholder={bankProgram ? 'Select transfer partner' : 'Select a bank program first'}
            style={{ marginBottom: 14 }}
          />

          <label style={fieldLabel}>Bonus Percentage (%)</label>
          <input type="number" value={bonusPercent} onChange={(e) => setBonusPercent(e.target.value)} placeholder="e.g. 25, 30, 50" style={{ marginBottom: 14 }} />

          <label style={fieldLabel}>Expires (optional)</label>
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} style={{ marginBottom: 14 }} />

          <label style={fieldLabel}>Notes (optional)</label>
          <input type="text" value={bonusNotes} onChange={(e) => setBonusNotes(e.target.value)} placeholder="e.g. Must transfer by midnight EST" style={{ marginBottom: 20 }} />

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSaveBonus} disabled={!bankProgram || !partner || !bonusPercent || savingBonus} style={{
              flex: 1, padding: 12,
              background: (!bankProgram || !partner || !bonusPercent) ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: (!bankProgram || !partner || !bonusPercent) ? 'var(--text-muted)' : 'var(--text-inverse)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: (!bankProgram || !partner || !bonusPercent) ? 'default' : 'pointer', fontWeight: 600, fontSize: 14,
            }}>
              {savingBonus ? 'Saving...' : editingBonusId ? 'Update Bonus' : 'Add Bonus'}
            </button>
            <button onClick={() => { resetBonusForm(); setBonusView('list') }} style={{ padding: '12px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: 'var(--bg-card)', fontSize: 14, color: 'var(--text-secondary)' }}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main list view with tabs ──
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Admin</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border-light)' }}>
        {([['articles', 'Articles'], ['bonuses', 'Transfer Bonuses']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer',
              backgroundColor: 'transparent', fontSize: 14, fontWeight: 600,
              color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Articles tab */}
      {tab === 'articles' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
            <button onClick={startNewArticle} style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'var(--text-inverse)', border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}>+ New Article</button>
          </div>

          {articlesLoading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>}

          {!articlesLoading && articles.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No articles yet. Create your first one!</p>
            </div>
          )}

          {articles.map(a => (
            <div key={a.id} style={{ padding: '16px 18px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: a.published ? 'var(--success-bg)' : 'var(--bg-accent)', color: a.published ? 'var(--success)' : 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
                  {a.published ? 'Published' : 'Draft'}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{a.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>{a.summary}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={() => startEditArticle(a)} style={smallBtn}>Edit</button>
                <button onClick={() => togglePublished(a)} style={smallBtn}>{a.published ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => deleteArticle(a.id)} style={{ ...smallBtn, color: 'var(--text-muted)' }}>Delete</button>
                {a.published && <a href={`/news/${a.slug}`} target="_blank" style={{ ...smallBtn, color: 'var(--primary)', textDecoration: 'none' }}>View →</a>}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Bonuses tab */}
      {tab === 'bonuses' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{bonuses.length} bonus{bonuses.length !== 1 ? 'es' : ''}</p>
            <button onClick={startNewBonus} style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, var(--accent), #E8C36A)',
              color: 'var(--text)', border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}>+ New Bonus</button>
          </div>

          {bonusesLoading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>}

          {!bonusesLoading && bonuses.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No transfer bonuses yet.</p>
            </div>
          )}

          {bonuses.map(b => {
            const isExpired = b.expires_at && new Date(b.expires_at) < new Date()
            return (
              <div key={b.id} style={{ padding: '16px 18px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', marginBottom: 8, opacity: isExpired ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {b.bank_program} → {b.partner}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ padding: '2px 10px', borderRadius: 10, backgroundColor: 'var(--accent-light)', color: '#B8860B', fontSize: 13, fontWeight: 700 }}>
                        +{b.bonus_percent}%
                      </span>
                      {b.expires_at && (
                        <span style={{ fontSize: 13, color: isExpired ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {isExpired ? 'Expired' : `Expires ${new Date(b.expires_at).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                    {b.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{b.notes}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => startEditBonus(b)} style={smallBtn}>Edit</button>
                  <button onClick={() => deleteBonus(b.id)} style={{ ...smallBtn, color: 'var(--text-muted)' }}>Delete</button>
                </div>
              </div>
            )
          })}
        </>
      )}

    </div>
  )
}
