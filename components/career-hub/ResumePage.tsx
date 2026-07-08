'use client';

import { Breadcrumbs } from './shared';
import RichContentRenderer from './RichContentRenderer';
import type { PostData } from '@/lib/career-hub-shared';

interface Props {
    post: PostData;
}

export default function ResumePage({ post }: Props) {
    return (
        <main className="relative min-h-screen bg-gray-950 text-gray-50 overflow-hidden selection:bg-indigo-500/30">
            {/* Background glow */}
            <div className="absolute top-0 left-1/3 w-[600px] h-[400px] opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-cyan-500 to-transparent blur-[100px] rounded-full mix-blend-screen" />
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
                        {post.primary_keyword && (
                            <span className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm text-cyan-300">
                                {post.primary_keyword}
                            </span>
                        )}
                        {post.audience && (
                            <span className="bg-gray-900/80 border border-gray-800 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                                {post.audience}
                            </span>
                        )}
                    </div>
                </header>

                {/* Shared rich content renderer */}
                <RichContentRenderer post={post} />
            </div>
        </main>
    );
}
