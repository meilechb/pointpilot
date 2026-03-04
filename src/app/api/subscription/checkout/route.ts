import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()

  // Check for existing Stripe customer
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: sub } = await serviceSupabase
    .from('subscriptions')
    .select('stripe_customer_id, status, plan, current_period_end')
    .eq('user_id', user.id)
    .single()

  // Block checkout if user already has an active Pro subscription
  const isPro = sub && (sub.status === 'active' || sub.status === 'past_due') && sub.plan === 'pro'
  const isCanceledButActive = sub?.status === 'canceled' && sub?.plan === 'pro' &&
    sub?.current_period_end && new Date(sub.current_period_end) > new Date()
  if (isPro || isCanceledButActive) {
    return NextResponse.json({ error: 'You already have an active Pro subscription' }, { status: 400 })
  }

  let customerId = sub?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    })
    customerId = customer.id

    await serviceSupabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: 'free',
        plan: 'free',
      }, { onConflict: 'user_id' })
  }

  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'https://www.pointtripper.com/account?upgraded=true',
    cancel_url: 'https://www.pointtripper.com/pricing',
    metadata: { user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
