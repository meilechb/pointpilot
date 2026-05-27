import { NextRequest, NextResponse } from 'next/server'
import { sendAdminGrantEmail } from '@/lib/email'
import { getServiceClient, verifyAdmin } from '@/lib/adminAuth'

// GET: list users with their subscription status
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  // Get all users from auth
  const { data: { users }, error } = await sb.auth.admin.listUsers({ perPage: 200 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get all subscriptions
  const { data: subs } = await sb.from('subscriptions').select('*')
  const subMap = new Map((subs || []).map(s => [s.user_id, s]))

  const result = (users || []).map(u => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || '',
    created_at: u.created_at,
    plan: subMap.get(u.id)?.plan || 'free',
    status: subMap.get(u.id)?.status || 'free',
  }))

  return NextResponse.json(result)
}

// POST: assign or revoke pro for a user
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, plan } = await req.json()
  if (!userId || !['free', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const sb = getServiceClient()

  // Check if subscription row exists
  const { data: existing } = await sb
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) {
    await sb.from('subscriptions').update({
      plan,
      status: plan === 'pro' ? 'active' : 'free',
      current_period_end: plan === 'pro' ? null : null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)
  } else {
    await sb.from('subscriptions').insert({
      user_id: userId,
      plan,
      status: plan === 'pro' ? 'active' : 'free',
    })
  }

  // Send email notification to the user
  const { data: { user: targetUser } } = await sb.auth.admin.getUserById(userId)
  if (targetUser?.email) {
    await sendAdminGrantEmail(
      targetUser.email,
      plan === 'pro' ? 'granted' : 'revoked',
      { adminName: 'Meilech' }
    )
  }

  return NextResponse.json({ ok: true })
}
