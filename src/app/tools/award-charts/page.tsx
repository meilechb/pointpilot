'use client'

import { useState, useEffect, useMemo } from 'react'

type AwardChart = {
  id: string
  program_name: string
  origin_region: string
  destination_region: string
  cabin_class: string
  pricing_type: string
  points_min: number
  points_max: number | null
  is_one_way: boolean
  partner_airlines: string[] | null
  notes: string | null
}

const CABIN_OPTIONS = ['economy', 'premium_economy', 'business', 'first']
const CABIN_LABELS: Record<string, string> = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First',
}

export default function AwardChartsPage() {
  const [charts, setCharts] = useState<AwardChart[]>([])
  const [loading, setLoading] = useState(true)
  const [programFilter, setProgramFilter] = useState('')
  const [cabinFilter, setCabinFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  useEffect(() => {
    fetch('/api/award-charts')
      .then(r => r.json())
      .then(data => {
        setCharts(data.awardCharts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const programs = useMemo(() => {
    const set = new Set(charts.map(c => c.program_name))
    return Array.from(set).sort()
  }, [charts])

  const regions = useMemo(() => {
    const set = new Set<string>()
    charts.forEach(c => { set.add(c.origin_region); set.add(c.destination_region) })
    return Array.from(set).sort()
  }, [charts])

  const filtered = useMemo(() => {
    return charts.filter(c => {
      if (programFilter && c.program_name !== programFilter) return false
      if (cabinFilter && c.cabin_class !== cabinFilter) return false
      if (regionFilter && c.origin_region !== regionFilter && c.destination_region !== regionFilter) return false
      return true
    })
  }, [charts, programFilter, cabinFilter, regionFilter])

  // Group by program
  const grouped = useMemo(() => {
    const map = new Map<string, AwardChart[]>()
    for (const c of filtered) {
      const list = map.get(c.program_name) || []
      list.push(c)
      map.set(c.program_name, list)
    }
    return map
  }, [filtered])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <a href="/tools" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
          &larr; Back to Tools
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Award Charts</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>
          Browse award pricing by program, route, and cabin class. Compare how many points you need across different programs.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24,
        backgroundColor: 'var(--bg-card)', padding: 16, borderRadius: 'var(--radius)',
        border: '1px solid var(--border-light)',
      }}>
        <select
          value={programFilter}
          onChange={e => setProgramFilter(e.target.value)}
          style={{
            padding: '8px 10px', borderRadius: 8, fontSize: 13,
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
          }}
        >
          <option value="">All Programs</option>
          {programs.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={cabinFilter}
          onChange={e => setCabinFilter(e.target.value)}
          style={{
            padding: '8px 10px', borderRadius: 8, fontSize: 13,
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
          }}
        >
          <option value="">All Cabins</option>
          {CABIN_OPTIONS.map(c => <option key={c} value={c}>{CABIN_LABELS[c]}</option>)}
        </select>
        <select
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
          style={{
            padding: '8px 10px', borderRadius: 8, fontSize: 13,
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
          }}
        >
          <option value="">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading award charts...</div>
      ) : charts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 40,
          backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 8 }}>
            No award chart data available yet.
          </p>
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            Award chart data is managed by the admin. Check back soon!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Array.from(grouped.entries()).map(([program, programCharts]) => (
            <div key={program} style={{
              backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)', overflow: 'hidden',
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-main)',
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  {program}
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Route</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Cabin</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Points</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Type</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programCharts.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>
                          {c.origin_region} → {c.destination_region}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                            backgroundColor: c.cabin_class === 'first' ? '#fef3c7' :
                              c.cabin_class === 'business' ? '#dbeafe' :
                              c.cabin_class === 'premium_economy' ? '#e0e7ff' : '#f3f4f6',
                            color: c.cabin_class === 'first' ? '#92400e' :
                              c.cabin_class === 'business' ? '#1e40af' :
                              c.cabin_class === 'premium_economy' ? '#3730a3' : '#374151',
                          }}>
                            {CABIN_LABELS[c.cabin_class] || c.cabin_class}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                          {c.points_min.toLocaleString()}
                          {c.points_max && c.points_max !== c.points_min && `-${c.points_max.toLocaleString()}`}
                          <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280' }}>
                            {' '}{c.is_one_way ? 'OW' : 'RT'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 11, color: c.pricing_type === 'dynamic' ? '#d97706' : '#059669',
                          }}>
                            {c.pricing_type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12, maxWidth: 200 }}>
                          {c.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)' }}>
              No charts match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
