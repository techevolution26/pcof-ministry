// app/layout.tsx
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CogMaintenance from '@/components/CogMaintenance'

export const metadata = {
  title: 'PCOF - Pentecostal Church One Faith',
  description: 'PCOF ministry -Unity of Churches'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen h-full bg-gradient-to-b from-green-50 via-green-100 to-green-200 text-slate-900">
        <div className="min-h-screen flex flex-col">
          <Header />

          <main className="container mx-auto p-4 md:p-6 flex-1">{children}</main>

          <CogMaintenance size={80} />
          <Footer />
        </div>
      </body>
    </html>
  )
}
