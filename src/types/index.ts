// src/types/index.ts
export type ID = string

export type Church = {
  id: ID
  slug?: string
  name: string
  tagline?: string
  address?: string
  location?: string
  locationUrl?: string
  website?: string
  serviceTimes?: string
  description?: string
  pastor?: string
  logoUrl?: string
  phone?: string
  email?: string
  createdAt?: string
  [key: string]: unknown

}

export type Sermon = {
  id: ID
  title: string
  speaker?: string
  date?: string
  mediaUrl?: string
  summary?: string
  description?: string
  transcript?: string
  tags?: string[]
  [key: string]: unknown
}

export type EventItem = {
  id: ID
  title: string
  startsAt?: string
  endsAt?: string
  address?: string
  location?: string
  locationUrl?: string
  host?: string
  tags?: string[]
  online?: boolean
  capacity?: number
  description?: string
  [key: string]: unknown
}

export type Leader = {
  id: ID
  name: string
  title?: string
  bio?: string
  photo?: string
  contact?: { email?: string; phone?: string }
  [key: string]: unknown
}

export type Audit = {
  id: ID
  action?: string
  resource?: string
  createdAt?: string
  [key: string]: unknown
}

export type DonationRecord = {
  id: ID
  customer_email?: string
  amount_total?: number
  currency?: string
  metadata?: Record<string, string>
  payment_status?: string
  createdAt?: string
  [key: string]: unknown
}

export type RSVP = {
  id: ID
  name: string
  email: string
  createdAt?: string
  [key: string]: unknown
}
