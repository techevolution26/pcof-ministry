// app/about/page.tsx
import Link from 'next/link'
// import LeaderCard from '@/components/LeaderCard'
import LeaderGrid from '@/components/LeaderGrid'
import { fetchLeadership } from '@/lib/api'
import Image from 'next/image'

export const revalidate = 3600 // refresh every hour

export default async function AboutPage() {
    const leadership = (await fetchLeadership().catch(() => [])) || []

    return (
        <main className="py-12">
            <div className="container mx-auto px-4">
                {/* HERO */}
                <header className="mb-12 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 flex items-center justify-center bg-green-50 rounded-full border border-green-100">
                            <Image src="/pcof.jpeg" alt="PCOF Logo" width={60} height={60} className="rounded-full" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-2">
                        <span className="text-sky-600">⛪</span> About Pentecostal Church One Faith (PCOF)
                    </h1>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                        PCOF is a fellowship of churches united to proclaim the Gospel, serve communities, and disciple believers through worship, teaching and outreach.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/churches" className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-full font-medium shadow-md hover:bg-sky-700 transition-colors">
                            <span>🔍</span> Find a Church
                        </Link>
                        <Link href="/donate" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-full font-medium hover:bg-green-50 transition-colors">
                            <span>💝</span> Give / Support
                        </Link>
                    </div>
                </header>

                {/* SUMMARY CARDS */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                        <div className="text-sm text-slate-500 mb-2 flex items-center gap-1">
                            <span>🎯</span> Mission
                        </div>
                        <div className="font-bold text-lg text-slate-800 mb-3">Make disciples & serve the community</div>
                        <p className="text-slate-600">Our mission is to make a difference in the lives of people by connecting them with a transforming
                            experience of the Grace of Jesus Christ through worship, evangelism, discipleship and fellowship.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                        <div className="text-sm text-slate-500 mb-2 flex items-center gap-1">
                            <span>👁️</span> Vision
                        </div>
                        <div className="font-bold text-lg text-slate-800 mb-3">A unified, Spirit-filled movement</div>
                        <p className="text-slate-600">To be truly Apostolic in our love towards Jesus Christ and His Word with a sincere burden for others
                            in principals, practice, power and purpose.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                        <div className="text-sm text-slate-500 mb-2 flex items-center gap-1">
                            <span>💖</span> Core Values
                        </div>
                        <div className="font-bold text-lg text-slate-800 mb-3">Prayer, Compassion, Service</div>
                        <p className="text-slate-600">Faith in action through worship, teaching and serving.</p>
                    </div>
                </section>

                {/* HISTORY & BELIEFS */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-sky-600">📜</span> Our History
                        </h2>
                        <p className="text-slate-700 mb-4">
                            Founded to bring congregations together for mutual encouragement and coordinated outreach, PCOF has grown through local church planting, community programs and training leaders across regions.
                        </p>
                        <p className="text-slate-700">
                            We maintain a commitment to sound biblical teaching, pastoral care, and serving the vulnerable in society.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-sky-600">✝️</span> What We Believe
                        </h2>
                        <ul className="space-y-3 text-slate-700">
                            <li className="flex items-start gap-2">
                                <span className="text-sky-600 mt-1">•</span>
                                We affirm the authority of Scripture and the centrality of Christ.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-600 mt-1">•</span>
                                We practice prayerful, Spirit-led worship.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-600 mt-1">•</span>
                                We pursue discipleship and missional living.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-600 mt-1">•</span>
                                We support church planting, evangelism and compassionate outreach.
                            </li>
                        </ul>
                    </div>
                </section>

                {/* LEADERSHIP */}
                <section className="mb-12">
                    <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="text-sky-600">👥</span> Leadership & Administration
                    </h2>
                    <p className="text-lg text-slate-600 mb-8 max-w-3xl">
                        Meet the leadership team that guides PCOF — from the Archbishop to regional leaders and administrative staff.
                    </p>

                    <div className="space-y-6">
                        <LeaderGrid initialLeadership={leadership} perPage={3} />
                    </div>

                    <div className="mt-8 text-sm text-slate-600 bg-green-50 p-4 rounded-lg">
                        If you are a church leader and need to update your profile, please <Link href="/contact" className="text-sky-600 hover:text-sky-700 underline">contact the office</Link>.
                    </div>
                </section>

                {/* ADMIN HIERARCHY (simplified tree) */}
                <section className="mb-12">
                    <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="text-sky-600">🏛️</span> Organizational Structure
                    </h3>
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                        <ol className="space-y-4 text-slate-700">
                            <li className="flex items-start gap-3">
                                <span className="bg-sky-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                                <div>
                                    <strong>Archbishop / President</strong> — spiritual & organizational head
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-sky-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                                <div>
                                    <strong>General Secretary</strong> — oversees operations, communications, and admin
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-sky-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                                <div>
                                    <strong>Treasurer</strong> — finances, donations oversight, compliance
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-sky-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">4</span>
                                <div>
                                    <strong>Regional Bishops / Coordinators</strong> — supervise clusters of churches
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-sky-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">5</span>
                                <div>
                                    <strong>Pastors & Local Leaders</strong> — lead local congregations and ministries
                                </div>
                            </li>
                        </ol>

                        <p className="text-sm text-slate-600 mt-6 p-4 bg-green-50 rounded-lg">
                            Each role may have deputies and committees — contact the office for full governance documents and bylaws.
                        </p>
                    </div>
                </section>

                {/* CONTACT + CTA */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                        <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-sky-600">📞</span> Office & Contact
                        </h4>
                        <div className="space-y-3 text-slate-700">
                            <p className="flex items-start gap-2">
                                <span className="text-sky-600 mt-1">📍</span>
                                PCOF Headquarters<br />
                                B8 Kilifi-Malindi Road<br />
                                Matsangoni,Kenya
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-sky-600 mt-1">✉️</span>
                                Email: <a href="mailto:office@pcof.org" className="text-sky-600 hover:text-sky-700 underline">office@pcof.org</a>
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-sky-600 mt-1">📱</span>
                                Phone: <a href="tel:+254700000000" className="text-sky-600 hover:text-sky-700 underline">+254 722 880 683/ 0711808071</a>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                        <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-sky-600">🤝</span> Get involved
                        </h4>
                        <p className="text-slate-700 mb-6">
                            Join a ministry, volunteer in outreach or support PCOF through giving.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/volunteer" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-full font-medium hover:bg-green-50 transition-colors">
                                <span>👥</span> Volunteer
                            </Link>
                            <Link href="/donate" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors">
                                <span>💝</span> Give
                            </Link>
                        </div>
                    </div>
                </section>

                {/* FOOTER NOTE */}
                <div className="text-sm text-slate-500 bg-white rounded-2xl shadow-md p-4 border border-green-100 text-center">
                    PCOF is registered as a not-for-profit organization. For governance, privacy, and data protection policies contact the office.
                </div>
            </div>
        </main>
    )
}