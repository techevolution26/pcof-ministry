import { fetchEvents } from '../../lib/api'
export const revalidate = 120


export default async function EventsPage(){
const events = await fetchEvents()


return (
<section>
<h2 className="text-2xl font-bold mb-4">Events</h2>
<ul className="space-y-3">
{events.map((e: any) => (
<li key={e.id} className="p-3 border rounded">
<strong>{e.title}</strong>
<div className="text-sm">{new Date(e.startsAt).toLocaleString()}</div>
<div className="text-sm">{e.location}</div>
</li>
))}
</ul>
</section>
)
}