'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AdminGuard from './AdminGuard'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''

  // call hooks unconditionally
  const { user, isLoading, logout } = useAdminAuth()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // identify public pages (no guard)
  const publicAdminPaths = ['/admin/login', '/admin/register']
  const isPublic = publicAdminPaths.includes(pathname) || pathname.startsWith('/admin/public')

  // While verifying show a centered loader to avoid hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-3 w-9 h-9 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mx-auto" />
          <div className="text-sm text-gray-500">Verifying admin session…</div>
        </div>
      </div>
    )
  }

  // If this is a public admin page, render children directly (no header/sidebar)
  if (isPublic) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto p-6">{children}</div>
      </main>
    )
  }

  // If verification finished and we have no user, render the guard (it will redirect)
  // Wrap protected layout in AdminGuard so the guard can redirect if needed.
  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-slate-50">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r p-4 overflow-y-auto transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="mb-6 flex items-center justify-between">
            <div className="text-lg font-bold">PCOF Admin</div>
            <button aria-label="Close" onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded hover:bg-slate-100">
              ✕
            </button>
          </div>

          <div className="mb-6">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-medium">
              {user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U'}
            </div>
            <div className="mt-2">
              <div className="text-sm font-medium text-slate-800">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            <Link href="/admin" className="block p-2 rounded hover:bg-slate-50">Dashboard</Link>
            <Link href="/admin/churches" className="block p-2 rounded hover:bg-slate-50">Churches</Link>
            <Link href="/admin/members" className="block p-2 rounded hover:bg-slate-50">Members</Link>
            <Link href="/admin/events" className="block p-2 rounded hover:bg-slate-50">Events</Link>
            <Link href="/admin/assemblies" className="block p-2 rounded hover:bg-slate-50">Assemblies</Link>
            <Link href="/admin/departments" className="block p-2 rounded hover:bg-slate-50">Departments</Link>
            <Link href="/admin/designations" className="block p-2 rounded hover:bg-slate-50">Designations</Link>
            <Link href="/admin/ministers" className="block p-2 rounded hover:bg-slate-50">Ministers</Link>
            <Link href="/admin/users" className="block p-2 rounded hover:bg-slate-50">Users</Link>
            <Link href="/admin/roles" className="block p-2 rounded hover:bg-slate-50">Roles</Link>

            <button onClick={() => { logout(); }} className="mt-4 w-full text-left px-2 py-2 text-sm text-red-600 rounded hover:bg-red-50">Sign out</button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 pt-20 md:pt-6 md:ml-64 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </AdminGuard>
  )
}


//// src/components/AdminShell.tsx
// 'use client'
// import React, { useEffect, useState } from 'react'
// import Link from 'next/link'
// import { usePathname, useRouter } from 'next/navigation'
// import AdminGuard from './AdminGuard'
// import { useAdminAuth } from '@/hooks/useAdminAuth'

// export default function AdminShell({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname() || ''
//   const router = useRouter()

//   // call all hooks unconditionally, at top
//   const { user, isLoading, logout } = useAdminAuth()
//   const [mounted, setMounted] = useState(false)
//   const [sidebarOpen, setSidebarOpen] = useState(false)

//   useEffect(() => { setMounted(true) }, [])

//   // define which admin routes are public (do not require an authenticated user)
//   const publicAdminPaths = ['/admin/login', '/admin/register']
//   const isPublic = publicAdminPaths.includes(pathname) || pathname.startsWith('/admin/public')

//   // Redirect to login for protected pages when verification completes and there's no user.
//   useEffect(() => {
//     if (isPublic) return // don't run redirect on public pages
//     if (!mounted) return
//     if (!isLoading && !user) {
//       router.replace('/admin/login')
//     }
//   }, [isPublic, mounted, isLoading, user, router])

//   // While verifying or waiting for "mounted" show a small loader to avoid hydration mismatch
//   if (!mounted || isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-sm text-gray-500">Verifying admin session…</div>
//       </div>
//     )
//   }

//   // If this is a public admin page, render children directly (no AdminGuard)
//   if (isPublic) {
//     return (
//       <main className="min-h-screen bg-slate-50">
//         <div className="max-w-3xl mx-auto p-4">{children}</div>
//       </main>
//     )
//   }

//   // If verification finished and we have no user, the redirect above should have fired; render nothing to avoid flash
//   if (!user) return null

//   const initials = (name?: string) =>
//     name
//       ? name
//         .split(' ')
//         .map((n) => n[0])
//         .slice(0, 2)
//         .join('')
//         .toUpperCase()
//       : 'U'

//   return (
//     <AdminGuard>
//       {/* Top header for small screens and sticky desktop header */}
//       <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm h-16 flex items-center px-4 md:px-6">
//         <div className="flex items-center w-full">
//           {/* hamburger for mobile */}
//           <button
//             aria-label="Toggle sidebar"
//             onClick={() => setSidebarOpen((v) => !v)}
//             className="mr-3 md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
//           >
//             <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           </button>

//           <div className="flex items-center gap-3">
//             <div className="text-lg font-semibold">PCOF Admin</div>
//             <div className="hidden md:flex items-center text-sm text-slate-500">Admin console</div>
//           </div>

//           <div className="ml-auto flex items-center gap-3">
//             {mounted && !isLoading && user ? (
//               <div className="flex items-center gap-3">
//                 <div className="hidden md:flex items-center gap-2 text-sm">
//                   <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-medium">
//                     {initials(user.name)}
//                   </div>
//                   <div className="text-slate-700">{user.name}</div>
//                 </div>
//                 <button
//                   onClick={() => logout()}
//                   className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100"
//                 >
//                   Sign out
//                 </button>
//               </div>
//             ) : (
//               <div className="text-sm text-slate-400">Signed in</div>
//             )}
//           </div>
//         </div>
//       </header>

//       {/* Sidebar/backdrop */}
//       <aside
//         className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r p-4 overflow-y-auto transition-transform duration-200 ease-in-out
//           md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
//         role="navigation"
//         aria-label="Admin sidebar"
//       >
//         <div className="flex items-center justify-between mb-6">
//           <div className="text-lg font-bold">PCOF Admin</div>
//           <button
//             aria-label="Close sidebar"
//             onClick={() => setSidebarOpen(false)}
//             className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 focus:outline-none"
//           >
//             <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         {/* user area */}
//         <div className="mb-6">
//           {mounted && !isLoading && user ? (
//             <div className="flex items-center gap-3">
//               <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-medium">
//                 {initials(user.name)}
//               </div>
//               <div>
//                 <div className="text-sm font-medium text-slate-800">{user.name}</div>
//                 <div className="text-xs text-slate-500">{user.email ?? ''}</div>
//               </div>
//             </div>
//           ) : (
//             <div className="text-sm text-slate-400">Signed in</div>
//           )}
//         </div>

//         {/* nav */}
//         <nav className="space-y-1">
//           <Link href="/admin" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Dashboard</Link>
//           <Link href="/admin/churches" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Churches</Link>
//           <Link href="/admin/members" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Members</Link>
//           <Link href="/admin/finance" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Finance</Link>
//           <Link href="/admin/events" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Events</Link>
//           <Link href="/admin/assemblies" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Assemblies</Link>
//           <Link href="/admin/departments" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Departments</Link>
//           <Link href="/admin/designations" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Designations</Link>
//           <Link href="/admin/ministers" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Ministers</Link>
//           <Link href="/admin/users" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Users</Link>
//           <Link href="/admin/roles" className="flex items-center gap-2 p-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>Roles</Link>

//           <button onClick={() => { logout(); setSidebarOpen(false) }} className="mt-4 w-full text-left px-2 py-2 text-sm text-red-600 rounded-md hover:bg-red-50">Sign out</button>
//         </nav>
//       </aside>

//       {/* backdrop for mobile when sidebar is open */}
//       {sidebarOpen && (
//         <div className="fixed inset-0 z-30 bg-black/25 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
//       )}

//       {/* Main content area */}
//       <main className="flex-1 pt-20 md:pt-6 md:ml-64 bg-slate-50 min-h-screen p-4 md:p-6">
//         <div className="max-w-7xl mx-auto">{children}</div>
//       </main>
//     </AdminGuard>
//   )
// }
