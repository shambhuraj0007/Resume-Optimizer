'use client';

import { Breadcrumbs } from './shared';
import RichContentRenderer from './RichContentRenderer';
import type { PostData } from '@/lib/career-hub-shared';

interface Props {
    post: PostData;
}

export default function GrowthPage({ post }: Props) {
    const roadmap = post.roadmap ?? [];

    return (
        <main className="relative min-h-screen bg-gray-950 text-gray-50 overflow-hidden selection:bg-indigo-500/30">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500 to-transparent blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                <Breadcrumbs theme={post.theme} slug={post.slug} title={post.title} />

                {/* Header */}
                <header className="mb-14 mt-1">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                        <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            {post.h1 || post.title}
                        </span>
                    </h1>

                    {post.author && (
                        <p className="text-sm text-gray-500 mb-2">By {post.author}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-300">
                        {post.target_role && (
                            <span className="bg-gray-900/80 border border-gray-800 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                                Target: {post.target_role}
                            </span>
                        )}
                        {post.primary_keyword && (
                            <span className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm text-emerald-300">
                                {post.primary_keyword}
                            </span>
                        )}
                    </div>
                </header>

                {/* Shared rich content renderer */}
                <RichContentRenderer post={post} />

                {/* Career Roadmap (legacy roadmap field — only career-growth) */}
                {roadmap.length > 0 && (
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Career Roadmap</h2>
                        </div>
                        <div className="relative pl-8 border-l-2 border-emerald-500/30 flex flex-col gap-0">
                            {roadmap.map((step, i) => (
                                <div key={i} className="relative pb-10 last:pb-0">
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-emerald-600 border-2 border-emerald-400 flex items-center justify-center">
                                        <span className="text-[9px] font-bold text-white">{i + 1}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <h3 className="text-lg font-semibold text-white">{step.milestone}</h3>
                                        <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                            {step.timeline}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {step.skills.map((skill, j) => (
                                            <span key={j} className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full border border-gray-700">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
