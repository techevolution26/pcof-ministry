// File: src/lib/utils.ts
import type { ApiResponse } from './types'


/** If the API returned { data: ... } unwrap it, otherwise return the value (or null) */
export function extractData<T>(val: unknown): T | null {
    if (val == null) return null
    if (typeof val === 'object') {
        const obj = val as Record<string, unknown>
        if ('data' in obj) {
            const d = obj.data
            return (d == null ? null : (d as T))
        }
    }
    return val as T
}


/** Get array from either [] or { data: [] } */
export function extractArray<T>(val: unknown): T[] {
    if (!val) return []
    if (Array.isArray(val)) return val as T[]
    if (typeof val === 'object') {
        const obj = val as Record<string, unknown>
        if (Array.isArray(obj.data)) return obj.data as T[]
    }
    return []
}


/** Safe id extractor for Next params (handles string | number | { id })) */
export function getIdFromParams(params: unknown): string | undefined {
    if (!params) return undefined
    if (typeof params === 'string' || typeof params === 'number') return String(params)
    if (typeof params === 'object') {
        const p = params as Record<string, unknown>
        const idVal = p['id']
        if (typeof idVal === 'string' || typeof idVal === 'number') return String(idVal)
    }
    return undefined
}