// app/churches/page.tsx (Server component)
import ChurchesList from '@/components/ChurchesList'
import { fetchChurches } from '../../lib/api'

export const revalidate = 60 // ISR: update once a minute

// If you want true server-side search later, you can do:
// export const dynamic = 'force-dynamic'

export default async function ChurchesPage() {
  const churches = await fetchChurches() || []

  return (
    <section className="py-8">
      <div className="container mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Our Churches</h1>
          <p className="text-sm text-slate-600 mt-2">
            Find a PCOF church near you — browse by location, language, and service time.
          </p>
        </header>

        {/* interactive client list */}
        <ChurchesList initialChurches={churches} />
      </div>
    </section>
  )
}
