import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(req: NextRequest) {
  try {
    const sb = getServiceClient()
    const { searchParams } = req.nextUrl

    let query = sb.from('award_charts').select('*')

    const program = searchParams.get('program')
    if (program) query = query.ilike('program_name', `%${program}%`)

    const originRegion = searchParams.get('origin_region')
    if (originRegion) query = query.ilike('origin_region', `%${originRegion}%`)

    const destRegion = searchParams.get('destination_region')
    if (destRegion) query = query.ilike('destination_region', `%${destRegion}%`)

    const cabinClass = searchParams.get('cabin_class')
    if (cabinClass) query = query.eq('cabin_class', cabinClass)

    query = query.order('program_name').order('cabin_class')

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ awardCharts: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
