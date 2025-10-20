// src/lib/types.ts
export type ID = number | string;
export type Nullable<T> = T | null;

/**
 * Generic API wrapper some endpoints return
 * e.g. { data: {...} } or { data: [...], meta: { total: 123 } }
 */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown> | {
    total?: number;
    per_page?: number;
    page?: number;
  };
  [k: string]: unknown;
}

/**
 * A union for convenience: an endpoint might return T or ApiResponse<T>.
 */
export type ResponseOrData<T> = T | ApiResponse<T>;

/**
 * Utility type to unwrap ApiResponse<T> -> T
 */
export type UnwrapResponse<T> = T extends ApiResponse<infer U> ? U : T;

/* -------------------------
   Domain models (minimal)
   Expand fields as needed
   ------------------------- */

export interface User {
  id?: ID;
  email?: string;
  name?: string;
  role?: 'admin' | 'church_admin' | 'user' | string;
  church_id?: ID | null;
  [k: string]: unknown;
}

export interface Church {
  id?: ID;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  [k: string]: unknown;
}

export interface Department {
  id?: ID;
  name?: string | null;
  description?: string | null;
  church_id?: ID | null;
  church?: Church | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: unknown;
}

export interface Designation {
  id?: ID;
  name?: string | null;
  description?: string | null;
  church_id?: ID | null;
  [k: string]: unknown;
}

export interface Member {
  id?: ID;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  church_id?: ID | null;
  [k: string]: unknown;
}

export interface Minister {
  id?: ID;
  full_name?: string | null;
  church_id?: ID | null;
  [k: string]: unknown;
}

export interface Event {
  id?: ID;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_path?: string | null;
  church_id?: ID | null;
  starts_at?: string | null;
  ends_at?: string | null;
  location?: string | null;
  capacity?: number | null;
  online?: boolean | null;
  scope?: string | null;
  is_national?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: unknown;
}

export interface Rsvp {
  id?: ID;
  member_id?: ID | null;
  member?: Member | null;
  status?: string | null;
  notes?: string | null;
  [k: string]: unknown;
}

export interface Asset {
  id?: ID;
  name?: string | null;
  asset_tag?: string | null;
  file_url?: string | null;
  church_id?: ID | null;
  [k: string]: unknown;
}

export interface Payment {
  id?: ID;
  amount?: number | null;
  church_id?: ID | null;
  member_id?: ID | null;
  created_at?: string | null;
  [k: string]: unknown;
}

export interface Reconciliation {
  id?: ID;
  church_id?: ID | null;
  period_start?: string | null;
  period_end?: string | null;
  [k: string]: unknown;
}

/* Generic helpers for form payloads, etc. */
export type FormPayload = Record<string, unknown>;
