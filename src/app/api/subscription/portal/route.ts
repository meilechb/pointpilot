import { NextResponse } from 'next/server'

// The Pro tier is retired — Point Tripper is free, with no paid plans.
// Nothing in the app links here any more; this stub exists so an older client
// can't open the Stripe billing portal. Safe to delete.
export async function POST() {
  return NextResponse.json(
    { error: 'Point Tripper is free for everyone — there is no billing to manage.' },
    { status: 410 }
  )
}
