// src/lib/api.ts
import fs from 'fs'
import path from 'path'


async function readJsonFromPublic(filename: string) {
    const file = path.join(process.cwd(), 'public', 'data', filename)
    const raw = await fs.promises.readFile(file, 'utf8')
    return JSON.parse(raw)
}


export async function fetchChurches() {
    // Server (Node) can read directly from the filesystem.
    if (typeof window === 'undefined') {
        return await readJsonFromPublic('churches.json')
    }


    // Client fallback: fetch from the public URL (cacheable)
    const res = await fetch('/data/churches.json', { cache: 'force-cache' })
    if (!res.ok) throw new Error('Failed to load churches')
    return res.json()
}


export async function fetchSermons() {
    if (typeof window === 'undefined') {
        return await readJsonFromPublic('sermons.json')
    }


    const res = await fetch('/data/sermons.json', { cache: 'force-cache' })
    if (!res.ok) throw new Error('Failed to load sermons')
    return res.json()
}


export async function fetchEvents() {
    if (typeof window === 'undefined') {
        return await readJsonFromPublic('events.json')
    }


    const res = await fetch('/data/events.json', { cache: 'force-cache' })
    if (!res.ok) throw new Error('Failed to load events')
    return res.json()
}

export async function fetchLeadership() {
    // server: read from file system (fast, reliable during SSR)
    if (typeof window === 'undefined') {
        const file = path.join(process.cwd(), 'public', 'data', 'leadership.json')
        try {
            const raw = await fs.promises.readFile(file, 'utf8')
            return JSON.parse(raw)
        } catch (err) {
            console.error('fetchLeadership error (server):', err)
            return []
        }
    }


    // client: fetch from the public folder
    try {
        const res = await fetch('/data/leadership.json', { cache: 'force-cache' })
        if (!res.ok) throw new Error('Failed to fetch leadership.json')
        return res.json()
    } catch (err) {
        console.error('fetchLeadership error (client):', err)
        return []
    }
}