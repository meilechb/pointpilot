import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendSubscriptionEmail } from '@/lib/email'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.metadata?.user_id

        if (!userId || !customerId) break

        // Get subscription details for period end
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
        const periodEnd = (stripeSub.items?.data?.[0] as any)?.current_period_end || (stripeSub as any).current_period_end

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            plan: 'pro',
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            cancel_at_period_end: false,
          }, { onConflict: 'user_id' })

        // Send welcome email
        const customerEmail = session.customer_details?.email || session.customer_email
        if (customerEmail) {
          await sendSubscriptionEmail(customerEmail, 'welcome')
        }

        console.log(`[stripe-webhook] checkout.session.completed for user ${userId}`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const subscriptionId = (invoice as any).subscription as string

        if (!subscriptionId) break

        const stripeSub2 = await stripe.subscriptions.retrieve(subscriptionId)
        const periodEnd2 = (stripeSub2.items?.data?.[0] as any)?.current_period_end || (stripeSub2 as any).current_period_end

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: periodEnd2 ? new Date(periodEnd2 * 1000).toISOString() : null,
          })
          .eq('stripe_customer_id', customerId)

        console.log(`[stripe-webhook] invoice.paid for customer ${customerId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        console.log(`[stripe-webhook] invoice.payment_failed for customer ${customerId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user email for cancellation email
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan: 'free',
            cancel_at_period_end: false,
          })
          .eq('stripe_customer_id', customerId)

        // Send cancellation email
        if (sub?.user_id) {
          const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id)
          if (user?.email) {
            await sendSubscriptionEmail(user.email, 'canceled')
          }
        }

        console.log(`[stripe-webhook] customer.subscription.deleted for customer ${customerId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const subPeriodEnd = (subscription.items?.data?.[0] as any)?.current_period_end || (subscription as any).current_period_end

        await supabase
          .from('subscriptions')
          .update({
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: subPeriodEnd ? new Date(subPeriodEnd * 1000).toISOString() : null,
          })
          .eq('stripe_customer_id', customerId)

        console.log(`[stripe-webhook] customer.subscription.updated for customer ${customerId}`)
        break
      }
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
