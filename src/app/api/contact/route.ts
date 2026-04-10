import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, subject, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Store in Supabase contact_messages table (create if needed, or just log)
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    await supabase.from('contact_messages').insert({
      name,
      email,
      subject: subject || null,
      message,
    })
  } catch (err) {
    console.error('[contact] Failed to save message:', err)
    // Still return success — we don't want to block the user
  }

  console.log(`[contact] Message from ${name} <${email}>: ${subject || '(no subject)'}`)

  return NextResponse.json({ success: true })
}
