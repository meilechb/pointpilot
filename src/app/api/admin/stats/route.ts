import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, verifyAdmin } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  // Run all queries in parallel
  const [usersRes, subsRes, tripsRes, flightsRes, scansRes, itinerariesRes] = await Promise.all([
    sb.auth.admin.listUsers({ perPage: 1000 }),
    sb.from('subscriptions').select('plan, status'),
    sb.from('trips').select('id', { count: 'exact', head: true }),
    sb.from('flights').select('id', { count: 'exact', head: true }),
    sb.from('scan_usage').select('id, scanned_at', { count: 'exact' }),
    sb.from('itineraries').select('id', { count: 'exact', head: true }),
  ])

  const users = usersRes.data?.users || []
  const subs = subsRes.data || []

  const totalUsers = users.length
  const proUsers = subs.filter(s => s.plan === 'pro' && (s.status === 'active' || s.status === 'canceled')).length
  const freeUsers = totalUsers - proUsers

  // Users joined this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const newUsersThisMonth = users.filter(u => u.created_at >= monthStart).length

  // Users joined this week
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString()
  const newUsersThisWeek = users.filter(u => u.created_at >= weekStart).length

  // Scans this month
  const scans = scansRes.data || []
  const scansThisMonth = scans.filter(s => s.scanned_at >= monthStart).length
  const totalScans = scansRes.count || 0

  return NextResponse.json({
    totalUsers,
    proUsers,
    freeUsers,
    newUsersThisMonth,
    newUsersThisWeek,
    totalTrips: tripsRes.count || 0,
    totalFlights: flightsRes.count || 0,
    totalItineraries: itinerariesRes.count || 0,
    totalScans,
    scansThisMonth,
  })
}
