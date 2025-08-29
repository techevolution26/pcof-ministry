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
<body>
<Header />
<main className="container mx-auto p-6">{children}</main>
<Footer />
</body>
</html>
)
}