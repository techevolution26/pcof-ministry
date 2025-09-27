export type User = {
  id: number | string
  name?: string
  email?: string
  role?: string
}

export type Church = {
  id: string | number
  name: string
  slug?: string
  address?: string
  pastor?: string
  email?: string
  phone?: string
  logoUrl?: string
  serviceTimes?: string[] | null
  description?: string | null
}

export type EventItem = {
  id: string | number
  title: string
  startsAt?: string | null
  endsAt?: string | null
  location?: string | null
  locationUrl?: string | null
  host?: string | null
  tags?: string[] | null
  image?: string | null
  capacity?: number | null
  description?: string | null
}

export type Sermon = {
  id: string | number
  title?: string
  speaker?: string
  date?: string
  summary?: string
  mediaUrl?: string
}
