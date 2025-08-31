import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'PCOF - Pentecostal Church One Faith',
  description: 'PCOF ministry -Unity of Churches'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-b from-white to-green-50 min-h-screen">
        <Header />
        <main className="container mx-auto p-4 md:p-6">{children}</main>
        <Footer />
      </body>
    </html>
  )
}