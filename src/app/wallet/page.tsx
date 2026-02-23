'use client'

import { useState, useEffect } from 'react'
import SavePrompt from '@/components/SavePrompt'
import ProgramSelect from '@/components/ProgramSelect'
import WalletCard from '@/components/WalletCard'
import { bankPointPrograms, airlineMilesPrograms, cashbackPrograms } from '@/data/programOptions'
import { createClient } from '@/lib/supabase'

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


export default function WalletPage() {
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

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wallet') || '[]')
    setEntries(saved)

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
    localStorage.setItem('wallet', JSON.stringify(updated))
    setEntries(updated)
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
    saveEntries(entries.filter(e => e.id !== id))
    if (editingId === id) resetForm()
  }

  const programPlaceholders: Record<string, string> = {
    bank_points: 'e.g. Chase Ultimate Rewards',
    airline_miles: 'e.g. United MileagePlus',
    cashback: 'e.g. Discover It',
    cash: 'e.g. Travel budget',
  }

  const totalPoints = entries.filter(e => e.currency_type !== 'cash').reduce((s, e) => s + e.balance, 0)
  const totalCash = entries.filter(e => e.currency_type === 'cash').reduce((s, e) => s + e.balance, 0)

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
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{
            flex: 1, padding: '16px 18px',
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
              flex: 1, padding: '16px 18px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-light)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Cash Budget</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>${totalCash.toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 && !showForm && (
        <div style={{
          textAlign: 'center', padding: 40,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No entries yet — add your first points balance below.</p>
        </div>
      )}

      {entries.map(entry => {
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
      })}

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