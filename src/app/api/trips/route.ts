import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/trips — returns user's trips (for Chrome extension)
// Auth: Authorization: Bearer <supabase_access_token>
export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tripRows, error } = await supabase
    .from('trips')
    .select('id, name, trip_type, departure_date, return_date, travelers')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const tripIds = (tripRows || []).map((t: any) => t.id)
  let legRows: any[] = []
  if (tripIds.length > 0) {
    const { data } = await supabase.from('legs').select('*').in('trip_id', tripIds)
    legRows = data || []
  }

  const trips = (tripRows || []).map((t: any) => {
    const legs = legRows
      .filter((l: any) => l.trip_id === t.id)
      .sort((a: any, b: any) => a.leg_order - b.leg_order)
      .map((l: any) => ({ from: l.from_city, to: l.to_city }))
    return {
      id: t.id,
      name: t.name,
      tripType: t.trip_type,
      departureDate: t.departure_date,
      returnDate: t.return_date,
      travelers: t.travelers,
      legs,
    }
  })

  return NextResponse.json(trips, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}
