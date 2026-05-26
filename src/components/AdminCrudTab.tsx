'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──

export type FieldDef = {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'array'
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  width?: string
}

export type ListColumn = {
  key: string
  label: string
  render?: (val: any, row: any) => React.ReactNode
}

export type AdminCrudTabProps = {
  tableName: string
  fields: FieldDef[]
  listColumns: ListColumn[]
  getToken: () => Promise<string>
  title: string
}

// ── Styles ──

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

const listItemStyle: React.CSSProperties = {
  padding: '14px 18px',
  backgroundColor: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-light)',
  marginBottom: 6,
}

// ── Helpers ──

const JSON_FIELD_NAMES = ['rule_value', 'rules', 'conditions', 'metadata', 'config', 'data']

function isJsonField(name: string): boolean {
  return JSON_FIELD_NAMES.some(f => name.includes(f))
}

function formatForEdit(field: FieldDef, value: any): string {
  if (value == null) return ''
  if (field.type === 'array') {
    return Array.isArray(value) ? value.join(', ') : String(value)
  }
  if (field.type === 'textarea' && isJsonField(field.name) && typeof value === 'object') {
    try { return JSON.stringify(value, null, 2) } catch { return String(value) }
  }
  if (field.type === 'checkbox') return value
  return String(value)
}

function parseForSave(field: FieldDef, value: string | boolean): any {
  if (field.type === 'checkbox') return value
  if (field.type === 'number') return value === '' ? null : Number(value)
  if (field.type === 'array') {
    return typeof value === 'string'
      ? value.split(',').map(s => s.trim()).filter(Boolean)
      : value
  }
  if (field.type === 'textarea' && isJsonField(field.name) && typeof value === 'string') {
    try { return JSON.parse(value) } catch { return value }
  }
  return value === '' ? null : value
}

// ── Component ──

export default function AdminCrudTab({
  tableName,
  fields,
  listColumns,
  getToken,
  title,
}: AdminCrudTabProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiBase = `/api/admin/${tableName}`

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(apiBase, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : data.data ?? [])
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [apiBase, getToken])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── Form helpers ──

  const initForm = () => {
    const vals: Record<string, any> = {}
    for (const f of fields) {
      vals[f.name] = f.type === 'checkbox' ? false : ''
    }
    return vals
  }

  const startNew = () => {
    setFormValues(initForm())
    setEditingId(null)
    setError(null)
    setView('editor')
  }

  const startEdit = (item: any) => {
    const vals: Record<string, any> = {}
    for (const f of fields) {
      vals[f.name] = formatForEdit(f, item[f.name])
    }
    setFormValues(vals)
    setEditingId(item.id)
    setError(null)
    setView('editor')
  }

  const setField = (name: string, value: any) => {
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const requiredMissing = fields.some(f => {
    if (!f.required) return false
    const v = formValues[f.name]
    if (f.type === 'checkbox') return false
    return v === '' || v == null
  })

  const handleSave = async () => {
    if (requiredMissing) return
    setSaving(true)
    setError(null)
    try {
      const token = await getToken()
      const body: Record<string, any> = {}
      for (const f of fields) {
        body[f.name] = parseForSave(f, formValues[f.name])
      }

      const isEdit = editingId != null
      const res = await fetch(apiBase, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEdit ? { id: editingId, ...body } : body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || `Save failed (${res.status})`)
      }

      setView('list')
      fetchItems()
    } catch (err: any) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${title.replace(/s$/, '').toLowerCase()}?`)) return
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(apiBase, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || `Delete failed (${res.status})`)
      }
      fetchItems()
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    }
  }

  const backToList = () => {
    setView('list')
    setEditingId(null)
    setError(null)
  }

  // ── Editor View ──

  if (view === 'editor') {
    const disabled = requiredMissing || saving

    return (
      <div>
        <button
          onClick={backToList}
          style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >&larr; Back to {title.toLowerCase()}</button>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {editingId ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`}
        </h2>

        {error && (
          <div style={{ padding: '10px 14px', marginBottom: 16, backgroundColor: '#FEE2E2', borderRadius: 'var(--radius-sm)', color: '#DC2626', fontSize: 13, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
            {fields.map(f => (
              <div key={f.name} style={{ marginBottom: 14, width: f.width || '100%' }}>
                {f.type === 'checkbox' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={!!formValues[f.name]}
                      onChange={e => setField(f.name, e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <label style={fieldLabel}>
                      {f.label}
                      {f.required && <span style={{ color: 'var(--danger, #DC2626)', marginLeft: 2 }}>*</span>}
                    </label>

                    {f.type === 'select' ? (
                      <select
                        value={formValues[f.name] ?? ''}
                        onChange={e => setField(f.name, e.target.value)}
                        style={{
                          width: '100%', padding: '8px 12px', fontSize: 14,
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg-card)', cursor: 'pointer',
                        }}
                      >
                        <option value="">{f.placeholder || `Select ${f.label.toLowerCase()}`}</option>
                        {f.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        value={formValues[f.name] ?? ''}
                        onChange={e => setField(f.name, e.target.value)}
                        placeholder={f.placeholder}
                        rows={4}
                        style={{
                          width: '100%', resize: 'vertical',
                          fontFamily: isJsonField(f.name) ? 'monospace' : 'inherit',
                          fontSize: isJsonField(f.name) ? 13 : 14,
                          lineHeight: 1.6,
                        }}
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={formValues[f.name] ?? ''}
                        onChange={e => setField(f.name, e.target.value)}
                        placeholder={f.type === 'array' ? (f.placeholder || 'comma-separated values') : f.placeholder}
                        style={{ width: '100%' }}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              onClick={handleSave}
              disabled={disabled}
              style={{
                flex: 1, padding: 12,
                background: disabled ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: disabled ? 'var(--text-muted)' : 'var(--text-inverse)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: disabled ? 'default' : 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              {saving ? 'Saving...' : editingId ? `Update ${title.replace(/s$/, '')}` : `Create ${title.replace(/s$/, '')}`}
            </button>
            <button
              onClick={backToList}
              style={{ padding: '12px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: 'var(--bg-card)', fontSize: 14, color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── List View ──

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {items.length} {title.toLowerCase()}{items.length !== 1 ? '' : ''}
          </p>
          <button onClick={fetchItems} style={smallBtn}>Refresh</button>
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
          + Add New
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', marginBottom: 12, backgroundColor: '#FEE2E2', borderRadius: 'var(--radius-sm)', color: '#DC2626', fontSize: 13, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      )}

      {!loading && items.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: 40, backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No {title.toLowerCase()} yet. Add your first one!</p>
        </div>
      )}

      {!loading && items.map((item, idx) => (
        <div key={item.id ?? idx} style={listItemStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {listColumns.map((col, ci) => (
                <div key={col.key} style={{
                  fontSize: ci === 0 ? 15 : 13,
                  fontWeight: ci === 0 ? 600 : 400,
                  color: ci === 0 ? 'var(--text)' : 'var(--text-secondary)',
                  marginTop: ci === 0 ? 0 : 3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: ci === 0 ? 'nowrap' : undefined,
                }}>
                  {col.render ? col.render(item[col.key], item) : (
                    item[col.key] == null ? '' : String(item[col.key])
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => startEdit(item)} style={smallBtn}>Edit</button>
            <button onClick={() => handleDelete(item.id)} style={{ ...smallBtn, color: 'var(--text-muted)' }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
