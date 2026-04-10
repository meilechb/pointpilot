import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// GET /api/share/[token] — public, no auth required
// Fetches full trip data for a shared trip token
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const sb = getServiceClient()

  // Look up the share token
  const { data: share, error: shareErr } = await sb
    .from('shared_trips')
    .select('trip_id, user_id')
    .eq('token', token)
    .single()

  if (shareErr || !share) {
    return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 })
  }

  const { trip_id: tripId } = share

  // Fetch all trip data using service role (bypasses RLS)
  const [
    { data: tripRow, error: tripErr },
    { data: legRows },
    { data: flightRows },
    { data: itinRows },
  ] = await Promise.all([
    sb.from('trips').select('*').eq('id', tripId).single(),
    sb.from('legs').select('*').eq('trip_id', tripId),
    sb.from('flights').select('*').eq('trip_id', tripId),
    sb.from('itineraries').select('*').eq('trip_id', tripId),
  ])

  if (tripErr || !tripRow) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // Assemble legs
  const legs = [...(legRows || [])]
    .sort((a, b) => a.leg_order - b.leg_order)
    .map(l => ({ from: l.from_city, to: l.to_city }))

  // Assemble flights
  const flights = (flightRows || []).map((f: any) => {
    const seg = f.segments || {}
    const isWrapped = !Array.isArray(seg)
    return {
      id: f.id,
      legIndex: f.leg_index,
      segments: isWrapped ? (seg.segments || []) : seg,
      pricingTiers: isWrapped ? (seg.pricingTiers || []) : [],
      defaultTierLabel: isWrapped ? (seg.defaultTierLabel || '') : '',
      bookingSite: f.booking_site,
      paymentType: f.payment_type,
      cashAmount: f.cash_amount,
      pointsAmount: f.points_amount,
      feesAmount: f.fees_amount,
    }
  })

  // Assemble itineraries
  const itineraries = (itinRows || []).map((it: any) => ({
    id: it.id,
    name: it.name,
    createdAt: it.created_at,
    assignments: it.assignments || {},
    totals: it.totals || {},
    travelers: it.travelers,
  }))

  const departureCity = legs[0]?.from || ''
  const destinationCity = legs[legs.length - 1]?.to || ''
  const stops =
    tripRow.trip_type === 'multicity' && legs.length > 2
      ? legs.slice(1, -1).map((l: any) => l.from)
      : []

  const trip = {
    id: tripRow.id,
    tripName: tripRow.name,
    tripType: tripRow.trip_type,
    departureCity,
    destinationCity,
    stops,
    legs,
    departureDate: tripRow.departure_date || '',
    returnDate: tripRow.return_date || '',
    travelers: tripRow.travelers,
    dateFlexibility: tripRow.date_flexibility || 'exact',
    notes: tripRow.notes,
    status: tripRow.status,
    createdAt: tripRow.created_at,
    flights,
    itineraries,
  }

  return NextResponse.json({ trip })
}
