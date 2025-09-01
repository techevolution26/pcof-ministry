// src/app/api/donate/checkout/route.ts
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

type DonateRequestBody = {
  amount?: number | string
  currency?: string
  frequency?: 'one_time' | 'monthly' | string
  donor?: { name?: string; email?: string }
  description?: string
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ''

// Lazy-initialize Stripe inside the handler so builds don't fail when env is missing.
async function getStripe(): Promise<Stripe | null> {
  if (!STRIPE_SECRET_KEY) return null
  // dynamic import so Stripe types remain available but instantiation is deferred
  const Stripe = (await import('stripe')).default as typeof import('stripe').default
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })
}

export async function POST(req: Request) {
  // If Stripe not configured, return 501 (not implemented/configured)
  if (!STRIPE_SECRET_KEY) {
    console.warn('Stripe checkout requested but STRIPE_SECRET_KEY is not configured. Ignoring.')
    return NextResponse.json({ ok: false, reason: 'stripe-not-configured' }, { status: 501 })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ ok: false, reason: 'stripe-init-failed' }, { status: 500 })
  }

  try {
    const raw = (await req.json()) as unknown

    if (typeof raw !== 'object' || raw === null) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
    }

    const {
      amount,
      currency = 'KES',
      frequency = 'one_time',
      donor = {},
      description = '',
    } = raw as DonateRequestBody

    // validate amount (allow string or number)
    const parsed = Number(amount)
    if (!parsed || Number.isNaN(parsed) || parsed <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 })
    }

    // validate donor email minimally (if provided)
    const donorEmail = donor?.email ? String(donor.email).trim() : undefined
    const donorName = donor?.name ? String(donor.name).trim() : ''

    // smallest currency unit: assume 2 decimals (cents)
    // if you expect whole-unit currencies without cents, adjust accordingly
    const amountInCents = Math.round(parsed * 100)

    const isRecurring = frequency === 'monthly'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: isRecurring ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: String(currency).toLowerCase(),
            product_data: {
              name: description || `PCOF donation`,
            },
            unit_amount: amountInCents,
            ...(isRecurring ? { recurring: { interval: 'month' } } : {}),
          },
          quantity: 1,
        },
      ],
      customer_email: donorEmail,
      metadata: {
        donor_name: donorName ?? '',
        frequency,
      },
      success_url: `${NEXT_PUBLIC_BASE_URL}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${NEXT_PUBLIC_BASE_URL}/donate?canceled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error')
    console.error('create checkout error', msg)
    return NextResponse.json({ message: msg || 'Server 00error' }, { status: 500 })
  }
}
