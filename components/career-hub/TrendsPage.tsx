import Link from 'next/link';
import { Breadcrumbs, CTABlock } from './shared';
import type { PostData } from '@/lib/career-hub-shared';

// Premium styling config for demand trends with dynamic icons and glows
const TREND_CONFIG: Record<string, { badge: string; cardHover: string; icon: JSX.Element }> = {
    rising: {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.2)]',
        cardHover: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        )
    },
    stable: {
        badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_-2px_rgba(99,102,241,0.2)]',
        cardHover: 'hover:border-indigo-500/40 hover:bg-indigo-500/5',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
            </svg>
        )
    },
    cooling: {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_-2px_rgba(245,158,11,0.2)]',
        cardHover: 'hover:border-amber-500/40 hover:bg-amber-500/5',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
            </svg>
        )
    },
};

// Extended interface to include top_cities just in case your JSON provides it
interface Props {
    post: PostData & { top_cities?: string[] };
}

export default function TrendsPage({ post }: Props) {
    const keyStats = post.key_stats ?? [];
    const trendingSkills = post.trending_skills ?? [];

    // If your JSON doesn't generate this yet, it falls back gracefully or uses defaults for preview
    const topCities = post.top_cities ?? ['Bangalore', 'Hyderabad', 'Pune', 'Gurugram', 'Remote'];

    return (
        <main className="relative min-h-screen bg-gray-950 text-gray-50 overflow-hidden selection:bg-indigo-500/30">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[400px] opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500 via-cyan-500 to-transparent blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                <Breadcrumbs theme={post.theme as string} slug={post.slug as string} title={post.title as string} />

                {/* Header Section */}
                <header className="mb-12 mt-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                        <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            {post.title as string}
                        </span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-300">
                        {post.industry && (
                            <span className="bg-gray-900/80 border border-gray-800 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                                {post.industry as string}
                            </span>
                        )}
                        {post.region && (
                            <span className="bg-gray-900/80 border border-gray-800 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                                {post.region as string}
                            </span>
                        )}
                        {post.year && (
                            <span className="bg-gray-900/80 border border-indigo-500/30 text-indigo-300 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                                {post.year as string} Forecast
                            </span>
                        )}
                    </div>
                </header>

                {/* Intro Content */}
                <div
                    className="prose prose-invert prose-lg prose-indigo max-w-none mb-16 text-gray-400 leading-relaxed prose-headings:text-gray-100 prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-strong:text-gray-200"
                    dangerouslySetInnerHTML={{ __html: post.contentHtml as string }}
                />

                {/* Key Stats Grid */}
                {keyStats.length > 0 && (
                    <section className="mb-16 relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">📊</span>
                            Market Overview
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {keyStats.map((s, i) => (
                                <div key={i} className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-5 text-center hover:border-indigo-500/40 hover:bg-gray-900 transition-all duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-cyan-500/0 group-hover:from-indigo-500/5 group-hover:to-cyan-500/5 rounded-2xl transition-colors" />
                                    <div className="relative">
                                        <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
                                            {s.value}
                                        </div>
                                        <div className="text-gray-400 text-sm font-medium leading-snug">{s.metric}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Skills (Upgraded Grid) */}
                {trendingSkills.length > 0 && (
                    <section className="mb-16 relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">⚡</span>
                            Trending Skills Matrix
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trendingSkills.map((skill, i) => {
                                const config = TREND_CONFIG[skill.demand] ?? TREND_CONFIG.stable;
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl px-5 py-4 transition-all duration-300 ${config.cardHover}`}
                                    >
                                        <span className="font-semibold text-gray-200">{skill.name}</span>
                                        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${config.badge}`}>
                                            {config.icon}
                                            {skill.demand}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Top Hiring Cities (New Section) */}
                {topCities && topCities.length > 0 && (
                    <section className="mb-20 relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </span>
                            Top Hiring Hubs
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {topCities.map((city, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 px-5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:border-indigo-500/50 hover:bg-gray-800/80 transition-all cursor-default"
                                >
                                    <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">{city}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Internal Links */}
                {post.internal_links && post.internal_links.length > 0 && (
                    <section className="mb-16 relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">🔗</span>
                            Explore More
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {post.internal_links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.target}
                                    className="group flex items-center justify-between gap-4 rounded-xl bg-gray-900/40 backdrop-blur-md border border-gray-800 hover:border-purple-500/30 p-5 transition-all duration-300 hover:bg-gray-900/60 hover:shadow-lg hover:shadow-purple-500/5"
                                >
                                    <span className="text-sm font-medium text-gray-300 group-hover:text-purple-300 transition-colors">
                                        {link.label}
                                    </span>
                                    <svg className="shrink-0 w-4 h-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <CTABlock text="Make sure your resume highlights in-demand skills →" />
            </div>
        </main>
    );
}