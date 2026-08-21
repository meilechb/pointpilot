import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'meilechbiller18@gmail.com'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

// GET: list registered users
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getServiceClient()

  // Get all users from auth
  const { data: { users }, error } = await sb.auth.admin.listUsers({ perPage: 200 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // No plan/status: every user is on the same free, unlimited tier.
  const result = (users || []).map(u => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || '',
    created_at: u.created_at,
  }))

  return NextResponse.json(result)
}
