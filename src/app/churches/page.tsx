// app/churches/page.tsx (Server component)
import ChurchesList from '@/components/ChurchesList'
import { fetchChurches } from '../../lib/api'

export const revalidate = 60 // ISR: update once a minute

export default async function ChurchesPage() {
  const churches = await fetchChurches() || []

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-3 flex items-center justify-center gap-2">
            <span className="text-sky-600">⛪</span> Our Churches
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find a PCOF church near you — browse by location, language, and service time.
          </p>
        </header>

        {/* interactive client list */}
        <ChurchesList initialChurches={churches} />
      </div>
    </section>
  )
}