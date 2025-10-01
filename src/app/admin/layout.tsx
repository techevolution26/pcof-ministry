// src/app/admin/layout.tsx
import React from 'react';
import AdminShell from '@/components/AdminShell';

export const metadata = { title: 'Admin — PCOF' };

/**
 * Server layout: do NOT render <html> or <body> here (root layout handles that).
 * AdminShell is a client component that will run the auth guard.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
