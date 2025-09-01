// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import Stripe from 'stripe'
import type { DonationRecord } from '@/types'

// Do NOT call `new Stripe(...)` at module evaluation time with possibly-missing env vars.
// Instead read env here and lazily instantiate inside the handler if configured.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

// Helper: ensure public data dir exists when writing (server-side)
async function writeDonationRecord(record: DonationRecord) {
  const file = path.join(process.cwd(), 'public', 'data', 'donations.json')
  let all: DonationRecord[] = []
  try {
    const rawfile = await fs.promises.readFile(file, 'utf8')
    const parsed = JSON.parse(rawfile)
    if (Array.isArray(parsed)) all = parsed as DonationRecord[]
  } catch (readErr: unknown) {
    // file missing or invalid: continue with empty array
    // keep this quiet in production (debug only)
    // console.debug('donations.json read warning:', readErr)
    all = []
  }

  all.unshift(record)
  await fs.promises.mkdir(path.dirname(file), { recursive: true })
  await fs.promises.writeFile(file, JSON.stringify(all, null, 2), 'utf8')
}

export async function POST(req: Request) {
  // If Stripe is not configured, return a harmless response and do not throw.
  if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET) {
    console.warn('Stripe webhook received but STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not configured. Ignoring.')
    // 501 indicates not implemented/configured — still allows build/runtime to proceed.
    return NextResponse.json({ received: false, reason: 'stripe-not-configured' }, { status: 501 })
  }

  // Lazily create the Stripe client now that env vars are present.
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })

  // Read raw body for signature verification
  const buf = await req.arrayBuffer()
  const raw = Buffer.from(buf)
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error')
    console.error('Webhook signature verification failed.', msg)
    return NextResponse.json({ received: false }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const record: DonationRecord = {
        id: String(session.id),
        customer_email: session.customer_email ?? undefined,
        amount_total: typeof session.amount_total === 'number' ? session.amount_total : undefined,
        currency: session.currency ?? undefined,
        metadata: (session.metadata && typeof session.metadata === 'object') ? (session.metadata as Record<string, string>) : undefined,
        payment_status: session.payment_status ?? undefined,
        createdAt: new Date().toISOString(),
      }

      // Persist to local JSON; in production you'll replace with your DB later.
      try {
        await writeDonationRecord(record)
        console.log('Recorded donation', record.id)
      } catch (fsErr: unknown) {
        console.error('Failed to write donation record:', fsErr)
        // don't crash the webhook; return 500 so Stripe can retry if needed
        return NextResponse.json({ received: false }, { status: 500 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error')
    console.error('Webhook handling error', msg)
    return NextResponse.json({ received: false }, { status: 500 })
  }
}
