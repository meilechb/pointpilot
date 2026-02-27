import { NextResponse } from 'next/server'

// Dummy POST endpoint that returns 200.
// The login form submits here (into a hidden iframe) so Chrome
// detects a "successful" form submission and offers to save the password.
export async function POST() {
  return new NextResponse('ok', { status: 200 })
}
