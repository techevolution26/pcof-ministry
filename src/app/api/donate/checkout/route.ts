// src/app/api/donate/checkout/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2022-11-15' })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, currency = 'KES', frequency = 'one_time', donor = {}, description = '' } = body

    // validate amount (assume amount is integer in main currency units)
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 })
    }

    // Stripe expects amount in smallest currency unit (e.g., cents). For KES use cents? KES has 2 decimals, so multiply by 100.
    // Adjust this based on your currency: many currencies use 2 decimals.
    const amountInCents = Math.round(parsed * 100)

    // Create Checkout session
    // For recurring (monthly) we can use price_data with recurring: { interval: 'month' }
    const isRecurring = frequency === 'monthly'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: isRecurring ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description || `PCOF donation`,
            },
            unit_amount: amountInCents,
            ...(isRecurring ? { recurring: { interval: 'month' } } : {}),
          },
          quantity: 1,
        },
      ],
      customer_email: donor?.email,
      metadata: {
        donor_name: donor?.name ?? '',
        frequency,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/donate?canceled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('create checkout error', err)
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500 })
  }
}
