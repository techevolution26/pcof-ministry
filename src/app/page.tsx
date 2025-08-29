import Link from 'next/link'


export const revalidate = 3600 // ISR: revalidate every hour (still static by default)


export default function Home(){
return (
<section>
<h2 className="text-3xl font-bold mb-4">Welcome to the Pentecostal Church One Faith Ministry-PCOF</h2>
<p className="mb-6">Here is where we share our common faith in Christ, by Compassion, Love, and Service to our community and the world</p>


<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<Link href="/churches" className="p-4 border rounded">Churches</Link>
<Link href="/sermons" className="p-4 border rounded">Sermons</Link>
<Link href="/events" className="p-4 border rounded">Events</Link>
</div>
</section>
)
}