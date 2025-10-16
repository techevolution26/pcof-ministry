// src/types.ts
export type ID = number | string;

export interface Role {
    id: ID;
    name: string;
    [key: string]: unknown;
}

export interface Church {
    id: ID;
    name: string;
    branch?: string | null;
    address?: string | null;
    city?: string | null;
    region?: string | null;
    [key: string]: unknown;
}

export interface User {
    id: ID;
    name: string;
    email: string;
    church_id?: ID | null;
    is_active?: boolean;
    roles?: string[] | Role[];
    [key: string]: unknown;
}

/** Generic paginated response (Laravel style) */
export interface Paginated<T> {
    current_page?: number;
    data: T[];
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
}

/** API error shape we expect for validation errors */
export interface ApiValidationError {
    message?: string;
    errors?: Record<string, string[]>;
    [key: string]: unknown;
}

/** Generic API response wrapper if needed */
export interface ApiResponse<T = unknown> {
    data?: T;
    message?: string;
    [key: string]: unknown;
}
