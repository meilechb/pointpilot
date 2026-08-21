import { NextResponse } from 'next/server'

// The Pro tier is retired — Point Tripper is free, with no paid plans.
// This endpoint stays only to answer any webhook Stripe is still configured
// to send. It records nothing and grants nothing. Delete the Stripe webhook
// in the Stripe dashboard, then delete this file.
export async function POST() {
  return NextResponse.json(
    { error: 'Subscriptions are retired — Point Tripper is free for everyone.' },
    { status: 410 }
  )
}
