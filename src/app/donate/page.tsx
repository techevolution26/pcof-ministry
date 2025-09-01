// app/donate/page.tsx
import DonateForm from '@/components/DonateForm'
import Link from 'next/link'
import { fetchChurches, fetchSermons } from '@/lib/api'
import Image from 'next/image'

export const revalidate = 3600

export default async function DonatePage() {
  const [churches, sermons] = await Promise.all([
    fetchChurches().catch(() => []),
    fetchSermons().catch(() => []),
  ])

  const totalChurches = Array.isArray(churches) ? churches.length : '—'
  const totalSermons = Array.isArray(sermons) ? sermons.length : '—'

  return (
    <main className="py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center bg-green-50 rounded-full border border-green-100">
              <Image src="/pcof.jpeg" alt="PCOF Logo" width={60} height={60} className="rounded-full" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Support PCOF Ministry</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your gift helps us run outreach programs, support pastors, and serve vulnerable communities.
          </p>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-green-100">
            <div className="text-3xl font-bold text-sky-700 mb-2">{totalChurches}</div>
            <div className="text-sm text-slate-600">Churches Supported</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-green-100">
            <div className="text-3xl font-bold text-sky-700 mb-2">{totalSermons}</div>
            <div className="text-sm text-slate-600">Sermons Published</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-green-100">
            <div className="text-3xl font-bold text-sky-700 mb-2">100+</div>
            <div className="text-sm text-slate-600">Communities Reached</div>
          </div>
        </div>

        {/* Donation Form Section */}
        <section className="bg-white rounded-2xl shadow-md p-8 mb-10 border border-green-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-sky-600">💳</span> Secure Online Giving
              </h2>
              <p className="text-slate-600 mb-6">
                Use a card to make a one-time gift or set up a monthly donation. We use industry-standard payment processors (Stripe) to keep your information safe.
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-sky-600">🎯</span>
                  <div>
                    <div className="font-medium">Suggested gifts</div>
                    <div className="text-sm text-slate-600">KES 500 / 1,000 / 5,000</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-sky-600">🎯</span>
                  <div>
                    <div className="font-medium">Use your gift for</div>
                    <div className="text-sm text-slate-600">General fund, Outreach, Church planting</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-green-600">🔒</span>
                <span>256-bit SSL encryption · PCI DSS compliant</span>
              </div>
            </div>

            <div className="bg-sky-50 rounded-xl p-6 border border-sky-100">
              <DonateForm currency="KES" />
            </div>
          </div>
        </section>

        {/* Bank Transfer Option */}
        <section className="bg-white rounded-2xl shadow-md p-8 mb-10 border border-green-100">
          <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-sky-600">🏦</span> Bank Transfer Option
          </h3>
          <p className="text-slate-600 mb-6">
            You can also give directly to our bank account. Please include your name and "DONATION" in the payment reference and email a screenshot to{" "}
            <a href="mailto:office@pcof.org" className="text-sky-600 hover:text-sky-700 font-medium">office@pcof.org</a> so we can issue a receipt.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-5">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-sky-600">🏛️</span> Bank Details
              </h4>
              <div className="space-y-3 text-slate-700">
                <div className="flex justify-between">
                  <span>Bank:</span>
                  <span className="font-medium">ABC Bank</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Name:</span>
                  <span className="font-medium">Pentecostal Church One Faith</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Number:</span>
                  <span className="font-medium">1234567890</span>
                </div>
                <div className="flex justify-between">
                  <span>Branch:</span>
                  <span className="font-medium">Kilifi</span>
                </div>
              </div>
            </div>

            <div className="bg-sky-50 rounded-xl p-5">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-sky-600">📝</span> Important Notes
              </h4>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-sky-600 mt-1">•</span>
                  Include "DONATION" in the reference
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-600 mt-1">•</span>
                  Email confirmation to office@pcof.org
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-600 mt-1">•</span>
                  Receipts issued within 48 hours
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white rounded-2xl shadow-md p-8 border border-green-100">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="text-sky-600">❓</span> Questions About Giving
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Receipts & Documentation</h4>
              <p className="text-slate-600 text-sm">
                All donations are tax-deductible. Official receipts are issued for all gifts over KES 1,000.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Need Assistance?</h4>
              <p className="text-slate-600 text-sm">
                For receipts, recurring gift management or gift allocation, contact{" "}
                <a href="mailto:finance@pcof.org" className="text-sky-600 hover:text-sky-700 font-medium">finance@pcof.org</a>.
              </p>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="text-green-600">🔒</span>
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="text-green-600">📋</span>
            <span>Transparent Reporting</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="text-green-600">💝</span>
            <span>Tax Deductible</span>
          </div>
        </div>
      </div>
    </main>
  )
}