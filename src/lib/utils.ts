// src/lib/utils.ts
export type AnyObject = Record<string, unknown>;

export function extractData<T = unknown>(val: unknown): T {
    if (val && typeof val === 'object') {
        const obj = val as AnyObject;
        if ('data' in obj) return obj['data'] as T;
    }
    return val as T;
}

export function extractMeta(val: unknown): AnyObject | null {
    if (!val || typeof val !== 'object') return null;
    const obj = val as AnyObject;
    if (obj.meta && typeof obj.meta === 'object') return obj.meta as AnyObject;
    if (obj.pagination && typeof obj.pagination === 'object') return obj.pagination as AnyObject;
    return null;
}

export function getIdFromParams(params: unknown): string | undefined {
    if (params == null) return undefined;
    if (typeof params === 'string' || typeof params === 'number') return String(params);
    if (typeof params === 'object') {
        const p = params as AnyObject;
        const idVal = p['id'];
        if (Array.isArray(idVal)) return idVal[0] ? String(idVal[0]) : undefined;
        if (typeof idVal === 'string' || typeof idVal === 'number') return String(idVal);
    }
    return undefined;
}

export function toNumber(v: unknown, fallback = 0): number {
    const n = Number(v as any);
    return Number.isFinite(n) ? n : fallback;
}
