import { NextRequest, NextResponse } from 'next/server'

// POST endpoint that Chrome sees as a successful form submission.
// After Supabase auth succeeds client-side, the form natively submits here,
// which triggers Chrome's "Save password?" prompt. Then we redirect to the app.
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const redirect = formData.get('redirect') as string || '/'
  return NextResponse.redirect(new URL(redirect, req.url), 303)
}
