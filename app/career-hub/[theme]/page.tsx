import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllThemes, getAllPosts, THEME_LABELS } from '@/lib/career-hub';

interface Props {
    params: { theme: string };
}

export async function generateStaticParams() {
    return getAllThemes().map((theme) => ({ theme }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const label = THEME_LABELS[params.theme];
    if (!label) return {};
    return {
        title: `${label} — Career Hub | ShortlistAI`,
        description: `Browse all ${label} articles on ShortlistAI Career Hub.`,
        alternates: { canonical: `https://shortlistai.cv/career-hub/${params.theme}/` },
    };
}

export default function ThemeListPage({ params }: Props) {
    const { theme } = params;
    const label = THEME_LABELS[theme];
    if (!label) notFound();

    const posts = getAllPosts(theme);

    return (
        <main className="relative min-h-screen bg-gray-950 text-gray-50 overflow-hidden selection:bg-indigo-500/30">
            {/* Ambient Background Glow (Top Right for variation) */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-10 pointer-events-none translate-x-1/3 -translate-y-1/3">
                <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500 via-cyan-500 to-transparent blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 lg:pt-10 lg:pb-20">

                {/* Navigation & Header */}
                <div className="mb-16">


                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight ">
                        <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            {label}
                        </span>
                    </h1>
                </div>

                {/* Article Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {posts.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/career-hub/${theme}/${post.slug}`}
                            className="group relative rounded-3xl p-[1px] bg-gradient-to-b from-gray-800 to-gray-900 hover:from-indigo-500 hover:to-cyan-500 transition-all duration-500"
                        >
                            {/* Inner Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:to-cyan-500/10 transition-colors duration-500 rounded-3xl" />

                            {/* Card Content Layer */}
                            <div className="relative h-full bg-gray-950/90 backdrop-blur-xl rounded-[23px] p-8 flex flex-col items-start transition-transform duration-500 group-hover:-translate-y-1">

                                <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-3 group-hover:text-indigo-300 transition-colors">
                                    {post.title}
                                </h2>

                                {post.description && (
                                    <p className="text-gray-400 leading-relaxed mb-8 flex-grow line-clamp-3">
                                        {post.description}
                                    </p>
                                )}

                                {/* Animated Read More */}
                                <div className="flex items-center text-sm font-semibold text-indigo-400 group-hover:text-cyan-400 mt-auto transition-colors">
                                    Read article
                                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Empty State Fallback */}
                {posts.length === 0 && (
                    <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800">
                        <p className="text-gray-400 text-lg">New resources are being added to this section soon.</p>
                    </div>
                )}
            </div>
        </main>
    );
}