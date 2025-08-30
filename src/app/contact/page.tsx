// app/contact/page.tsx
import ContactForm from '@/components/ContactForm'
import Link from 'next/link'


export const revalidate = 3600


export default function ContactPage() {
return (
<section className="py-12">
<div className="container mx-auto">
<header className="mb-6">
<h1 className="text-3xl font-bold">Contact PCOF</h1>
<p className="text-sm text-slate-600 mt-2">We'd love to hear from you — whether you're asking about a local church, an event, volunteering or how to partner with us.</p>
</header>


<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
<main className="lg:col-span-2">
<ContactForm />
</main>


<aside className="space-y-4">
<div className="bg-white border rounded p-4">
<h3 className="font-semibold">Office</h3>
<p className="text-sm text-slate-700 mt-2">PCOF Headquarters<br/>123 Faith Avenue<br/>Nairobi, Kenya</p>
<p className="text-sm text-slate-700 mt-2">Email: <a href="mailto:office@pcof.org" className="underline">office@pcof.org</a><br/>Phone: <a href="tel:+254700000000" className="underline">+254 700 000 000</a></p>
</div>


<div className="bg-white border rounded p-4">
<h3 className="font-semibold">Office hours</h3>
<p className="text-sm text-slate-700 mt-2">Mon — Fri: 9:00 — 17:00 EAT<br/>Sat: 9:00 — 13:00 EAT<br/>Sun: Closed</p>
</div>


<div className="bg-white border rounded p-4">
<h3 className="font-semibold">Follow us</h3>
<div className="mt-2 flex flex-col gap-2 text-sm">
<a href="#" className="underline">Facebook</a>
<a href="#" className="underline">YouTube</a>
<a href="#" className="underline">Twitter / X</a>
</div>
</div>
</aside>
</div>


<div className="mt-10 text-xs text-slate-500">We aim to respond within 2 business days. This contact form is for general enquiries — for urgent pastoral care please call the office.</div>
</div>
</section>
)
}