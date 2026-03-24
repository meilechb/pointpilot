import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { transferPartners } from '@/data/transferPartners'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function programNamesMatch(a: string, b: string): boolean {
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return true
  if (la.includes(lb) || lb.includes(la)) return true
  return false
}

export async function GET(req: NextRequest) {
  try {
    const sb = getServiceClient()

    const { data: sweetSpots, error } = await sb
      .from('sweet_spots_db')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If wallet is provided via query param (JSON encoded), personalize results
    const walletParam = req.nextUrl.searchParams.get('wallet')
    if (walletParam) {
      try {
        const wallet = JSON.parse(walletParam)
        const personalized = (sweetSpots || []).map((spot: any) => {
          // Check if user can reach any of the programs listed in the sweet spot
          const reachable: string[] = []
          for (const program of spot.programs || []) {
            // Direct airline miles
            const hasDirectMiles = wallet.some((w: any) =>
              w.currency_type === 'airline_miles' && programNamesMatch(w.program, program)
            )
            if (hasDirectMiles) {
              reachable.push(program + ' (direct)')
              continue
            }
            // Transfer from bank
            for (const bankProg of transferPartners) {
              const hasBank = wallet.some((w: any) =>
                w.currency_type === 'bank_points' && programNamesMatch(w.program, bankProg.name)
              )
              if (!hasBank) continue
              const canTransfer = bankProg.partners.some(p => programNamesMatch(p.partner, program))
              if (canTransfer) {
                reachable.push(`${program} (via ${bankProg.name})`)
                break
              }
            }
          }
          return { ...spot, reachableVia: reachable, isReachable: reachable.length > 0 }
        })

        // Sort: reachable first, then by priority
        personalized.sort((a: any, b: any) => {
          if (a.isReachable && !b.isReachable) return -1
          if (!a.isReachable && b.isReachable) return 1
          return (b.priority || 0) - (a.priority || 0)
        })

        return NextResponse.json({ sweetSpots: personalized })
      } catch {
        // Invalid wallet JSON, just return unfiltered
      }
    }

    return NextResponse.json({ sweetSpots: sweetSpots || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
