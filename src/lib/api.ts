// // Temporary API layer that reads from public JSON files (static). Replace with DB queries later.


// export async function fetchChurches(){
// // static-first: fetch from public files (cacheable)
// // To force SSR later: in the page set `export const dynamic = 'force-dynamic'`
// const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/data/churches.json`, { cache: 'force-cache' })
// if (!res.ok) throw new Error('Failed to load churches')
// return res.json()
// }


// export async function fetchSermons(){
// const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/data/sermons.json`, { cache: 'force-cache' })
// if (!res.ok) throw new Error('Failed to load sermons')
// return res.json()
// }


// export async function fetchEvents(){
// const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/data/events.json`, { cache: 'force-cache' })
// if (!res.ok) throw new Error('Failed to load events')
// return res.json()
// }

// Temporary API layer that reads from public JSON files (static). Replace with DB queries later.
// This version is server-safe: it reads the public JSON files from disk when running on the server
// (so `fetch('/data/...')` won't try to parse a relative URL on the server).


import fs from 'fs'
import path from 'path'


async function readJsonFromPublic(filename: string){
const file = path.join(process.cwd(), 'public', 'data', filename)
const raw = await fs.promises.readFile(file, 'utf8')
return JSON.parse(raw)
}


export async function fetchChurches(){
// Server (Node) can read directly from the filesystem.
if (typeof window === 'undefined') {
return await readJsonFromPublic('churches.json')
}


// Client fallback: fetch from the public URL (cacheable)
const res = await fetch('/data/churches.json', { cache: 'force-cache' })
if (!res.ok) throw new Error('Failed to load churches')
return res.json()
}


export async function fetchSermons(){
if (typeof window === 'undefined') {
return await readJsonFromPublic('sermons.json')
}


const res = await fetch('/data/sermons.json', { cache: 'force-cache' })
if (!res.ok) throw new Error('Failed to load sermons')
return res.json()
}


export async function fetchEvents(){
if (typeof window === 'undefined') {
return await readJsonFromPublic('events.json')
}


const res = await fetch('/data/events.json', { cache: 'force-cache' })
if (!res.ok) throw new Error('Failed to load events')
return res.json()
}