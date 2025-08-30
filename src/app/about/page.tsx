// app/about/page.tsx
// About page for PCOF: mission, history, beliefs, leadership hierarchy, contact and CTAs.
// Server component (App Router) — static-first (ISR) but ready for SSR if desired.


import Link from 'next/link'
import LeaderCard from '@/components/LeaderCard'
import { fetchLeadership } from '@/lib/api'


export const revalidate = 3600 // refresh every hour
// export const dynamic = 'force-dynamic' // enable for live DB-backed content


export default async function AboutPage(){
const leadership = (await fetchLeadership().catch(() => [])) || []


return (
<main className="py-12">
<div className="container mx-auto">
{/* HERO */}
<header className="mb-8 text-center">
<h1 className="text-3xl font-bold">About Pentecostal Church One Faith (PCOF)</h1>
<p className="mt-3 text-lg text-slate-700 max-w-3xl mx-auto">PCOF is a fellowship of churches united to proclaim the Gospel, serve communities, and disciple believers through worship, teaching and outreach.</p>
<div className="mt-6 flex justify-center gap-3">
<Link href="/churches" className="px-4 py-2 bg-sky-600 text-white rounded">Find a Church</Link>
<Link href="/donate" className="px-4 py-2 border rounded">Give / Support</Link>
</div>
</header>


{/* SUMMARY CARDS */}
<section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
<div className="p-4 border rounded">
<div className="text-sm text-slate-500">Mission</div>
<div className="font-semibold mt-1">Make disciples & serve the community</div>
<p className="text-sm text-slate-600 mt-2">We are committed to evangelism, discipleship and compassionate outreach.</p>
</div>


<div className="p-4 border rounded">
<div className="text-sm text-slate-500">Vision</div>
<div className="font-semibold mt-1">A unified, Spirit-filled movement</div>
<p className="text-sm text-slate-600 mt-2">To see transformed lives, flourishing churches and renewed communities.</p>
</div>


<div className="p-4 border rounded">
<div className="text-sm text-slate-500">Core Values</div>
<div className="font-semibold mt-1">Prayer, Compassion, Service</div>
<p className="text-sm text-slate-600 mt-2">Faith in action through worship, teaching and serving.</p>
</div>
</section>


{/* HISTORY & BELIEFS */}
<section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
<div className="bg-white border rounded p-6">
<h2 className="text-xl font-semibold mb-3">Our History</h2>
<p className="text-sm text-slate-700">Founded to bring congregations together for mutual encouragement and coordinated outreach, PCOF has grown through local church planting, community programs and training leaders across regions.</p>
<p className="text-sm text-slate-700 mt-3">We maintain a commitment to sound biblical teaching, pastoral care, and serving the vulnerable in society.</p>
</div>


<div className="bg-white border rounded p-6">
<h2 className="text-xl font-semibold mb-3">What We Believe (summary)</h2>
<ul className="list-disc pl-5 text-sm text-slate-700">
<li>We affirm the authority of Scripture and the centrality of Christ.</li>
<li>We practice prayerful, Spirit-led worship.</li>
<li>We pursue discipleship and missional living.</li>
<li>We support church planting, evangelism and compassionate outreach.</li>
</ul>
</div>
</section>


{/* LEADERSHIP */}
<section className="mb-10">
<h2 className="text-2xl font-bold mb-4">Leadership & Administration</h2>
<p className="text-sm text-slate-600 mb-4">Meet the leadership team that guides PCOF — from the Archbishop to regional leaders and administrative staff.</p>


<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
{leadership.map((l: any) => (
<LeaderCard key={l.id} leader={l} />
))}
</div>


<div className="mt-6 text-sm text-slate-600">If you are a church leader and need to update your profile, please <Link href="/contact" className="underline">contact the office</Link>.</div>
</section>


{/* ADMIN HIERARCHY (simplified tree) */}
<section className="mb-12">
<h3 className="text-xl font-semibold mb-3">Organizational Structure</h3>
<div className="bg-white border rounded p-6">
<ol className="list-decimal pl-5 text-sm text-slate-700">
<li><strong>Archbishop / President</strong> — spiritual & organizational head</li>
<li><strong>General Secretary</strong> — oversees operations, communications, and admin</li>
<li><strong>Treasurer</strong> — finances, donations oversight, compliance</li>
<li><strong>Regional Bishops / Coordinators</strong> — supervise clusters of churches</li>
<li><strong>Pastors & Local Leaders</strong> — lead local congregations and ministries</li>
</ol>


<p className="text-sm text-slate-600 mt-4">Each role may have deputies and committees — contact the office for full governance documents and bylaws.</p>
</div>
</section>


{/* CONTACT + CTA */}
<section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
<div className="bg-white border rounded p-6">
<h4 className="font-semibold">Office & Contact</h4>
<p className="text-sm text-slate-700 mt-2">PCOF Headquarters<br/>123 Faith Avenue<br/>Nairobi, Kenya</p>
<p className="text-sm text-slate-700 mt-2">Email: <a href="mailto:office@pcof.org" className="underline">office@pcof.org</a><br/>Phone: <a href="tel:+254700000000" className="underline">+254 700 000 000</a></p>
</div>


<div className="bg-white border rounded p-6">
<h4 className="font-semibold">Get involved</h4>
<p className="text-sm text-slate-700 mt-2">Join a ministry, volunteer in outreach or support PCOF through giving.</p>
<div className="mt-4 flex gap-3">
<Link href="/volunteer" className="px-4 py-2 border rounded">Volunteer</Link>
<Link href="/donate" className="px-4 py-2 bg-emerald-600 text-white rounded">Give</Link>
</div>
</div>
</section>


{/* FOOTER NOTE */}
<div className="text-xs text-slate-500">PCOF is registered as a not-for-profit organization. For governance, privacy, and data protection policies contact the office.</div>
</div>
</main>
)
}