'use client'

import { useState, useMemo } from 'react'
import {
  creditCards, categoryLabels, categoryIcons,
  getEarningRate, type SpendingCategory, type CreditCard,
} from '@/data/cardEarningRates'
import { pointValuations } from '@/data/pointsKnowledge'

const ALL_CATEGORIES: SpendingCategory[] = [
  'dining', 'groceries', 'travel', 'gas', 'streaming',
  'online_shopping', 'drugstores', 'transit', 'rent', 'general',
]

const PROGRAM_COLORS: Record<string, string> = {
  'Chase Ultimate Rewards': '#003087',
  'Amex Membership Rewards': '#006FCF',
  'Citi ThankYou Points': '#1A3D8F',
  'Capital One Miles': '#D03027',
  'Bilt Rewards': '#1A1A1A',
}

export default function EarningCalculatorPage() {
  const [mode, setMode] = useState<'category' | 'optimizer'>('category')
  const [selectedCategory, setSelectedCategory] = useState<SpendingCategory>('dining')
  const [spendAmounts, setSpendAmounts] = useState<Partial<Record<SpendingCategory, string>>>({})
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Category mode: ranked cards
  const rankedCards = useMemo(() => {
    return creditCards
      .map(card => ({
        ...card,
        rate: getEarningRate(card, selectedCategory),
      }))
      .sort((a, b) => b.rate - a.rate)
  }, [selectedCategory])

  // Optimizer mode: compute points earned
  const optimizerResults = useMemo(() => {
    const categories = ALL_CATEGORIES.filter(cat => {
      const amt = parseFloat(spendAmounts[cat] || '0')
      return amt > 0
    })

    if (categories.length === 0) return null

    // For each category, find the best card
    const bestPerCategory = categories.map(cat => {
      const amount = parseFloat(spendAmounts[cat] || '0')
      const ranked = creditCards
        .map(card => ({ card, rate: getEarningRate(card, cat) }))
        .sort((a, b) => b.rate - a.rate)
      const best = ranked[0]
      return {
        category: cat,
        amount,
        bestCard: best.card,
        bestRate: best.rate,
        pointsEarned: Math.round(amount * best.rate),
        runner_up: ranked[1] ? { card: ranked[1].card, rate: ranked[1].rate } : null,
      }
    })

    const totalSpend = bestPerCategory.reduce((s, r) => s + r.amount, 0)
    const totalPoints = bestPerCategory.reduce((s, r) => s + r.pointsEarned, 0)

    // Group by rewards program
    const byProgram: Record<string, { points: number; cards: string[] }> = {}
    for (const r of bestPerCategory) {
      const prog = r.bestCard.rewardsProgram
      if (!byProgram[prog]) byProgram[prog] = { points: 0, cards: [] }
      byProgram[prog].points += r.pointsEarned
      if (!byProgram[prog].cards.includes(r.bestCard.name)) {
        byProgram[prog].cards.push(r.bestCard.name)
      }
    }

    // Total estimated dollar value
    let totalValue = 0
    for (const [prog, data] of Object.entries(byProgram)) {
      const valuation = pointValuations.find(v =>
        v.program.toLowerCase() === prog.toLowerCase() ||
        prog.toLowerCase().includes(v.program.toLowerCase().split(' ')[0])
      )
      if (valuation) {
        totalValue += data.points * valuation.centsPerPoint / 100
      }
    }

    return { bestPerCategory, totalSpend, totalPoints, byProgram, totalValue }
  }, [spendAmounts])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 4 }}>
        <a href="/tools" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Back to Tools
        </a>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Earning Calculator</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Find which credit card earns the most points for every spending category.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 24,
      }}>
        {([
          { key: 'category' as const, label: 'By Category' },
          { key: 'optimizer' as const, label: 'Spending Optimizer' },
        ]).map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: mode === m.key ? 600 : 400,
              backgroundColor: mode === m.key ? 'var(--primary-light)' : 'var(--bg-card)',
              color: mode === m.key ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ─── Category Mode ─── */}
      {mode === 'category' && (
        <>
          {/* Category selector */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 12px', borderRadius: 20,
                  border: selectedCategory === cat ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: selectedCategory === cat ? 'var(--primary-light)' : 'var(--bg-card)',
                  color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: selectedCategory === cat ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {categoryIcons[cat]} {categoryLabels[cat].split('(')[0].trim()}
              </button>
            ))}
          </div>

          {/* Ranked cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rankedCards.map((card, i) => {
              const isExpanded = expandedCard === card.name
              const isTop = i === 0
              const progColor = PROGRAM_COLORS[card.rewardsProgram] || 'var(--primary)'

              return (
                <div
                  key={card.name}
                  onClick={() => setExpandedCard(isExpanded ? null : card.name)}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius)',
                    border: isTop ? `1.5px solid ${progColor}` : '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isTop && (
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%',
                            backgroundColor: progColor, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}>
                            1
                          </span>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{card.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {card.rewardsProgram} · ${card.annualFee}/yr
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 18, fontWeight: 700,
                        color: card.rate >= 3 ? 'var(--success)' : card.rate >= 2 ? 'var(--primary)' : 'var(--text-secondary)',
                      }}>
                        {card.rate}x
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{
                      padding: '12px 18px', borderTop: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg)',
                    }}>
                      {/* All earning rates */}
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Earning Rates
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {ALL_CATEGORIES.map(cat => {
                          const rate = getEarningRate(card, cat)
                          const isBonusCategory = card.earningRates[cat] !== undefined
                          return (
                            <div key={cat} style={{
                              padding: '3px 8px', borderRadius: 6,
                              backgroundColor: isBonusCategory ? 'var(--success-bg)' : 'var(--bg-card)',
                              border: '1px solid var(--border-light)',
                              fontSize: 11, color: isBonusCategory ? 'var(--success)' : 'var(--text-muted)',
                              fontWeight: isBonusCategory ? 600 : 400,
                            }}>
                              {categoryIcons[cat]} {rate}x
                            </div>
                          )
                        })}
                      </div>

                      {/* Perks */}
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Key Perks
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {card.perks.map((perk, j) => (
                          <li key={j} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>{perk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ─── Optimizer Mode ─── */}
      {mode === 'optimizer' && (
        <>
          {/* Spending inputs */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow)',
            padding: 20, marginBottom: 24,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Monthly Spending</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Enter how much you spend per month in each category.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {ALL_CATEGORIES.map(cat => (
                <div key={cat}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                    {categoryIcons[cat]} {categoryLabels[cat].split('(')[0].trim()}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={spendAmounts[cat] || ''}
                      onChange={e => setSpendAmounts(prev => ({ ...prev, [cat]: e.target.value }))}
                      style={{
                        width: '100%', padding: '8px 10px 8px 22px', fontSize: 13,
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-input)', color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimizer results */}
          {optimizerResults && (
            <>
              {/* Summary cards */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{
                  flex: 1, minWidth: 140, padding: '14px 16px',
                  backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 3 }}>Monthly Spend</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>${optimizerResults.totalSpend.toLocaleString()}</div>
                </div>
                <div style={{
                  flex: 1, minWidth: 140, padding: '14px 16px',
                  backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 3 }}>Points Earned / Month</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{optimizerResults.totalPoints.toLocaleString()}</div>
                </div>
                <div style={{
                  flex: 1, minWidth: 140, padding: '14px 16px',
                  backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 3 }}>Annual Points</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{(optimizerResults.totalPoints * 12).toLocaleString()}</div>
                </div>
                {optimizerResults.totalValue > 0 && (
                  <div style={{
                    flex: 1, minWidth: 140, padding: '14px 16px',
                    backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 3 }}>Est. Annual Value</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#B8860B' }}>~${Math.round(optimizerResults.totalValue * 12).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {/* Points by program */}
              <div style={{
                backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
                border: '1px solid var(--border-light)', padding: 18, marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Points By Program (Monthly)</div>
                {Object.entries(optimizerResults.byProgram)
                  .sort((a, b) => b[1].points - a[1].points)
                  .map(([prog, data]) => {
                    const pct = optimizerResults.totalPoints > 0
                      ? (data.points / optimizerResults.totalPoints * 100)
                      : 0
                    const color = PROGRAM_COLORS[prog] || 'var(--primary)'
                    return (
                      <div key={prog} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>{prog}</span>
                          <span style={{ fontWeight: 700, color }}>{data.points.toLocaleString()} pts</span>
                        </div>
                        <div style={{
                          height: 6, borderRadius: 3, backgroundColor: 'var(--border-light)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            backgroundColor: color,
                            width: `${pct}%`,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          via {data.cards.join(', ')}
                        </div>
                      </div>
                    )
                  })}
              </div>

              {/* Category breakdown */}
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Optimal Card Per Category</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {optimizerResults.bestPerCategory.map(r => (
                  <div
                    key={r.category}
                    style={{
                      backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
                      border: '1px solid var(--border-light)', padding: '14px 18px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
                          {categoryIcons[r.category]} {categoryLabels[r.category]} · ${r.amount.toLocaleString()}/mo
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {r.bestCard.name}
                          <span style={{
                            marginLeft: 8, padding: '2px 6px', borderRadius: 6,
                            backgroundColor: 'var(--success-bg)', color: 'var(--success)',
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {r.bestRate}x
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                          {r.pointsEarned.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>pts/month</div>
                      </div>
                    </div>
                    {r.runner_up && r.runner_up.rate < r.bestRate && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        Runner-up: {r.runner_up.card.name} ({r.runner_up.rate}x) — you'd earn {Math.round(r.amount * r.runner_up.rate).toLocaleString()} pts
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {!optimizerResults && (
            <div style={{
              textAlign: 'center', padding: 40,
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
              color: 'var(--text-muted)', fontSize: 14,
            }}>
              Enter your monthly spending above to see which cards earn the most points.
            </div>
          )}
        </>
      )}
    </div>
  )
}
