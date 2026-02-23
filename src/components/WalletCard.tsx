'use client'

import { useState } from 'react'
import { transferPartners, findProgramsForPartner } from '@/data/transferPartners'
import { airlineMilesPrograms } from '@/data/programOptions'
import type { TransferPartner } from '@/data/transferPartners'

type WalletEntry = {
  id: string
  currency_type: 'bank_points' | 'airline_miles' | 'cashback' | 'cash'
  program: string
  balance: number
  redemption_value: number | null
  notes: string
}

type Bonus = {
  id: string
  bank_program: string
  partner: string
  bonus_percent: number
  expires_at: string | null
  notes: string | null
}

type Props = {
  entry: WalletEntry
  bonuses: Bonus[]
  onEdit: (entry: WalletEntry) => void
  onDelete: (id: string) => void
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

const typeColors: Record<string, { bg: string; text: string }> = {
  bank_points: { bg: 'var(--primary-light)', text: 'var(--primary)' },
  airline_miles: { bg: 'var(--accent-light)', text: '#B8860B' },
  cashback: { bg: 'var(--success-bg)', text: 'var(--success)' },
  cash: { bg: '#F0F9FF', text: '#0369A1' },
}

function formatRatio(ratio: [number, number]): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const d = gcd(ratio[0], ratio[1])
  return `${ratio[0] / d}:${ratio[1] / d}`
}

function effectiveRatio(ratio: [number, number], bonusPercent: number): string {
  const base = ratio[1] / ratio[0]
  const effective = base * (1 + bonusPercent / 100)
  return `1:${effective % 1 === 0 ? effective : effective.toFixed(1)}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getAlliance(programName: string): string | null {
  const match = airlineMilesPrograms.find(p => p.value === programName)
  return match?.detail || null
}

export default function WalletCard({ entry, bonuses, onEdit, onDelete }: Props) {
  const [showPopup, setShowPopup] = useState(false)
  const colors = typeColors[entry.currency_type]
  const hasTransferInfo = entry.currency_type === 'bank_points' || entry.currency_type === 'airline_miles'

  const relevantBonuses = bonuses.filter(b => {
    if (entry.currency_type === 'bank_points') return b.bank_program === entry.program
    if (entry.currency_type === 'airline_miles') return b.partner === entry.program
    return false
  })
  const bonusCount = relevantBonuses.length

  return (
    <>
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)',
          border: bonusCount > 0 ? '1px solid #E8C36A' : '1px solid var(--border-light)',
          marginBottom: 8,
          transition: 'box-shadow 0.15s',
          overflow: 'hidden',
        }}
        onMouseOver={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'}
        onMouseOut={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
      >
        {/* Bonus banner */}
        {bonusCount > 0 && (
          <div
            onClick={() => setShowPopup(true)}
            style={{
              padding: '6px 16px', backgroundColor: '#FFF8E1',
              borderBottom: '1px solid #F0E4B8', fontSize: 12, fontWeight: 600,
              color: '#92710C', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            }}
          >
            <span>⭐</span>
            {bonusCount === 1
              ? `+${relevantBonuses[0].bonus_percent}% transfer bonus to ${relevantBonuses[0].partner}!`
              : `${bonusCount} active transfer bonuses!`}
            <span style={{ marginLeft: 'auto', fontSize: 11 }}>View →</span>
          </div>
        )}

        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                backgroundColor: colors.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                {typeIcons[entry.currency_type]}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{entry.program}</div>
                <div style={{ fontSize: 12, color: colors.text, fontWeight: 500 }}>{typeLabels[entry.currency_type]}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>
                {entry.currency_type === 'cash' ? `$${entry.balance.toLocaleString()}` : entry.balance.toLocaleString()}
              </div>
              {entry.currency_type === 'cashback' && entry.redemption_value && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.redemption_value}¢/pt</div>
              )}
            </div>
          </div>

          {entry.notes && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, paddingLeft: 50 }}>{entry.notes}</div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingLeft: 50, alignItems: 'center' }}>
            <button onClick={() => onEdit(entry)} style={smallBtnStyle}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >Edit</button>
            <button onClick={() => onDelete(entry.id)} style={{ ...smallBtnStyle, color: 'var(--text-muted)' }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)' }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >Delete</button>
            {hasTransferInfo && (
              <button onClick={() => setShowPopup(true)} style={{
                padding: '4px 14px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                fontSize: 12, fontWeight: 600, color: 'var(--text-inverse)', marginLeft: 'auto',
              }}>Travel Hacks</button>
            )}
          </div>
        </div>
      </div>

      {showPopup && (
        <TravelHacksPopup entry={entry} bonuses={relevantBonuses} onClose={() => setShowPopup(false)} />
      )}
    </>
  )
}

const smallBtnStyle: React.CSSProperties = {
  padding: '4px 12px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
  backgroundColor: 'var(--bg-card)', fontSize: 12,
  color: 'var(--text-secondary)', fontWeight: 500,
  transition: 'border-color 0.15s, color 0.15s',
}

// ════════════════════════════════════════════════════════════════════════
// Travel Hacks Popup
// ════════════════════════════════════════════════════════════════════════

function TravelHacksPopup({ entry, bonuses, onClose }: {
  entry: WalletEntry; bonuses: Bonus[]; onClose: () => void
}) {
  const bankProgram = entry.currency_type === 'bank_points'
    ? transferPartners.find(p => p.name === entry.program) : null

  const airlineSources = entry.currency_type === 'airline_miles'
    ? findProgramsForPartner(entry.program) : []

  const alliance = entry.currency_type === 'airline_miles'
    ? getAlliance(entry.program) : null

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, animation: 'fadeIn 0.2s ease',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxWidth: 520, width: '92%',
        maxHeight: '85vh', overflowY: 'auto', zIndex: 201, animation: 'slideUp 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)',
          position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', zIndex: 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--primary)', marginBottom: 4 }}>
                Travel Hacks
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{entry.program}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
                {entry.balance.toLocaleString()} {entry.currency_type === 'cash' ? 'dollars' : 'points'}
              </div>
            </div>
            <button onClick={onClose} style={{
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 20, color: 'var(--text-muted)', padding: '0 4px', lineHeight: 1,
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '16px 24px 24px' }}>
          {entry.currency_type === 'bank_points' && bankProgram && (
            <BankPointsPopup partners={bankProgram.partners} bonuses={bonuses} balance={entry.balance} />
          )}
          {entry.currency_type === 'airline_miles' && (
            <AirlineMilesPopup sources={airlineSources} airlineName={entry.program} bonuses={bonuses} alliance={alliance} balance={entry.balance} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -45%) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Bank Points popup
// ════════════════════════════════════════════════════════════════════════

function BankPointsPopup({ partners, bonuses, balance }: {
  partners: TransferPartner[]; bonuses: Bonus[]; balance: number
}) {
  // Sort: bonus partners first
  const sorted = [...partners].sort((a, b) => {
    const aBonus = bonuses.find(bn => bn.partner === a.partner)
    const bBonus = bonuses.find(bn => bn.partner === b.partner)
    if (aBonus && !bBonus) return -1
    if (!aBonus && bBonus) return 1
    return 0
  })

  // Alliance info
  const allianceMap = new Map<string, string[]>()
  for (const p of partners) {
    const alliance = getAlliance(p.partner)
    if (alliance && alliance !== 'Non-alliance') {
      const existing = allianceMap.get(alliance) || []
      if (!existing.includes(p.partner)) { existing.push(p.partner); allianceMap.set(alliance, existing) }
    }
  }

  return (
    <>
      {/* Active bonuses with calculator */}
      {bonuses.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader>Active Bonuses</SectionHeader>
          {bonuses.map(bonus => {
            const partner = partners.find(p => p.partner === bonus.partner)
            if (!partner) return null
            return <BonusCalculator key={bonus.id} bonus={bonus} ratio={partner.ratio} defaultPoints={balance} />
          })}
        </div>
      )}

      {/* All transfer partners */}
      <SectionHeader>Transfer Partners ({partners.length})</SectionHeader>
      {sorted.map(partner => {
        const bonus = bonuses.find(b => b.partner === partner.partner)
        const partnerPoints = Math.floor((balance * partner.ratio[1]) / partner.ratio[0])
        const alliance = getAlliance(partner.partner)
        return (
          <PartnerRow key={partner.partner} name={partner.partner} ratio={partner.ratio}
            detail={alliance || undefined} bonus={bonus} partnerPoints={partnerPoints} />
        )
      })}

      {/* Alliance booking info */}
      {allianceMap.size > 0 && (
        <>
          <SectionHeader style={{ marginTop: 16 }}>Partner Airline Bookings</SectionHeader>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
            Transfer to these programs and book flights on partner airlines:
          </div>
          {Array.from(allianceMap.entries()).map(([alliance, names]) => (
            <div key={alliance} style={{
              padding: '10px 12px', marginBottom: 6, backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{alliance}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                via {names.slice(0, 3).join(', ')}{names.length > 3 ? `, +${names.length - 3} more` : ''}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Airline Miles popup
// ════════════════════════════════════════════════════════════════════════

function AirlineMilesPopup({ sources, airlineName, bonuses, alliance, balance }: {
  sources: { program: { id: string; name: string }; partner: TransferPartner }[]
  airlineName: string; bonuses: Bonus[]; alliance: string | null; balance: number
}) {
  return (
    <>
      {alliance && alliance !== 'Non-alliance' && (
        <div style={{
          padding: '12px 14px', marginBottom: 16, backgroundColor: 'var(--primary-light)',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginBottom: 2 }}>{alliance} Member</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Book flights on any {alliance} partner airline with your {airlineName.split(' ')[0]} miles.
          </div>
        </div>
      )}

      {bonuses.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader>Active Bonuses</SectionHeader>
          {bonuses.map(bonus => {
            const source = sources.find(s => s.program.name === bonus.bank_program)
            if (!source) return null
            return <BonusCalculator key={bonus.id} bonus={bonus} ratio={source.partner.ratio} defaultPoints={0} />
          })}
        </div>
      )}

      {sources.length > 0 ? (
        <>
          <SectionHeader>Transfer from Bank Points ({sources.length})</SectionHeader>
          {sources.map(({ program, partner }) => {
            const bonus = bonuses.find(b => b.bank_program === program.name)
            const partnerPoints = Math.floor((balance * partner.ratio[1]) / partner.ratio[0])
            return <PartnerRow key={program.id} name={program.name} ratio={partner.ratio}
              bonus={bonus} partnerPoints={partnerPoints} icon="💳" />
          })}
        </>
      ) : (
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No bank programs transfer directly to {airlineName}.
          {alliance && alliance !== 'Non-alliance' && (
            <div style={{ marginTop: 6 }}>Tip: Look for other {alliance} airlines that are bank transfer partners.</div>
          )}
        </div>
      )}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Bonus Calculator — expandable points calculator for bonus transfers
// ════════════════════════════════════════════════════════════════════════

function BonusCalculator({ bonus, ratio, defaultPoints }: {
  bonus: Bonus; ratio: [number, number]; defaultPoints: number
}) {
  const [showCalc, setShowCalc] = useState(false)
  const [inputPoints, setInputPoints] = useState(defaultPoints > 0 ? defaultPoints.toString() : '')

  const pts = parseInt(inputPoints) || 0
  const baseTransfer = Math.floor((pts * ratio[1]) / ratio[0])
  const bonusAmount = Math.floor(baseTransfer * bonus.bonus_percent / 100)
  const total = baseTransfer + bonusAmount

  return (
    <div style={{
      padding: '12px 14px', marginBottom: 6, backgroundColor: '#FFF8E1',
      borderRadius: 'var(--radius-sm)', border: '1px solid #F0E4B8',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 14 }}>⭐</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#92710C' }}>
          +{bonus.bonus_percent}% to {bonus.partner}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#92710C',
          backgroundColor: '#FFECB3', padding: '2px 8px', borderRadius: 10, marginLeft: 'auto',
        }}>
          {effectiveRatio(ratio, bonus.bonus_percent)}
        </span>
      </div>

      {bonus.expires_at && (
        <div style={{ fontSize: 11, color: '#B8960F', marginBottom: 6 }}>
          Expires {formatDate(bonus.expires_at)}
          {bonus.notes && ` · ${bonus.notes}`}
        </div>
      )}

      {/* Calculator toggle */}
      <button onClick={() => setShowCalc(!showCalc)} style={{
        border: 'none', background: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 600, color: '#92710C', padding: 0,
      }}>
        {showCalc ? 'Hide calculator ▴' : 'Calculate transfer ▾'}
      </button>

      {showCalc && (
        <div style={{ marginTop: 10, padding: '12px', backgroundColor: '#FFF3CD', borderRadius: 'var(--radius-sm)' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6D5A0A', display: 'block', marginBottom: 4 }}>
            Points to transfer
          </label>
          <input
            type="number"
            value={inputPoints}
            onChange={(e) => setInputPoints(e.target.value)}
            placeholder="e.g. 50000"
            style={{
              width: '100%', padding: '8px 10px', fontSize: 14,
              border: '1.5px solid #E8C36A', borderRadius: 'var(--radius-sm)',
              backgroundColor: '#FFFDF5', outline: 'none', marginBottom: 10,
            }}
          />

          {pts > 0 && (
            <div style={{ fontSize: 13, color: '#6D5A0A', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base transfer ({formatRatio(ratio)})</span>
                <span style={{ fontWeight: 600 }}>{baseTransfer.toLocaleString()} miles</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92710C' }}>
                <span>+{bonus.bonus_percent}% bonus</span>
                <span style={{ fontWeight: 600 }}>+{bonusAmount.toLocaleString()} miles</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderTop: '1px solid #E8C36A', paddingTop: 6, marginTop: 6,
                fontSize: 15, fontWeight: 700,
              }}>
                <span>Total</span>
                <span>{total.toLocaleString()} miles</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Shared components
// ════════════════════════════════════════════════════════════════════════

function SectionHeader({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      color: 'var(--text-muted)', marginBottom: 8, ...style,
    }}>{children}</div>
  )
}

function PartnerRow({ name, ratio, detail, bonus, partnerPoints, icon = '✈' }: {
  name: string; ratio: [number, number]; detail?: string; bonus?: Bonus
  partnerPoints: number; icon?: string
}) {
  const isOneToOne = ratio[0] === ratio[1]
  const hasBonus = !!bonus
  const bonusPoints = bonus ? Math.floor(partnerPoints * bonus.bonus_percent / 100) : 0

  return (
    <div style={{
      marginBottom: 4, borderRadius: 'var(--radius-sm)',
      border: hasBonus ? '1px solid #F0E4B8' : '1px solid var(--border-light)',
      backgroundColor: hasBonus ? '#FFFDF5' : 'var(--bg)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px' }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          {detail && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{detail}</div>}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: isOneToOne ? 'var(--success)' : '#B8860B',
          backgroundColor: isOneToOne ? 'var(--success-bg)' : 'var(--accent-light)',
          padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
        }}>{formatRatio(ratio)}</span>
        {hasBonus && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#92710C',
            backgroundColor: '#FFECB3', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
          }}>{effectiveRatio(ratio, bonus!.bonus_percent)}</span>
        )}
      </div>

      {partnerPoints > 0 && (
        <div style={{ padding: '0 12px 8px', paddingLeft: 33, fontSize: 11, color: 'var(--text-muted)' }}>
          {hasBonus ? (
            <span>→ <strong style={{ color: '#92710C' }}>{(partnerPoints + bonusPoints).toLocaleString()}</strong> miles
              <span style={{ color: '#B8960F' }}> (incl. +{bonus!.bonus_percent}% bonus)</span></span>
          ) : (
            <span>→ {partnerPoints.toLocaleString()} miles</span>
          )}
        </div>
      )}
    </div>
  )
}
