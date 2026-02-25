import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const FREE_SCANS_PER_MONTH = 1

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const plan = sub?.plan || 'free'
  const status = sub?.status || 'free'
  const currentPeriodEnd = sub?.current_period_end || null
  const cancelAtPeriodEnd = sub?.cancel_at_period_end || false

  // Check if pro subscription is still in active period
  const isPro = (status === 'active' || status === 'past_due') && plan === 'pro'
  // Also allow canceled subs that haven't expired yet
  const isCanceledButActive = status === 'canceled' && plan === 'pro' && currentPeriodEnd && new Date(currentPeriodEnd) > new Date()

  if (isPro || isCanceledButActive) {
    return NextResponse.json({
      plan: 'pro',
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      scansUsed: 0,
      scansLimit: -1, // unlimited
      canScan: true,
    })
  }

  // Free user: count scans this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count } = await supabase
    .from('scan_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('scanned_at', monthStart)

  const scansUsed = count || 0

  return NextResponse.json({
    plan: 'free',
    status: 'free',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    scansUsed,
    scansLimit: FREE_SCANS_PER_MONTH,
    canScan: scansUsed < FREE_SCANS_PER_MONTH,
  })
}
