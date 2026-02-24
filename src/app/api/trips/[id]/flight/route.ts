import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/trips/[id]/flight — add a flight to a trip (for Chrome extension)
// Auth: Authorization: Bearer <supabase_access_token>
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: tripId } = await params

  // Verify trip belongs to user
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single()

  if (tripError || !trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const body = await request.json()
  const {
    legIndex,
    segments,
    bookingSite,
    paymentType,
    cashAmount,
    pointsAmount,
    feesAmount,
    defaultTierLabel,
    pricingTiers,
  } = body

  const flightId = crypto.randomUUID()

  const { error } = await supabase.from('flights').insert({
    id: flightId,
    user_id: user.id,
    trip_id: tripId,
    leg_index: legIndex ?? null,
    segments: {
      segments: segments || [],
      pricingTiers: pricingTiers || [],
      defaultTierLabel: defaultTierLabel || '',
    },
    booking_site: bookingSite || null,
    payment_type: paymentType || 'cash',
    cash_amount: cashAmount ?? null,
    points_amount: pointsAmount ?? null,
    fees_amount: feesAmount ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, flightId }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}
