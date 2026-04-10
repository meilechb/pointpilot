import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAnonClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await getAnonClient(token).auth.getUser()
  return user
}

// POST /api/trips/[id]/share — create (or return existing) share token for a trip
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  // Verify the trip belongs to this user
  const { data: trip, error: tripErr } = await sb
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single()

  if (tripErr || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // Check if a share token already exists for this trip
  const { data: existing } = await sb
    .from('shared_trips')
    .select('token')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single()

  if (existing?.token) {
    return NextResponse.json({ token: existing.token })
  }

  // Create a new share token
  const { data: created, error: insertErr } = await sb
    .from('shared_trips')
    .insert({ trip_id: tripId, user_id: user.id })
    .select('token')
    .single()

  if (insertErr || !created) {
    return NextResponse.json({ error: 'Failed to create share token' }, { status: 500 })
  }

  return NextResponse.json({ token: created.token })
}

// DELETE /api/trips/[id]/share — revoke the share token for a trip
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  await sb
    .from('shared_trips')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
