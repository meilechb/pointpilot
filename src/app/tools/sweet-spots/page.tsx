'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { sweetSpots, pointValuations } from '@/data/pointsKnowledge'
import { transferPartners } from '@/data/transferPartners'
import { loadWallet } from '@/lib/dataService'

type WalletEntry = {
  id: string
  currency_type: 'bank_points' | 'airline_miles' | 'cashback' | 'cash'
  program: string
  balance: number
}

const BANK_PROGRAMS = ['Chase Ultimate Rewards', 'Amex Membership Rewards', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards']

export default function SweetSpotsPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<WalletEntry[]>([])
  const [filterMode, setFilterMode] = useState<'all' | 'available'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadWallet().then(setWallet).catch(() => {})
  }, [])

  const bankEntries = wallet.filter(w => w.currency_type === 'bank_points')
  const airlineEntries = wallet.filter(w => w.currency_type === 'airline_miles')
  const hasWallet = wallet.length > 0

  const enrichedSpots = useMemo(() => {
    return sweetSpots.map(spot => {
      // Check which programs from this sweet spot the user has
      const matchedPrograms: { program: string; balance: number; type: 'bank' | 'airline' }[] = []

      for (const progName of spot.programs) {
        // Check bank points
        const bankMatch = bankEntries.find(w =>
          w.program.toLowerCase() === progName.toLowerCase()
        )
        if (bankMatch) {
          matchedPrograms.push({ program: bankMatch.program, balance: bankMatch.balance, type: 'bank' })
          continue
        }
        // Check airline miles
        const airlineMatch = airlineEntries.find(w =>
          w.program.toLowerCase() === progName.toLowerCase()
        )
        if (airlineMatch) {
          matchedPrograms.push({ program: airlineMatch.program, balance: airlineMatch.balance, type: 'airline' })
        }
      }

      const isAvailable = matchedPrograms.length > 0
      const totalAvailablePoints = matchedPrograms.reduce((s, m) => s + m.balance, 0)

      return {
        ...spot,
        matchedPrograms,
        isAvailable,
        totalAvailablePoints,
      }
    })
  }, [bankEntries, airlineEntries])

  const filteredSpots = enrichedSpots.filter(spot => {
    if (filterMode === 'available' && !spot.isAvailable) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        spot.title.toLowerCase().includes(q) ||
        spot.routes.toLowerCase().includes(q) ||
        spot.description.toLowerCase().includes(q) ||
        spot.programs.some(p => p.toLowerCase().includes(q))
      )
    }
    return true
  })

  const getValueColor = (value: string): string => {
    if (value.includes('5') || value.includes('6')) return '#059669'
    if (value.includes('3') || value.includes('4')) return '#0369A1'
    return '#D97706'
  }

  const getTransferPath = (spot: typeof enrichedSpots[0]) => {
    // Find which bank programs can fund this sweet spot's airline program
    const airlineProgram = spot.programs.find(p => !BANK_PROGRAMS.includes(p))
    if (!airlineProgram) return null

    const paths: { bank: string; partner: string; ratio: string; walletBalance?: number }[] = []

    for (const bankProg of transferPartners) {
      const partner = bankProg.partners.find(p =>
        p.partner.toLowerCase() === airlineProgram.toLowerCase()
      )
      if (partner) {
        const walletEntry = bankEntries.find(w =>
          w.program.toLowerCase() === bankProg.name.toLowerCase()
        )
        const ratioStr = partner.ratio[0] === partner.ratio[1]
          ? '1:1'
          : `${partner.ratio[0]}:${partner.ratio[1]}`
        paths.push({
          bank: bankProg.name,
          partner: partner.partner,
          ratio: ratioStr,
          walletBalance: walletEntry?.balance,
        })
      }
    }

    return { airlineProgram, paths }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 4 }}>
        <a href="/tools" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Back to Tools
        </a>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Sweet Spot Explorer</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          The best-value award redemptions in travel. {hasWallet ? 'Matched to your wallet balances.' : 'Add points to your wallet to see personalized matches.'}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {hasWallet && (
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {(['all', 'available'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                style={{
                  padding: '6px 14px', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: filterMode === mode ? 600 : 400,
                  backgroundColor: filterMode === mode ? 'var(--primary-light)' : 'var(--bg-card)',
                  color: filterMode === mode ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                {mode === 'all' ? `All (${enrichedSpots.length})` : `My Wallet (${enrichedSpots.filter(s => s.isAvailable).length})`}
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          placeholder="Search routes, airlines, programs..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1, minWidth: 180, padding: '7px 12px', fontSize: 13,
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-card)', color: 'var(--text)',
          }}
        />
      </div>

      {/* Sweet spots list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredSpots.map((spot, i) => {
          const transferInfo = getTransferPath(spot)
          const valuation = pointValuations.find(v =>
            spot.programs.some(p => p.toLowerCase().includes(v.program.toLowerCase().split(' ')[0]))
          )

          return (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius)',
                border: spot.isAvailable ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '18px 20px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{spot.title}</h3>
                  <div style={{
                    padding: '3px 10px', borderRadius: 12,
                    backgroundColor: `${getValueColor(spot.estimatedValue)}12`,
                    color: getValueColor(spot.estimatedValue),
                    fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {spot.estimatedValue}
                  </div>
                </div>

                <div style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                  backgroundColor: 'var(--bg)', fontSize: 12, fontWeight: 500,
                  color: 'var(--text-secondary)', marginBottom: 10,
                }}>
                  {spot.routes}
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {spot.description}
                </p>
              </div>

              {/* Transfer paths */}
              {transferInfo && transferInfo.paths.length > 0 && (
                <div style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Transfer Paths
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {transferInfo.paths.map((path, j) => (
                      <div key={j} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 13, color: 'var(--text-secondary)',
                        flexWrap: 'wrap',
                      }}>
                        <span style={{
                          fontWeight: 600,
                          color: path.walletBalance !== undefined ? 'var(--primary)' : 'var(--text)',
                        }}>
                          {path.bank}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span>{path.partner}</span>
                        <span style={{
                          padding: '1px 6px', borderRadius: 8,
                          backgroundColor: path.ratio === '1:1' ? 'var(--success-bg)' : 'var(--warning-bg)',
                          color: path.ratio === '1:1' ? 'var(--success)' : 'var(--warning)',
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {path.ratio}
                        </span>
                        {path.walletBalance !== undefined && (
                          <span style={{
                            fontSize: 12, color: 'var(--primary)', fontWeight: 500,
                            marginLeft: 'auto',
                          }}>
                            {path.walletBalance.toLocaleString()} pts available
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wallet match indicator */}
              {hasWallet && (
                <div style={{
                  padding: '10px 20px',
                  borderTop: '1px solid var(--border-light)',
                  backgroundColor: spot.isAvailable ? 'var(--primary-light)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {spot.isAvailable ? (
                    <>
                      <span style={{ fontSize: 14 }}>✓</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                        You can access this — {spot.matchedPrograms.map(m => `${m.program} (${m.balance.toLocaleString()})`).join(', ')}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Requires: {spot.programs.filter(p => !BANK_PROGRAMS.includes(p)).join(', ') || spot.programs.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredSpots.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
          {filterMode === 'available'
            ? 'No sweet spots match your current wallet. Try adding more programs to your wallet.'
            : 'No sweet spots match your search.'}
        </div>
      )}

      {/* CTA for wallet */}
      {!hasWallet && (
        <div style={{
          marginTop: 32, padding: 24, textAlign: 'center',
          backgroundColor: 'var(--primary-light)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--primary)',
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
            See which sweet spots you can access
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Add your points balances to your wallet and we'll show which sweet spots match your portfolio.
          </p>
          <a
            href="/wallet"
            style={{
              display: 'inline-block', padding: '10px 24px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'var(--text-inverse)', borderRadius: 'var(--radius-sm)',
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}
          >
            Set Up Wallet
          </a>
        </div>
      )}
    </div>
  )
}
