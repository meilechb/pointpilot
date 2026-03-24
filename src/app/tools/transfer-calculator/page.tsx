'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { transferPartners } from '@/data/transferPartners'
import { pointValuations } from '@/data/pointsKnowledge'
import { transferPartnerPrograms } from '@/data/programOptions'
import { loadWallet } from '@/lib/dataService'
import { createClient } from '@/lib/supabase'
import ProgramSelect from '@/components/ProgramSelect'

type WalletEntry = {
  id: string
  currency_type: 'bank_points' | 'airline_miles' | 'cashback' | 'cash'
  program: string
  balance: number
}

type Bonus = {
  id: string
  bank_program: string
  partner: string
  bonus_percent: number
  expires_at: string | null
  notes: string | null
}

type TransferPath = {
  bankName: string
  bankId: string
  partnerName: string
  ratio: [number, number]
  bankPointsNeeded: number
  milesReceived: number
  walletBalance: number | null
  hasEnough: boolean
  bonus: Bonus | null
  effectiveMiles: number
  cppValue: number | null
}

export default function TransferCalculatorPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<WalletEntry[]>([])
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [targetProgram, setTargetProgram] = useState('')
  const [milesNeeded, setMilesNeeded] = useState('')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)

  useEffect(() => {
    loadWallet().then(setWallet).catch(() => {})
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

  const bankEntries = wallet.filter(w => w.currency_type === 'bank_points')

  const paths = useMemo((): TransferPath[] => {
    if (!targetProgram) return []
    const needed = parseInt(milesNeeded) || 0

    const results: TransferPath[] = []

    for (const bank of transferPartners) {
      const partner = bank.partners.find(p =>
        p.partner.toLowerCase() === targetProgram.toLowerCase()
      )
      if (!partner) continue

      // Calculate bank points needed for the miles
      const bankPointsNeeded = needed > 0
        ? Math.ceil(needed * partner.ratio[0] / partner.ratio[1])
        : 0

      // Check for active transfer bonus
      const bonus = bonuses.find(b =>
        b.bank_program.toLowerCase() === bank.name.toLowerCase() &&
        b.partner.toLowerCase() === partner.partner.toLowerCase()
      ) || null

      // Miles received with bonus
      const baseMiles = needed > 0
        ? Math.floor(bankPointsNeeded * partner.ratio[1] / partner.ratio[0])
        : 0
      const effectiveMiles = bonus
        ? Math.floor(baseMiles * (1 + bonus.bonus_percent / 100))
        : baseMiles

      // Wallet check
      const walletEntry = bankEntries.find(w =>
        w.program.toLowerCase() === bank.name.toLowerCase()
      )
      const walletBalance = walletEntry?.balance ?? null

      // CPP valuation
      const valuation = pointValuations.find(v =>
        v.program.toLowerCase() === targetProgram.toLowerCase() ||
        targetProgram.toLowerCase().includes(v.program.toLowerCase().split(' ')[0])
      )
      const cppValue = valuation?.centsPerPoint ?? null

      results.push({
        bankName: bank.name,
        bankId: bank.id,
        partnerName: partner.partner,
        ratio: partner.ratio,
        bankPointsNeeded,
        milesReceived: baseMiles,
        walletBalance,
        hasEnough: walletBalance !== null && walletBalance >= bankPointsNeeded,
        bonus,
        effectiveMiles,
        cppValue,
      })
    }

    // Sort: paths with enough points first, then by bank points needed (ascending)
    return results.sort((a, b) => {
      if (a.hasEnough !== b.hasEnough) return a.hasEnough ? -1 : 1
      if (a.walletBalance !== null && b.walletBalance === null) return -1
      if (a.walletBalance === null && b.walletBalance !== null) return 1
      if (a.bonus && !b.bonus) return -1
      if (!a.bonus && b.bonus) return 1
      return a.bankPointsNeeded - b.bankPointsNeeded
    })
  }, [targetProgram, milesNeeded, bankEntries, bonuses])

  const displayPaths = showOnlyAvailable ? paths.filter(p => p.walletBalance !== null) : paths
  const needed = parseInt(milesNeeded) || 0

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 4 }}>
        <a href="/tools" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Back to Tools
        </a>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Transfer Calculator</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Find the best way to transfer bank points to any airline program.
        </p>
      </div>

      {/* Inputs */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow)',
        padding: 20, marginBottom: 24,
      }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
            Target Airline Program
          </label>
          <ProgramSelect
            value={targetProgram}
            onChange={setTargetProgram}
            options={transferPartnerPrograms}
            placeholder="e.g. United MileagePlus"
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
            Miles Needed
          </label>
          <input
            type="number"
            placeholder="e.g. 80000"
            value={milesNeeded}
            onChange={e => setMilesNeeded(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', fontSize: 14,
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-input)', color: 'var(--text)',
            }}
          />
        </div>
      </div>

      {/* Results */}
      {targetProgram && (
        <>
          {/* Target program info */}
          {(() => {
            const valuation = pointValuations.find(v =>
              v.program.toLowerCase() === targetProgram.toLowerCase() ||
              targetProgram.toLowerCase().includes(v.program.toLowerCase().split(' ')[0])
            )
            if (!valuation) return null
            return (
              <div style={{
                padding: '12px 16px', marginBottom: 16,
                backgroundColor: 'var(--bg-accent)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--text)' }}>{valuation.program}</strong>: Valued at ~{valuation.centsPerPoint} cents per point.
                {needed > 0 && (
                  <> Worth approximately <strong style={{ color: 'var(--success)' }}>${(needed * valuation.centsPerPoint / 100).toLocaleString()}</strong> in travel value.</>
                )}
                <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>{valuation.notes}</div>
              </div>
            )
          })()}

          {/* Filter toggle */}
          {bankEntries.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showOnlyAvailable}
                  onChange={e => setShowOnlyAvailable(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Only show programs in my wallet
              </label>
            </div>
          )}

          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
            {displayPaths.length} transfer path{displayPaths.length !== 1 ? 's' : ''} available
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayPaths.map((path, i) => {
              const ratioStr = path.ratio[0] === path.ratio[1]
                ? '1:1'
                : `${path.ratio[0]}:${path.ratio[1]}`
              const isGoodRatio = path.ratio[1] >= path.ratio[0]

              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius)',
                    border: path.hasEnough
                      ? '1.5px solid var(--success)'
                      : path.walletBalance !== null
                        ? '1.5px solid var(--warning)'
                        : '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '16px 18px',
                  }}
                >
                  {/* Bank name + ratio */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{path.bankName}</div>
                    <div style={{
                      padding: '2px 8px', borderRadius: 8,
                      backgroundColor: isGoodRatio ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: isGoodRatio ? 'var(--success)' : 'var(--warning)',
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {ratioStr}
                    </div>
                  </div>

                  {/* Transfer details */}
                  {needed > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Transfer <strong style={{ color: 'var(--text)' }}>{path.bankPointsNeeded.toLocaleString()}</strong> {path.bankName.split(' ')[0]} points
                      {' '}→ receive <strong style={{ color: 'var(--text)' }}>{path.milesReceived.toLocaleString()}</strong> {path.partnerName.split(' ')[0]} miles
                    </div>
                  )}

                  {/* Bonus badge */}
                  {path.bonus && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 8,
                      backgroundColor: '#FEF3C7', color: '#92400E',
                      fontSize: 12, fontWeight: 600, marginBottom: 6,
                    }}>
                      🔥 +{path.bonus.bonus_percent}% transfer bonus active
                      {path.bonus.expires_at && (
                        <span style={{ fontWeight: 400 }}>
                          (expires {new Date(path.bonus.expires_at).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  )}

                  {path.bonus && needed > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500, marginBottom: 6 }}>
                      With bonus: receive {path.effectiveMiles.toLocaleString()} miles instead of {path.milesReceived.toLocaleString()}
                    </div>
                  )}

                  {/* Wallet status */}
                  {path.walletBalance !== null && needed > 0 && (
                    <div style={{
                      fontSize: 12, fontWeight: 500, marginTop: 4,
                      color: path.hasEnough ? 'var(--success)' : 'var(--warning)',
                    }}>
                      {path.hasEnough
                        ? `✓ You have ${path.walletBalance.toLocaleString()} pts — enough to cover this (${(path.walletBalance - path.bankPointsNeeded).toLocaleString()} remaining)`
                        : `⚠ You have ${path.walletBalance.toLocaleString()} pts — need ${(path.bankPointsNeeded - path.walletBalance).toLocaleString()} more`
                      }
                    </div>
                  )}
                  {path.walletBalance !== null && needed === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500, marginTop: 4 }}>
                      You have {path.walletBalance.toLocaleString()} {path.bankName.split(' ')[0]} points
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {displayPaths.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
              {showOnlyAvailable
                ? 'No matching programs in your wallet. Uncheck the filter to see all paths.'
                : 'No bank programs transfer to this airline program.'}
            </div>
          )}
        </>
      )}

      {!targetProgram && (
        <div style={{
          textAlign: 'center', padding: 40,
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
          color: 'var(--text-muted)', fontSize: 14,
        }}>
          Select a target airline program above to see all transfer paths.
        </div>
      )}
    </div>
  )
}
