import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Server-side login endpoint.
// The login form does a real native POST here so Chrome sees a traditional
// form submission → server response → redirect, which reliably triggers
// the "Save password?" prompt.
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const email = formData.get('username') as string
  const password = formData.get('password') as string
  const redirect = formData.get('redirect') as string || '/'

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Email and password are required')}&redirect=${encodeURIComponent(redirect)}`, req.url),
      303
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}&redirect=${encodeURIComponent(redirect)}`, req.url),
      303
    )
  }

  // Success — redirect to destination. Chrome sees: form POST → 303 redirect → done.
  // This is the classic pattern Chrome's password manager is built to detect.
  return NextResponse.redirect(new URL(redirect, req.url), 303)
}
