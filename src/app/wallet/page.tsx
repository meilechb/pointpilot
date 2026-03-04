'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import SavePrompt from '@/components/SavePrompt'
import ProgramSelect from '@/components/ProgramSelect'
import WalletCard from '@/components/WalletCard'
import { bankPointPrograms, airlineMilesPrograms, cashbackPrograms } from '@/data/programOptions'
import { pointValuations } from '@/data/pointsKnowledge'
import { createClient } from '@/lib/supabase'
import { loadWallet, saveWalletEntry, deleteWalletEntry, saveAllWalletEntries } from '@/lib/dataService'

type Bonus = {
  id: string
  bank_program: string
  partner: string
  bonus_percent: number
  expires_at: string | null
  notes: string | null
}

type WalletEntry = {
  id: string
  currency_type: 'bank_points' | 'airline_miles' | 'cashback' | 'cash'
  program: string
  balance: number
  redemption_value: number | null
  notes: string
}

const typeLabels: Record<string, string> = {
  bank_points: 'Bank Points',
  airline_miles: 'Airline Miles',
  cashback: 'Cashback',
  cash: 'Cash',
}

const typeIcons: Record<string, string> = {
  bank_points: '💳',
  airline_miles: '✈️',
  cashback: '💰',
  cash: '💵',
}

const typeOrder: Record<string, number> = {
  bank_points: 0,
  airline_miles: 1,
  cashback: 2,
  cash: 3,
}


export default function WalletPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<WalletEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [currencyType, setCurrencyType] = useState<WalletEntry['currency_type']>('bank_points')
  const [program, setProgram] = useState('')
  const [balance, setBalance] = useState('')
  const [redemptionValue, setRedemptionValue] = useState('')
  const [notes, setNotes] = useState('')
  const [savePromptTrigger, setSavePromptTrigger] = useState<'flight' | 'plan' | 'trip' | 'wallet' | null>(null)
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [loading, setLoading] = useState(true)

  // Filter, sort, search, view state
  const [filterType, setFilterType] = useState<'all' | WalletEntry['currency_type']>('all')
  const [sortBy, setSortBy] = useState<'default' | 'balance' | 'type' | 'program'>('default')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadWallet().then(saved => { setEntries(saved); setLoading(false) }).catch(() => { setLoading(false) })

    // Fetch active transfer bonuses from Supabase
    const fetchBonuses = async () => {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('transfer_bonuses')
        .select('*')
        .or(`expires_at.is.null,expires_at.gte.${today}`)
      setBonuses(data || [])
    }
    fetchBonuses()
  }, [])

  const saveEntries = (updated: WalletEntry[]) => {
    setEntries(updated)
    saveAllWalletEntries(updated)
  }

  const resetForm = () => {
    setCurrencyType('bank_points')
    setProgram('')
    setBalance('')
    setRedemptionValue('')
    setNotes('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = () => {
    // Duplicate detection
    const duplicate = entries.find(e =>
      e.program.toLowerCase() === program.toLowerCase() &&
      e.currency_type === currencyType &&
      e.id !== editingId
    )
    if (duplicate) {
      if (!confirm(`You already have "${duplicate.program}" with ${duplicate.balance.toLocaleString()} points. Add another entry anyway?`)) {
        return
      }
    }

    const entry: WalletEntry = {
      id: editingId || crypto.randomUUID(),
      currency_type: currencyType,
      program,
      balance: parseFloat(balance) || 0,
      redemption_value: currencyType === 'cashback' ? (parseFloat(redemptionValue) || null) : null,
      notes,
    }
    let updated: WalletEntry[]
    if (editingId) {
      updated = entries.map(e => e.id === editingId ? entry : e)
    } else {
      updated = [...entries, entry]
    }
    saveEntries(updated)
    if (!editingId && updated.length === 1) {
      setSavePromptTrigger('wallet')
    }
    resetForm()
  }

  const handleEdit = (entry: WalletEntry) => {
    setCurrencyType(entry.currency_type)
    setProgram(entry.program)
    setBalance(entry.balance.toString())
    setRedemptionValue(entry.redemption_value?.toString() || '')
    setNotes(entry.notes)
    setEditingId(entry.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    saveEntries(entries.filter(e => e.id !== id))
    if (editingId === id) resetForm()
  }

  const programPlaceholders: Record<string, string> = {
    bank_points: 'e.g. Chase Ultimate Rewards',
    airline_miles: 'e.g. United MileagePlus',
    cashback: 'e.g. Discover It',
    cash: 'e.g. Travel budget',
  }

  // Derived data
  const totalPoints = entries.filter(e => e.currency_type !== 'cash').reduce((s, e) => s + e.balance, 0)
  const totalCash = entries.filter(e => e.currency_type === 'cash').reduce((s, e) => s + e.balance, 0)

  // Portfolio value estimate
  const estimatedValue = entries.reduce((total, entry) => {
    if (entry.currency_type === 'cash') return total + entry.balance
    if (entry.currency_type === 'cashback' && entry.redemption_value) {
      return total + (entry.balance * entry.redemption_value / 100)
    }
    const valuation = pointValuations.find(v =>
      v.program.toLowerCase() === entry.program.toLowerCase() ||
      entry.program.toLowerCase().includes(v.program.toLowerCase().split(' ')[0])
    )
    if (valuation) return total + (entry.balance * valuation.centsPerPoint / 100)
    return total
  }, 0)

  // Filter + search
  const filteredEntries = entries.filter(e => {
    if (filterType !== 'all' && e.currency_type !== filterType) return false
    if (searchQuery && !e.program.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Sort
  const displayEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === 'balance') return b.balance - a.balance
    if (sortBy === 'type') return (typeOrder[a.currency_type] ?? 9) - (typeOrder[b.currency_type] ?? 9)
    if (sortBy === 'program') return a.program.localeCompare(b.program)
    return 0
  })

  const toggleGroup = (type: string) => {
    const next = new Set(collapsedGroups)
    next.has(type) ? next.delete(type) : next.add(type)
    setCollapsedGroups(next)
  }

  const renderEntry = (entry: WalletEntry) => {
    if (editingId === entry.id && showForm) return null
    return (
      <WalletCard
        key={entry.id}
        entry={entry}
        bonuses={bonuses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>My Points & Miles</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Add all your balances so we can find the best way to book your flights.
        </p>
      </div>

      {/* Summary cards */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: 140, padding: '16px 18px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Total Points & Miles</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{totalPoints.toLocaleString()}</div>
          </div>
          {totalCash > 0 && (
            <div style={{
              flex: 1, minWidth: 140, padding: '16px 18px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-light)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Cash Budget</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>${totalCash.toLocaleString()}</div>
            </div>
          )}
          {estimatedValue > 0 && (
            <div style={{
              flex: 1, minWidth: 140, padding: '16px 18px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-light)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Est. Portfolio Value</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#B8860B' }}>~${Math.round(estimatedValue).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Based on avg cpp valuations</div>
            </div>
          )}
        </div>
      )}

      {/* Filter chips + toolbar */}
      {entries.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          {/* Type filter chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {(['all', 'bank_points', 'airline_miles', 'cashback', 'cash'] as const).map(type => {
              const count = type === 'all' ? entries.length : entries.filter(e => e.currency_type === type).length
              if (type !== 'all' && count === 0) return null
              const icon = type === 'all' ? '' : typeIcons[type]
              const label = type === 'all' ? 'All' : typeLabels[type]
              const isActive = filterType === type
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: '5px 12px',
                    border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 20,
                    backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {icon}{icon ? ' ' : ''}{label} ({count})
                </button>
              )
            })}
          </div>

          {/* Search + sort + view toggle */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, minWidth: 140, padding: '7px 12px', fontSize: 13,
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)', color: 'var(--text)',
                outline: 'none',
              }}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                padding: '7px 10px', fontSize: 13, border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              <option value="default">Sort: Default</option>
              <option value="balance">Balance (High→Low)</option>
              <option value="type">Type</option>
              <option value="program">Program (A-Z)</option>
            </select>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {(['list', 'grouped'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 12px', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: viewMode === mode ? 600 : 400,
                    backgroundColor: viewMode === mode ? 'var(--primary-light)' : 'var(--bg-card)',
                    color: viewMode === mode ? 'var(--primary)' : 'var(--text-muted)',
                  }}
                >
                  {mode === 'list' ? 'List' : 'Grouped'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Entries */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              padding: '18px 20px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ height: 32, width: 32, backgroundColor: 'var(--border-light)', borderRadius: 8 }} />
                  <div style={{ height: 16, width: 140, backgroundColor: 'var(--border)', borderRadius: 6 }} />
                </div>
                <div style={{ height: 22, width: 80, backgroundColor: 'var(--border-light)', borderRadius: 6 }} />
              </div>
              <div style={{ height: 14, width: '50%', backgroundColor: 'var(--border-light)', borderRadius: 6 }} />
            </div>
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
        </div>
      ) : entries.length === 0 && !showForm ? (
        <div style={{
          textAlign: 'center', padding: 40,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
          marginBottom: 16,
        }}>
          {!user ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Sign in to see your points & miles.</p>
              <a
                href="/login?redirect=/wallet"
                style={{
                  display: 'inline-block', padding: '10px 24px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: 'var(--text-inverse)', borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none', fontWeight: 600, fontSize: 14,
                }}
              >
                Sign In
              </a>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No entries yet — add your first points balance below.</p>
            </>
          )}
        </div>
      ) : null}

      {/* Entry list / grouped view */}
      {!loading && entries.length > 0 && (
        viewMode === 'grouped' ? (
          (['bank_points', 'airline_miles', 'cashback', 'cash'] as const)
            .filter(type => displayEntries.some(e => e.currency_type === type))
            .map(type => {
              const groupEntries = displayEntries.filter(e => e.currency_type === type)
              const isCollapsed = collapsedGroups.has(type)
              const groupBalance = groupEntries.reduce((s, e) => s + e.balance, 0)
              return (
                <div key={type} style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => toggleGroup(type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{isCollapsed ? '▸' : '▾'}</span>
                    <span>{typeIcons[type]} {typeLabels[type]}</span>
                    <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
                      ({groupEntries.length}) — {type === 'cash' ? `$${groupBalance.toLocaleString()}` : `${groupBalance.toLocaleString()} pts`}
                    </span>
                  </button>
                  {!isCollapsed && groupEntries.map(renderEntry)}
                </div>
              )
            })
        ) : (
          displayEntries.map(renderEntry)
        )
      )}

      {/* No results message */}
      {!loading && entries.length > 0 && displayEntries.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
          No entries match your filter.
        </div>
      )}

      {/* Form */}
      {showForm ? (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          border: editingId ? '2px solid var(--primary)' : '1px solid var(--border-light)',
          padding: 20,
          marginTop: 8,
        }}>
          {editingId && (
            <div style={{
              padding: '6px 12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
              borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: 13, fontWeight: 600,
            }}>
              ✎ Editing {entries.find(e => e.id === editingId)?.program || 'entry'}
            </div>
          )}
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>{editingId ? 'Edit Entry' : 'Add Entry'}</p>

          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Type</label>
          <div className="wallet-types" style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {(['bank_points', 'airline_miles', 'cashback', 'cash'] as const).map(type => (
              <button
                key={type}
                onClick={() => setCurrencyType(type)}
                style={{
                  padding: '8px 14px',
                  border: currencyType === type ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: currencyType === type ? 'var(--primary-light)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontWeight: currencyType === type ? 600 : 400,
                  fontSize: 13,
                  color: currencyType === type ? 'var(--primary)' : 'var(--text)',
                  transition: 'all 0.15s',
                }}
              >
                {typeIcons[type]} {typeLabels[type]}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Program name</label>
          {currencyType === 'cash' ? (
            <input
              type="text"
              placeholder="e.g. Travel budget"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              style={{ marginBottom: 12 }}
            />
          ) : (
            <ProgramSelect
              value={program}
              onChange={setProgram}
              options={
                currencyType === 'bank_points' ? bankPointPrograms :
                currencyType === 'airline_miles' ? airlineMilesPrograms :
                cashbackPrograms
              }
              placeholder={programPlaceholders[currencyType]}
              style={{ marginBottom: 12 }}
            />
          )}

          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
            {currencyType === 'cash' ? 'Amount ($)' : 'Balance'}
          </label>
          <input
            type="number"
            placeholder={currencyType === 'cash' ? 'e.g. 500' : 'e.g. 80000'}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            style={{ marginBottom: 12 }}
          />

          {currencyType === 'cashback' && (
            <>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Redemption rate (cents per point)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 1.0"
                value={redemptionValue}
                onChange={(e) => setRedemptionValue(e.target.value)}
                style={{ marginBottom: 12 }}
              />
            </>
          )}

          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Notes (optional)</label>
          <input
            type="text"
            placeholder="e.g. Annual fee coming up in March"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={!program || !balance}
              style={{
                flex: 1, padding: 12,
                background: !program || !balance ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: !program || !balance ? 'var(--text-muted)' : 'var(--text-inverse)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: !program || !balance ? 'default' : 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={resetForm}
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
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%', padding: 14, marginTop: 8,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'var(--text-inverse)',
            border: 'none', borderRadius: 'var(--radius)',
            cursor: 'pointer', fontSize: 15, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(67, 56, 202, 0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(67, 56, 202, 0.4)' }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(67, 56, 202, 0.3)' }}
        >
          + Add Entry
        </button>
      )}

      <SavePrompt trigger={savePromptTrigger} />
    </div>
  )
}
