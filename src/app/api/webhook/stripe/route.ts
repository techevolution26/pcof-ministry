// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2022-11-15' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: Request) {
  const buf = await req.arrayBuffer()
  const raw = Buffer.from(buf)
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err?.message)
    return NextResponse.json({ received: false }, { status: 400 })
  }

  try {
    // handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      // persist a minimal record (dev-only)
      const record = {
        id: session.id,
        customer_email: session.customer_email,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
        payment_status: session.payment_status,
        createdAt: new Date().toISOString(),
      }

      const file = path.join(process.cwd(), 'public', 'data', 'donations.json')
      let all: any[] = []
      try {
        const rawfile = await fs.promises.readFile(file, 'utf8')
        all = JSON.parse(rawfile)
      } catch (err) {
        all = []
      }
      all.unshift(record)
      await fs.promises.mkdir(path.dirname(file), { recursive: true })
      await fs.promises.writeFile(file, JSON.stringify(all, null, 2), 'utf8')
      console.log('Recorded donation', record.id)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook handling error', err)
    return NextResponse.json({ received: false }, { status: 500 })
  }
}
