import { fetchChurches } from '../../lib/api'


export const revalidate = 60 // ISR: updates every minute
// To switch to SSR: uncomment the next line
// export const dynamic = 'force-dynamic'


export default async function ChurchesPage(){
const churches = await fetchChurches()


return (
<section>
<h2 className="text-2xl font-bold mb-4">Churches</h2>
<ul className="space-y-3">
{churches.map((c: any) => (
<li key={c.id} className="p-3 border rounded">
<h3 className="font-semibold">{c.name}</h3>
<p className="text-sm">{c.address} — Pastor: {c.pastor}</p>
</li>
))}
</ul>
</section>
)
}