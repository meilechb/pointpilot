import { NextResponse } from 'next/server'

// The Pro tier is retired — Point Tripper is free, with no paid plans.
// Nothing in the app links here any more; this stub exists so an older client
// can't open a Stripe checkout session. Safe to delete.
export async function POST() {
  return NextResponse.json(
    { error: 'Point Tripper is free for everyone — there is nothing to buy.' },
    { status: 410 }
  )
}
