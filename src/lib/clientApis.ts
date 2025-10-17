// src/lib/clientApi.ts
import { ADMIN_TOKEN_KEY, getAdminToken } from './adminApi';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

function buildHeaders(extra?: HeadersInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(extra as Record<string, string> || {}),
  };
  const token = getAdminToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function parseJsonSafe(res: Response) {
  try { return await res.json(); } catch { return null; }
}

async function handleRes(res: Response) {
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    (err as unknown).response = data;
    throw err;
  }
  return data;
}

export async function getProtected(path: string, extraHeaders?: HeadersInit) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(extraHeaders),
    credentials: 'same-origin',
  });
  return handleRes(res);
}

export async function postProtected(path: string, body?: unknown, extraHeaders?: HeadersInit) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(extraHeaders),
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  return handleRes(res);
}

export async function putProtected(path: string, body?: unknown, extraHeaders?: HeadersInit) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: buildHeaders(extraHeaders),
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  return handleRes(res);
}
