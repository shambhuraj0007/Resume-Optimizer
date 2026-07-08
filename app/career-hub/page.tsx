import Link from 'next/link';
import { THEME_LABELS } from '@/lib/career-hub';

const themes = [
    { slug: 'interview-preparation', icon: '🎯', desc: 'Top questions, sample answers & tips for every role.' },
    { slug: 'salary-insights', icon: '💰', desc: 'Real salary ranges by level, city & company type.' },
    { slug: 'resume-tips', icon: '📄', desc: 'ATS-friendly tips with section-by-section guides.' },
    { slug: 'career-growth', icon: '🚀', desc: 'Step-by-step roadmaps from fresher to senior.' },
    { slug: 'job-market-trends', icon: '📈', desc: 'What skills are hot, what\'s cooling, and why.' },
];

export default function CareerHubLanding() {
    return (
        <main className="relative min-h-screen bg-gray-950 text-gray-50 overflow-hidden selection:bg-indigo-500/30">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500 via-cyan-500 to-transparent blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">

                {/* Hero Section */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <span className="flex w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
                        Your Ultimate Career Advantage
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6">

                        <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            Career Hub
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                        Everything you need to land the job, grow your trajectory, and negotiate exactly what you're worth.
                    </p>
                </div>

                {/* 5-Card Balanced Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-24">
                    {themes.map((t, index) => (
                        <Link
                            key={t.slug}
                            href={`/career-hub/${t.slug}`}
                            /* Top 3 cards span 2 columns each (2+2+2=6). Bottom 2 cards span 3 columns each (3+3=6). Perfectly balanced. */
                            className={`group relative rounded-3xl p-[1px] bg-gradient-to-b from-gray-800 to-gray-900 hover:from-indigo-500 hover:to-cyan-500 transition-all duration-500 ${index < 3 ? 'lg:col-span-2' : 'lg:col-span-3'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:to-cyan-500/10 transition-colors duration-500 rounded-3xl" />

                            <div className="relative h-full bg-gray-950/90 backdrop-blur-xl rounded-[23px] p-8 flex flex-col items-start transition-transform duration-500 group-hover:-translate-y-1">
                                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 mb-6 text-2xl group-hover:scale-110 group-hover:border-indigo-500/30 transition-all duration-300">
                                    {t.icon}
                                </div>

                                <h2 className="text-xl font-bold text-gray-100 mb-3 group-hover:text-indigo-300 transition-colors">
                                    {THEME_LABELS[t.slug] || t.slug}
                                </h2>

                                <p className="text-gray-400 leading-relaxed mb-6 flex-grow">
                                    {t.desc}
                                </p>

                                <div className="flex items-center text-sm font-semibold text-indigo-400 group-hover:text-cyan-400 mt-auto transition-colors">
                                    Explore category
                                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Elevated CTA Block */}
                <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gray-900/50 backdrop-blur-sm p-10 sm:p-16 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to level up your profile?</h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                            Stop guessing what recruiters want. Build a data-driven, ATS-optimized resume in minutes for free.
                        </p>
                        <a
                            href="https://shortlistai.cv"
                            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-gray-950"
                        >
                            Try ShortlistAI Free
                            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </a>
                    </div>
                </div>

            </div>
        </main>
    );
}