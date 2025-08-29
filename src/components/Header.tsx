'use client'
import Link from 'next/link'


export default function Header(){
return (
<header className="bg-white shadow">
<div className="container mx-auto p-4 flex justify-between items-center">
<h1 className="text-xl font-bold">PCOF</h1>
<nav className="space-x-4">
<Link href="/">Home</Link>
<Link href="/about">About</Link>
<Link href="/churches">Churches</Link>
<Link href="/sermons">Sermons</Link>
<Link href="/events">Events</Link>
<Link href="/contact">Contact</Link>
<Link href="/admin">Admin</Link>
</nav>
</div>
</header>
)
}