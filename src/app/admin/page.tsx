'use client'

import { useState, useEffect, useMemo } from 'react'
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

type AppUser = {
  id: string
  email: string
  name: string
  created_at: string
  plan: string
  status: string
}

type Stats = {
  totalUsers: number
  proUsers: number
  freeUsers: number
  newUsersThisMonth: number
  newUsersThisWeek: number
  totalTrips: number
  totalFlights: number
  totalItineraries: number
  totalScans: number
  scansThisMonth: number
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

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
  padding: 20,
}

const ADMIN_EMAIL = 'meilechbiller18@gmail.com'

const EMAIL_TEMPLATES = [
  { id: 'welcome', name: 'Pro Welcome', desc: 'Sent after Stripe checkout' },
  { id: 'canceled', name: 'Subscription Canceled', desc: 'Sent when sub is canceled' },
  { id: 'admin-granted', name: 'Admin Grant Pro', desc: 'Sent when you grant Pro' },
  { id: 'admin-revoked', name: 'Admin Revoke Pro', desc: 'Sent when you revoke Pro' },
  { id: 'itinerary', name: 'Itinerary Share', desc: 'Sample shared itinerary' },
]

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      flex: '1 1 140px', padding: '16px 18px', backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius)', border: '1px solid var(--border-light)',
      textAlign: 'center', minWidth: 120,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Tab state
  const [tab, setTab] = useState<'dashboard' | 'articles' | 'bonuses' | 'users' | 'emails'>('dashboard')

  // Stats
  const [stats, setStats] = useState<Stats | null>(null)

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

  // Users state
  const [users, setUsers] = useState<AppUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'pro' | 'free'>('all')
  const [userSort, setUserSort] = useState<'newest' | 'oldest' | 'email'>('newest')

  // Email test state
  const [testEmailTo, setTestEmailTo] = useState(ADMIN_EMAIL)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailResults, setEmailResults] = useState<{ template: string; success: boolean; error?: string }[] | null>(null)

  const getToken = async () => {
    const session = await supabase.auth.getSession()
    return session.data.session?.access_token || ''
  }

  const fetchStats = async () => {
    const token = await getToken()
    if (!token) return
    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setStats(await res.json())
  }

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

  const fetchUsers = async () => {
    setUsersLoading(true)
    const token = await getToken()
    if (!token) { setUsersLoading(false); return }
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setUsers(data)
    }
    setUsersLoading(false)
  }

  const toggleUserPlan = async (userId: string, currentPlan: string) => {
    setTogglingUserId(userId)
    const newPlan = currentPlan === 'pro' ? 'free' : 'pro'
    const token = await getToken()
    if (!token) { setTogglingUserId(null); return }
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan: newPlan }),
    })
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan, status: newPlan === 'pro' ? 'active' : 'free' } : u))
    }
    setTogglingUserId(null)
  }

  const sendTestEmails = async () => {
    setSendingEmails(true)
    setEmailResults(null)
    const token = await getToken()
    if (!token) { setSendingEmails(false); return }
    const res = await fetch('/api/admin/test-emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: testEmailTo,
        templates: selectedTemplates.length > 0 ? selectedTemplates : undefined,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setEmailResults(data.results)
    } else {
      setEmailResults([{ template: 'all', success: false, error: 'Request failed' }])
    }
    setSendingEmails(false)
  }

  useEffect(() => {
    if (user && user.email === ADMIN_EMAIL) {
      fetchStats()
      fetchArticles()
      fetchBonuses()
      fetchUsers()
    }
  }, [user])

  // Filtered + sorted users
  const filteredUsers = useMemo(() => {
    let result = users
    if (userSearch) {
      const q = userSearch.toLowerCase()
      result = result.filter(u =>
        u.email.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q))
      )
    }
    if (userFilter === 'pro') result = result.filter(u => u.plan === 'pro')
    if (userFilter === 'free') result = result.filter(u => u.plan !== 'pro')
    if (userSort === 'newest') result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at))
    if (userSort === 'oldest') result = [...result].sort((a, b) => a.created_at.localeCompare(b.created_at))
    if (userSort === 'email') result = [...result].sort((a, b) => a.email.localeCompare(b.email))
    return result
  }, [users, userSearch, userFilter, userSort])

  if (authLoading) {
    return <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', color: 'var(--text-muted)' }}>Loading...</div>
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
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
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={() => { resetArticleForm(); setArticleView('list') }}
          style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >&larr; Back to articles</button>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {editingArticleId ? 'Edit Article' : 'New Article'}
        </h1>

        <div style={{ ...cardStyle, padding: 24 }}>
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
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={() => { resetBonusForm(); setBonusView('list') }}
          style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >&larr; Back to bonuses</button>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {editingBonusId ? 'Edit Transfer Bonus' : 'New Transfer Bonus'}
        </h1>

        <div style={{ ...cardStyle, padding: 24 }}>
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

  // ── Main view with tabs ──
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['users', 'Users'],
    ['articles', 'Articles'],
    ['bonuses', 'Bonuses'],
    ['emails', 'Emails'],
  ] as const

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Admin Panel</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border-light)', overflowX: 'auto' }}>
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer',
              backgroundColor: 'transparent', fontSize: 14, fontWeight: 600,
              color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >{label}</button>
        ))}
      </div>

      {/* ═══ Dashboard Tab ═══ */}
      {tab === 'dashboard' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>Overview</p>
            <button onClick={fetchStats} style={smallBtn}>Refresh</button>
          </div>

          {!stats ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading stats...</div>
          ) : (
            <>
              {/* Users row */}
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Users</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                <StatCard label="Total Users" value={stats.totalUsers} />
                <StatCard label="Pro Users" value={stats.proUsers} />
                <StatCard label="Free Users" value={stats.freeUsers} />
                <StatCard label="New This Week" value={stats.newUsersThisWeek} />
                <StatCard label="New This Month" value={stats.newUsersThisMonth} />
              </div>

              {/* Content row */}
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Content & Activity</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                <StatCard label="Total Trips" value={stats.totalTrips} />
                <StatCard label="Total Flights" value={stats.totalFlights} />
                <StatCard label="Itineraries" value={stats.totalItineraries} />
                <StatCard label="Total Scans" value={stats.totalScans} />
                <StatCard label="Scans This Month" value={stats.scansThisMonth} />
              </div>

              {/* Quick actions */}
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Quick Actions</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setTab('users')} style={{
                  ...smallBtn, padding: '10px 18px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: 'var(--text-inverse)', border: 'none',
                }}>Manage Users</button>
                <button onClick={() => setTab('emails')} style={{
                  ...smallBtn, padding: '10px 18px',
                }}>Test Emails</button>
                <button onClick={() => setTab('articles')} style={{
                  ...smallBtn, padding: '10px 18px',
                }}>Write Article</button>
                <button onClick={() => setTab('bonuses')} style={{
                  ...smallBtn, padding: '10px 18px',
                }}>Add Bonus</button>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ Users Tab ═══ */}
      {tab === 'users' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {filteredUsers.length}{filteredUsers.length !== users.length ? ` of ${users.length}` : ''} user{users.length !== 1 ? 's' : ''}
            </p>
            <button onClick={fetchUsers} style={smallBtn}>Refresh</button>
          </div>

          {/* Search + filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by email or name..."
              style={{ flex: '1 1 200px', padding: '8px 12px', fontSize: 14 }}
            />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value as typeof userFilter)}
              style={{ padding: '8px 12px', fontSize: 13, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', cursor: 'pointer' }}
            >
              <option value="all">All Plans</option>
              <option value="pro">Pro Only</option>
              <option value="free">Free Only</option>
            </select>
            <select
              value={userSort}
              onChange={(e) => setUserSort(e.target.value as typeof userSort)}
              style={{ padding: '8px 12px', fontSize: 13, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', cursor: 'pointer' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="email">A-Z Email</option>
            </select>
          </div>

          {usersLoading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading users...</div>}

          {!usersLoading && filteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {userSearch ? 'No users match your search.' : 'No registered users found.'}
              </p>
            </div>
          )}

          {!usersLoading && filteredUsers.map(u => (
            <div key={u.id} style={{
              padding: '14px 18px', backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-light)', marginBottom: 6,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                  {u.name && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.name}</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </span>
                  <span style={{
                    padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    backgroundColor: u.plan === 'pro' ? 'var(--success-bg)' : 'var(--bg-accent)',
                    color: u.plan === 'pro' ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                    {u.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleUserPlan(u.id, u.plan)}
                disabled={togglingUserId === u.id}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-sm)',
                  border: 'none', cursor: togglingUserId === u.id ? 'default' : 'pointer',
                  fontWeight: 600, fontSize: 12, flexShrink: 0, marginLeft: 12,
                  background: u.plan === 'pro'
                    ? 'var(--bg-accent)'
                    : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: u.plan === 'pro' ? 'var(--text-secondary)' : 'var(--text-inverse)',
                }}
              >
                {togglingUserId === u.id ? '...' : u.plan === 'pro' ? 'Revoke Pro' : 'Grant Pro'}
              </button>
            </div>
          ))}
        </>
      )}

      {/* ═══ Articles Tab ═══ */}
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
                {a.published && <a href={`/news/${a.slug}`} target="_blank" style={{ ...smallBtn, color: 'var(--primary)', textDecoration: 'none' }}>View &rarr;</a>}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ═══ Bonuses Tab ═══ */}
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
                      {b.bank_program} &rarr; {b.partner}
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

      {/* ═══ Emails Tab ═══ */}
      {tab === 'emails' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>
              Test all email templates by sending them to any address.
            </p>
          </div>

          <div style={cardStyle}>
            <label style={fieldLabel}>Send To</label>
            <input
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="email@example.com"
              style={{ marginBottom: 16 }}
            />

            <label style={fieldLabel}>Select Templates (leave all unchecked to send all)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {EMAIL_TEMPLATES.map(t => (
                <label key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  padding: '10px 14px', backgroundColor: selectedTemplates.includes(t.id) ? 'var(--primary-light)' : 'var(--bg-accent)',
                  borderRadius: 'var(--radius-sm)', border: selectedTemplates.includes(t.id) ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  transition: 'all 0.15s',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTemplates([...selectedTemplates, t.id])
                      else setSelectedTemplates(selectedTemplates.filter(s => s !== t.id))
                    }}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={sendTestEmails}
              disabled={sendingEmails || !testEmailTo}
              style={{
                width: '100%', padding: 12,
                background: sendingEmails || !testEmailTo ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: sendingEmails || !testEmailTo ? 'var(--text-muted)' : 'var(--text-inverse)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: sendingEmails || !testEmailTo ? 'default' : 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              {sendingEmails
                ? 'Sending...'
                : selectedTemplates.length > 0
                  ? `Send ${selectedTemplates.length} Test Email${selectedTemplates.length > 1 ? 's' : ''}`
                  : 'Send All 5 Test Emails'
              }
            </button>

            {/* Results */}
            {emailResults && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Results:</p>
                {emailResults.map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', marginBottom: 4,
                    backgroundColor: r.success ? 'var(--success-bg)' : '#FEE2E2',
                    borderRadius: 'var(--radius-sm)', fontSize: 13,
                  }}>
                    <span style={{ fontWeight: 600, color: r.success ? 'var(--success)' : '#DC2626' }}>
                      {r.success ? 'Sent' : 'Failed'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {EMAIL_TEMPLATES.find(t => t.id === r.template)?.name || r.template}
                    </span>
                    {r.error && <span style={{ color: '#DC2626', fontSize: 12 }}>— {r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email catalog */}
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>All Email Templates</p>
            {EMAIL_TEMPLATES.map(t => (
              <div key={t.id} style={{
                padding: '12px 16px', backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius)', border: '1px solid var(--border-light)',
                marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.desc}</div>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  backgroundColor: 'var(--success-bg)', color: 'var(--success)',
                }}>Active</span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
}
