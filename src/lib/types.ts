// src/lib/types.ts
export type Church = {
  id: string | number
  name: string
  branch?: string
  slug?: string
  address?: string
  pastor?: string
  logo_path?: string
  logoUrl?: string
  [key: string]: unknown
}

export type Sermon = {
  id: string | number
  title?: string
  speaker?: string
  date?: string
  summary?: string
  mediaUrl?: string
  [key: string]: unknown
}

export type EventItem = {
  id: string | number
  title?: string
  description?: string
  startsAt?: string
  endsAt?: string
  location?: string
  image_path?: string
  imageUrl?: string
  [key: string]: unknown
}
