import { NextResponse } from 'next/server'

// POST endpoint that returns 200 OK.
// The login form submits here (into a hidden iframe) after successful Supabase auth,
// so Chrome detects a real form submission and offers to save the password.
export async function POST() {
  return new NextResponse('ok', { status: 200 })
}
