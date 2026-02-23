'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

export default function WalletPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<WalletEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form fields
  const [currencyType, setCurrencyType] = useState<WalletEntry['currency_type']>('bank_points')
  const [program, setProgram] = useState('')
  const [balance, setBalance] = useState('')
  const [redemptionValue, setRedemptionValue] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wallet') || '[]')
    setEntries(saved)
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
  }

  const programPlaceholders: Record<string, string> = {
    bank_points: 'e.g. Chase Ultimate Rewards',
    airline_miles: 'e.g. United MileagePlus',
    cashback: 'e.g. Discover It',
    cash: 'e.g. Travel budget',
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <button
        onClick={() => router.push('/')}
        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', fontSize: 14, marginBottom: 16, padding: 0 }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 24, marginBottom: 4 }}>My Points & Miles</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Add all your points, miles, and cashback balances so we can find the best way to book.
      </p>

      {entries.length === 0 && !showForm && (
        <p style={{ color: '#999', marginBottom: 16 }}>No entries yet — add your first one below.</p>
      )}

      {entries.map(entry => (
        <div
          key={entry.id}
          style={{
            padding: 12,
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 'bold' }}>{entry.program}</span>
              <span style={{ color: '#999', fontSize: 13, marginLeft: 8 }}>{typeLabels[entry.currency_type]}</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: 16 }}>
              {entry.currency_type === 'cash'
                ? `$${entry.balance.toLocaleString()}`
                : entry.balance.toLocaleString()}
            </span>
          </div>
          {entry.currency_type === 'cashback' && entry.redemption_value && (
            <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
              {entry.redemption_value} cents per point
            </div>
          )}
          {entry.notes && (
            <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{entry.notes}</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => handleEdit(entry)}
              style={{ padding: '4px 12px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff', fontSize: 13, color: '#444' }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(entry.id)}
              style={{ padding: '4px 12px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff', fontSize: 13, color: '#cc0000' }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {showForm ? (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: 16, marginTop: 8 }}>
          <p style={{ fontWeight: 'bold', marginBottom: 12 }}>{editingId ? 'Edit Entry' : 'Add Entry'}</p>

          <label style={{ fontSize: 13, color: '#666' }}>Type</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {(['bank_points', 'airline_miles', 'cashback', 'cash'] as const).map(type => (
              <button
                key={type}
                onClick={() => setCurrencyType(type)}
                style={{
                  padding: '8px 14px',
                  border: currencyType === type ? '2px solid #000' : '1px solid #ccc',
                  borderRadius: 4,
                  backgroundColor: currencyType === type ? '#f0f0f0' : '#fff',
                  cursor: 'pointer',
                  fontWeight: currencyType === type ? 'bold' : 'normal',
                  fontSize: 13,
                }}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 13, color: '#666' }}>Program name</label>
          <input
            type="text"
            placeholder={programPlaceholders[currencyType]}
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
          />

          <label style={{ fontSize: 13, color: '#666' }}>
            {currencyType === 'cash' ? 'Amount ($)' : 'Balance'}
          </label>
          <input
            type="number"
            placeholder={currencyType === 'cash' ? 'e.g. 500' : 'e.g. 80000'}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
          />

          {currencyType === 'cashback' && (
            <>
              <label style={{ fontSize: 13, color: '#666' }}>Redemption rate (cents per point)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 1.0"
                value={redemptionValue}
                onChange={(e) => setRedemptionValue(e.target.value)}
                style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
              />
            </>
          )}

          <label style={{ fontSize: 13, color: '#666' }}>Notes (optional)</label>
          <input
            type="text"
            placeholder="e.g. Annual fee coming up in March"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={!program || !balance}
              style={{
                flex: 1, padding: 10, backgroundColor: !program || !balance ? '#ccc' : '#000',
                color: '#fff', border: 'none', borderRadius: 4,
                cursor: !program || !balance ? 'default' : 'pointer',
              }}
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={resetForm}
              style={{ padding: '10px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fff' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 15,
            marginTop: 4,
          }}
        >
          + Add Entry
        </button>
      )}
    </div>
  )
}
