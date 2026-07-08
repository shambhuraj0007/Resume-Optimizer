'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PostData } from '@/lib/career-hub-shared';
import { Button } from '@/components/ui/button';
import { ChevronRight, Target } from 'lucide-react';

interface Props {
    post: PostData;
}

/**
 * Shared renderer for the rich content structure used across
 * career-growth, interview-prep, salary-insights, and resume-templates.
 *
 * Renders: quick_answer, intro_paragraph, growth_sections (with subsections),
 * examples, FAQ accordion, secondary_keywords, final_cta, internal_links.
 */
export default function RichContentRenderer({ post }: Props) {
    const quickAnswer = post.quick_answer;
    const sections = post.growth_sections ?? [];
    const examples = post.examples ?? [];
    const faq = post.faq ?? [];
    const finalCta = post.final_cta;
    const internalLinks = post.internal_links ?? [];

    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    return (
        <>
            {/* Quick Answer Box */}
            {/* Quick Answer Box */}
            {/* Sleek ATS Score Banner */}
            {/* Sleek ATS Score Banner */}
            <div className="relative w-full my-10 group/ats">
                {/* Animated Glowing Border Effect */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-2xl blur-[2px] opacity-40 group-hover/ats:opacity-75 transition-opacity duration-500" />

                {/* Main Compact Box */}
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 px-6 py-5 bg-[#0B0D14] rounded-2xl border border-white/5 overflow-hidden">

                    {/* Subtle internal glass flare */}
                    <div className="absolute top-0 left-1/4 w-1/2 h-full bg-purple-500/10 blur-3xl pointer-events-none" />

                    {/* Left Side: Teaser Text & Icon */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 z-10 w-full sm:w-auto text-left">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner">
                            <Target className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-base sm:text-lg tracking-tight m-0">
                                Stop guessing what recruiters want.
                            </h3>
                            <p className="text-slate-400 text-sm mt-0.5">
                                Get your exact ATS match score in seconds.
                            </p>
                        </div>
                    </div>

                    {/* Right Side: The Button */}
                    <Link href="/ats-checker" className="z-10 w-full sm:w-auto shrink-0">
                        <Button
                            className="w-full sm:w-auto group flex items-center justify-center gap-2 h-11 px-7 bg-white text-slate-900 hover:bg-purple-50 font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.5)] border-2 border-transparent hover:border-purple-200"
                        >
                            <span>Check Your ATS Score</span>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>

            {quickAnswer && (
                <section className="mb-14">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-white">Quick Answer</h2>
                            </div>
                            <p className="text-gray-300 leading-relaxed mb-5">{quickAnswer.summary}</p>
                            {quickAnswer.bullets && quickAnswer.bullets.length > 0 && (
                                <ul className="space-y-2.5">
                                    {quickAnswer.bullets.map((b, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                            <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Intro Paragraph */}
            {post.intro_paragraph && (
                <section className="mb-14">
                    <p className="text-lg text-gray-300 leading-relaxed">{post.intro_paragraph}</p>
                </section>
            )}

            {/* Markdown body (if any) */}
            {post.contentHtml && post.contentHtml.trim() !== '' && (
                <div
                    className="prose prose-invert prose-lg prose-indigo max-w-none mb-16 text-gray-400 leading-relaxed prose-headings:text-gray-100 prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-strong:text-gray-200"
                    dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                />
            )}

            {/* Structured Sections */}
            {sections.length > 0 && (
                <div className="mb-16 space-y-12">
                    {sections.map((section, i) => (
                        <section key={i} className="relative">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mt-0.5">
                                    {i + 1}
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                    {section.heading}
                                </h2>
                            </div>

                            {section.paragraphs && section.paragraphs.length > 0 && (
                                <div className="ml-13 space-y-3 mb-4">
                                    {section.paragraphs.map((p, j) => (
                                        <p key={j} className="text-gray-300 leading-relaxed">{p}</p>
                                    ))}
                                </div>
                            )}

                            {section.bullets && section.bullets.length > 0 && (
                                <ul className="ml-13 space-y-2.5 mb-4">
                                    {section.bullets.map((b, j) => (
                                        <li key={j} className="flex items-start gap-3 text-gray-300">
                                            <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {section.subsections && section.subsections.length > 0 && (
                                <div className="ml-13 mt-6 space-y-6">
                                    {section.subsections.map((sub, k) => (
                                        <div key={k} className="pl-5 border-l-2 border-indigo-500/20">
                                            <h3 className="text-lg font-semibold text-white mb-3">
                                                {sub.heading || sub.subheading}
                                            </h3>
                                            {sub.paragraphs && sub.paragraphs.map((p, j) => (
                                                <p key={j} className="text-gray-400 leading-relaxed mb-2">{p}</p>
                                            ))}
                                            {sub.bullets && sub.bullets.length > 0 && (
                                                <ul className="space-y-2 mt-2">
                                                    {sub.bullets.map((b, j) => (
                                                        <li key={j} className="flex items-start gap-3 text-sm text-gray-400">
                                                            <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-gray-600" />
                                                            {b}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            )}

            {/* Real-World Examples */}
            {examples.length > 0 && (
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Real-World Examples</h2>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        {examples.map((ex, i) => (
                            <div
                                key={i}
                                className="group relative rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-cyan-500/30 p-6 transition-all duration-300 hover:bg-gray-900/80 hover:shadow-lg hover:shadow-cyan-500/5"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-cyan-500/40 to-emerald-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {ex.label && <h3 className="text-base font-bold text-cyan-300 mb-3">{ex.label}</h3>}
                                <p className="text-sm text-gray-400 leading-relaxed">{ex.body}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* FAQ Accordion */}
            {faq.length > 0 && (
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
                    </div>
                    <div className="flex flex-col gap-4">
                        {faq.map((item, i) => {
                            const isOpen = openFaqIndex === i;
                            return (
                                <div
                                    key={i}
                                    className={`group relative rounded-2xl transition-all duration-300 ${isOpen
                                        ? 'bg-gray-900/80 border-amber-500/40 shadow-lg shadow-amber-500/5'
                                        : 'bg-gray-900/30 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
                                        } border backdrop-blur-sm overflow-hidden`}
                                >
                                    <button
                                        onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                                        className="w-full text-left flex items-center justify-between gap-6 p-6 focus:outline-none"
                                    >
                                        <span className={`text-base sm:text-lg font-semibold transition-colors duration-200 ${isOpen ? 'text-amber-100' : 'text-gray-200 group-hover:text-white'}`}>
                                            {item.question}
                                        </span>
                                        <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isOpen ? 'bg-amber-500/20 text-amber-400 rotate-180' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'}`}>
                                            <svg className="w-5 h-5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M20 12H4" : "M12 4v16m8-8H4"} />
                                            </svg>
                                        </div>
                                    </button>
                                    <div
                                        className="grid transition-all duration-300 ease-in-out"
                                        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="px-6 pb-6 pt-2">
                                                <div className="h-px w-full bg-gradient-to-r from-gray-800 via-gray-800 to-transparent mb-4" />
                                                <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Secondary Keywords */}
            {post.secondary_keywords && post.secondary_keywords.length > 0 && (
                <section className="mb-14">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Related Topics</h3>
                    <div className="flex flex-wrap gap-2">
                        {post.secondary_keywords.map((kw, i) => (
                            <span key={i} className="bg-gray-900/60 border border-gray-800 text-gray-400 text-xs px-3 py-1.5 rounded-full">
                                {kw}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Final CTA */}
            {finalCta && (
                <section className="mb-16">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/5 border border-indigo-500/20 p-8 sm:p-10 text-center">
                        <div className="absolute -top-10 -right-10 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl" />
                        <div className="relative">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{finalCta.heading}</h2>
                            <p className="text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed">{finalCta.paragraph}</p>
                            {finalCta.primary_button_label && finalCta.primary_button_target && (
                                <Link
                                    href={finalCta.primary_button_target}
                                    className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                                >
                                    {finalCta.primary_button_label}
                                </Link>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Internal Links */}
            {internalLinks.length > 0 && (
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Explore More</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {internalLinks.map((link, i) => (
                            <Link
                                key={i}
                                href={link.target}
                                className="group flex items-center justify-between gap-4 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/30 p-5 transition-all duration-300 hover:bg-gray-900/80 hover:shadow-lg hover:shadow-purple-500/5"
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

        </>
    );
}
