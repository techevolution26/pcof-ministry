// src/app/api/events/[id]/rsvp/route.ts
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const body = await req.json()
  const name = (body.name || '').trim()
  const email = (body.email || '').trim().toLowerCase()

  if (!name || !email) {
    return NextResponse.json({ message: 'Name and email required' }, { status: 400 })
  }

  // simple validation for email
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ message: 'Invalid email' }, { status: 400 })
  }

  const file = path.join(process.cwd(), 'public', 'data', 'rsvps.json')
  let all: any[] = []
  try {
    const raw = await fs.promises.readFile(file, 'utf8')
    all = JSON.parse(raw)
  } catch (err) {
    all = []
  }

  const entry = {
    id: `r_${Date.now()}`,
    eventId: id,
    name,
    email,
    createdAt: new Date().toISOString(),
    status: 'confirmed' // or 'pending' if you want moderation flow
  }

  all.push(entry)

  try {
    await fs.promises.mkdir(path.dirname(file), { recursive: true })
    await fs.promises.writeFile(file, JSON.stringify(all, null, 2), 'utf8')
  } catch (err: any) {
    return NextResponse.json({ message: 'Could not save RSVP' }, { status: 500 })
  }

  // TODO: send confirmation email via SendGrid/Postmark (server-side job)
  return NextResponse.json({ message: 'ok', entry })
}
