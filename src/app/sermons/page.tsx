import { fetchSermons } from '../../lib/api'


export const revalidate = 300 // revalidate every 5 minutes


export default async function SermonsPage(){
const sermons = await fetchSermons()


return (
<section>
<h2 className="text-2xl font-bold mb-4">Sermons</h2>
<ul className="space-y-4">
{sermons.map((s: any) => (
<li key={s.id} className="border p-3 rounded">
<h3 className="font-semibold">{s.title}</h3>
<p className="text-sm">{s.speaker} — {new Date(s.date).toLocaleDateString()}</p>
</li>
))}
</ul>
</section>
)
}