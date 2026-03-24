import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateRecommendations } from '@/utils/recommendationEngine'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user } } = await sb.auth.getUser(token)
  return user
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { origin, destination, cabinClass, travelers, wallet, transferBonuses } = body

    if (!origin || !destination || !cabinClass) {
      return NextResponse.json({ error: 'origin, destination, and cabinClass are required' }, { status: 400 })
    }

    const sb = getServiceClient()

    // Fetch all reference data in parallel
    const [awardChartsRes, routeRegionsRes, surchargeProfilesRes, programRulesRes] = await Promise.all([
      sb.from('award_charts').select('*'),
      sb.from('route_regions').select('*'),
      sb.from('surcharge_profiles').select('*'),
      sb.from('program_rules').select('*'),
    ])

    const recommendations = generateRecommendations({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      cabinClass,
      travelers: travelers || 1,
      wallet: wallet || [],
      transferBonuses: transferBonuses || [],
      awardCharts: awardChartsRes.data || [],
      routeRegions: routeRegionsRes.data || [],
      surchargeProfiles: surchargeProfilesRes.data || [],
      programRules: programRulesRes.data || [],
    })

    return NextResponse.json({ recommendations })
  } catch (err: any) {
    console.error('Route advisor error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
