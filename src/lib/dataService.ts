import { createClient } from '@/lib/supabase'

function getSupabase() {
  return createClient()
}

async function getUser() {
  const { data: { user } } = await getSupabase().auth.getUser()
  return user
}

// localStorage keys scoped per user to prevent cross-account data leaks
function tripsKey(userId?: string) { return userId ? `trips_${userId}` : 'trips_anon' }
function walletKey(userId?: string) { return userId ? `wallet_${userId}` : 'wallet_anon' }

// --------------- TRIPS ---------------
// App in-memory shape:
//   { id, tripName, tripType, departureCity, destinationCity, stops, legs[], departureDate, returnDate, travelers, dateFlexibility, flights[], itineraries[] }
// legs[]: { from, to }
// flights[]: { id, legIndex, segments[], paymentType, cashAmount, pointsAmount, feesAmount, tiers[], bookingUrl? }
// itineraries[]: { id, name, createdAt, assignments, totals: {cash, points, fees}, travelers }

function tripToRow(trip: any, userId: string) {
  return {
    id: trip.id,
    user_id: userId,
    name: trip.tripName || '',
    trip_type: trip.tripType || 'roundtrip',
    departure_date: trip.departureDate || null,
    return_date: trip.returnDate || null,
    travelers: trip.travelers || 1,
    notes: trip.notes || null,
    status: trip.status || 'planning',
    date_flexibility: trip.dateFlexibility || 'exact',
  }
}

function legsToRows(trip: any, userId: string) {
  return (trip.legs || []).map((leg: any, i: number) => ({
    id: `${trip.id}_leg_${i}`,
    trip_id: trip.id,
    user_id: userId,
    leg_order: i,
    from_city: leg.from || '',
    to_city: leg.to || '',
  }))
}

function flightsToRows(trip: any, userId: string) {
  return (trip.flights || []).map((f: any) => ({
    id: f.id,
    user_id: userId,
    trip_id: trip.id,
    leg_index: f.legIndex ?? null,
    // segments column stores segments array + any extra fields (tiers, defaultTierLabel)
    segments: {
      segments: f.segments || [],
      pricingTiers: f.pricingTiers || [],
      defaultTierLabel: f.defaultTierLabel || '',
    },
    booking_site: f.bookingSite || null,
    payment_type: f.paymentType || 'cash',
    cash_amount: f.cashAmount ?? null,
    points_amount: f.pointsAmount ?? null,
    fees_amount: f.feesAmount ?? null,
  }))
}

function itinerariesToRows(trip: any, userId: string) {
  return (trip.itineraries || []).map((it: any) => ({
    id: it.id,
    user_id: userId,
    trip_id: trip.id,
    name: it.name || '',
    assignments: it.assignments || {},
    totals: it.totals || {},
    travelers: it.travelers || trip.travelers || 1,
  }))
}

function assembleTrip(tripRow: any, legRows: any[], flightRows: any[], itinRows: any[]): any {
  const legs = [...legRows]
    .sort((a, b) => a.leg_order - b.leg_order)
    .map(l => ({ from: l.from_city, to: l.to_city }))

  const flights = flightRows.map(f => {
    // segments column may be array (old format) or wrapper object (new format)
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

  const itineraries = itinRows.map(it => ({
    id: it.id,
    name: it.name,
    createdAt: it.created_at,
    assignments: it.assignments || {},
    totals: it.totals || {},
    travelers: it.travelers,
  }))

  // Reconstruct departureCity / destinationCity / stops from legs
  const departureCity = legs[0]?.from || ''
  const destinationCity = legs[legs.length - 1]?.to || ''
  const stops = tripRow.trip_type === 'multicity' && legs.length > 2
    ? legs.slice(1, -1).map((l: any) => l.from)
    : []

  return {
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
}

export async function loadTripById(tripId: string): Promise<any | null> {
  const user = await getUser()
  if (user) {
    const sb = getSupabase()
    const { data: tripRows, error } = await sb
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', tripId)
      .limit(1)

    if (error || !tripRows || tripRows.length === 0) {
      return null
    }

    const [{ data: legRows }, { data: flightRows }, { data: itinRows }] = await Promise.all([
      sb.from('legs').select('*').eq('trip_id', tripId),
      sb.from('flights').select('*').eq('trip_id', tripId),
      sb.from('itineraries').select('*').eq('trip_id', tripId),
    ])

    return assembleTrip(tripRows[0], legRows || [], flightRows || [], itinRows || [])
  }
  const local = JSON.parse(localStorage.getItem(tripsKey()) || '[]')
  return local.find((t: any) => t.id === tripId) ?? null
}

export async function loadTrips(): Promise<any[]> {
  const user = await getUser()
  if (user) {
    const sb = getSupabase()
    const { data: tripRows, error } = await sb
      .from('trips')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to load trips:', error)
      return []
    }

    if (!tripRows || tripRows.length === 0) return []

    const tripIds = tripRows.map((t: any) => t.id)

    const [{ data: legRows }, { data: flightRows }, { data: itinRows }] = await Promise.all([
      sb.from('legs').select('*').in('trip_id', tripIds),
      sb.from('flights').select('*').in('trip_id', tripIds),
      sb.from('itineraries').select('*').in('trip_id', tripIds),
    ])

    return tripRows.map((tripRow: any) => {
      const legs = (legRows || []).filter((l: any) => l.trip_id === tripRow.id)
      const flights = (flightRows || []).filter((f: any) => f.trip_id === tripRow.id)
      const itins = (itinRows || []).filter((it: any) => it.trip_id === tripRow.id)
      return assembleTrip(tripRow, legs, flights, itins)
    })
  }
  return JSON.parse(localStorage.getItem(tripsKey()) || '[]')
}

export async function saveTrip(trip: any): Promise<void> {
  const user = await getUser()

  // localStorage cache (scoped by user)
  const key = tripsKey(user?.id)
  const local = JSON.parse(localStorage.getItem(key) || '[]')
  const idx = local.findIndex((t: any) => t.id === trip.id)
  if (idx >= 0) local[idx] = trip
  else local.push(trip)
  localStorage.setItem(key, JSON.stringify(local))

  if (!user) return

  const sb = getSupabase()

  // Upsert trip row
  const { error: tripError } = await sb
    .from('trips')
    .upsert(tripToRow(trip, user.id), { onConflict: 'id' })
  if (tripError) { console.error('Failed to save trip:', tripError); return }

  // Replace legs: delete then insert
  await sb.from('legs').delete().eq('trip_id', trip.id)
  const legRows = legsToRows(trip, user.id)
  if (legRows.length > 0) {
    const { error } = await sb.from('legs').insert(legRows)
    if (error) console.error('Failed to save legs:', error)
  }

  // Replace flights: delete all for this trip, then re-insert
  await sb.from('flights').delete().eq('trip_id', trip.id)
  const flightRows = flightsToRows(trip, user.id)
  if (flightRows.length > 0) {
    const { error } = await sb.from('flights').insert(flightRows)
    if (error) console.error('Failed to save flights:', error)
  }

  // Replace itineraries: delete all for this trip, then re-insert
  await sb.from('itineraries').delete().eq('trip_id', trip.id)
  const itinRows = itinerariesToRows(trip, user.id)
  if (itinRows.length > 0) {
    const { error } = await sb.from('itineraries').insert(itinRows)
    if (error) console.error('Failed to save itineraries:', error)
  }
}

export async function deleteTrip(tripId: string): Promise<void> {
  const user = await getUser()
  const key = tripsKey(user?.id)
  const local = JSON.parse(localStorage.getItem(key) || '[]')
  localStorage.setItem(key, JSON.stringify(local.filter((t: any) => t.id !== tripId)))

  if (!user) return
  const sb = getSupabase()
  // Delete child records first (in case no FK cascade)
  await Promise.all([
    sb.from('legs').delete().eq('trip_id', tripId),
    sb.from('flights').delete().eq('trip_id', tripId),
    sb.from('itineraries').delete().eq('trip_id', tripId),
  ])
  const { error } = await sb.from('trips').delete().eq('id', tripId)
  if (error) console.error('Failed to delete trip:', error)
}

// --------------- WALLET ---------------
// Supabase wallet columns: id, user_id, currency_type, program, balance, redemption_value, notes

function walletEntryToRow(entry: any, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    currency_type: entry.currency_type,
    program: entry.program,
    balance: entry.balance,
    redemption_value: entry.redemption_value ?? null,
    notes: entry.notes || null,
  }
}

function walletRowToEntry(row: any): any {
  return {
    id: row.id,
    currency_type: row.currency_type,
    program: row.program,
    balance: row.balance,
    redemption_value: row.redemption_value,
    notes: row.notes || '',
  }
}

export async function loadWallet(): Promise<any[]> {
  const user = await getUser()
  if (user) {
    const { data, error } = await getSupabase()
      .from('wallet')
      .select('*')
      .eq('user_id', user.id)
    if (error) {
      console.error('Failed to load wallet:', error)
      return []
    }
    return (data || []).map(walletRowToEntry)
  }
  return JSON.parse(localStorage.getItem(walletKey()) || '[]')
}

export async function saveWalletEntry(entry: any): Promise<void> {
  const user = await getUser()
  const key = walletKey(user?.id)
  const local = JSON.parse(localStorage.getItem(key) || '[]')
  const idx = local.findIndex((e: any) => e.id === entry.id)
  if (idx >= 0) local[idx] = entry
  else local.push(entry)
  localStorage.setItem(key, JSON.stringify(local))

  if (!user) return
  const { error } = await getSupabase()
    .from('wallet')
    .upsert(walletEntryToRow(entry, user.id), { onConflict: 'id' })
  if (error) console.error('Failed to save wallet entry:', error)
}

export async function saveAllWalletEntries(entries: any[]): Promise<void> {
  const user = await getUser()
  localStorage.setItem(walletKey(user?.id), JSON.stringify(entries))

  if (!user) return
  const sb = getSupabase()
  const { error: delError } = await sb.from('wallet').delete().eq('user_id', user.id)
  if (delError) { console.error('Failed to clear wallet:', delError); return }

  if (entries.length > 0) {
    const rows = entries.map(e => walletEntryToRow(e, user.id))
    const { error } = await sb.from('wallet').insert(rows)
    if (error) console.error('Failed to save wallet entries:', error)
  }
}

export async function deleteWalletEntry(entryId: string): Promise<void> {
  const user = await getUser()
  const key = walletKey(user?.id)
  const local = JSON.parse(localStorage.getItem(key) || '[]')
  localStorage.setItem(key, JSON.stringify(local.filter((e: any) => e.id !== entryId)))

  if (!user) return
  const { error } = await getSupabase().from('wallet').delete().eq('id', entryId)
  if (error) console.error('Failed to delete wallet entry:', error)
}

// --------------- MIGRATION ---------------
// Call after login to push any localStorage data to Supabase
// Reads from both old unscoped keys ("trips") and anon keys ("trips_anon")

export async function migrateLocalDataToSupabase(): Promise<void> {
  const user = await getUser()
  if (!user) return

  const sb = getSupabase()

  // Collect trips from old unscoped key + anon key (deduplicated)
  const oldTrips: any[] = JSON.parse(localStorage.getItem('trips') || '[]')
  const anonTrips: any[] = JSON.parse(localStorage.getItem('trips_anon') || '[]')
  const allLocalTrips = [...oldTrips]
  for (const t of anonTrips) {
    if (!allLocalTrips.some((existing: any) => existing.id === t.id)) {
      allLocalTrips.push(t)
    }
  }

  if (allLocalTrips.length > 0) {
    const { data: existingTrips } = await sb.from('trips').select('id').eq('user_id', user.id)
    const existingIds = new Set((existingTrips || []).map((t: any) => t.id))
    const newTrips = allLocalTrips.filter(t => !existingIds.has(t.id))
    for (const trip of newTrips) {
      await saveTrip(trip)
    }
  }

  // Collect wallet from old unscoped key + anon key
  const oldWallet: any[] = JSON.parse(localStorage.getItem('wallet') || '[]')
  const anonWallet: any[] = JSON.parse(localStorage.getItem('wallet_anon') || '[]')
  const allLocalWallet = [...oldWallet]
  for (const e of anonWallet) {
    if (!allLocalWallet.some((existing: any) => existing.id === e.id)) {
      allLocalWallet.push(e)
    }
  }

  if (allLocalWallet.length > 0) {
    const { data: existingWallet } = await sb.from('wallet').select('id').eq('user_id', user.id)
    const existingIds = new Set((existingWallet || []).map((w: any) => w.id))
    const newEntries = allLocalWallet.filter(e => !existingIds.has(e.id))
    if (newEntries.length > 0) {
      const rows = newEntries.map(e => walletEntryToRow(e, user.id))
      const { error } = await sb.from('wallet').insert(rows)
      if (error) console.error('Failed to migrate wallet:', error)
    }
  }

  // Clean up old unscoped keys and anon keys after migration
  localStorage.removeItem('trips')
  localStorage.removeItem('wallet')
  localStorage.removeItem('trips_anon')
  localStorage.removeItem('wallet_anon')
}
