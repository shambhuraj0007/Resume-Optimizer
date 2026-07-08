import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Zap,
    ShieldCheck,
    Chrome,
    Layout,
    Check,
    Download
} from 'lucide-react';
// IMPORT YOUR NEW COMPONENT
import BrowserMockup from '@/components/BrowserMockup'; // Update path if needed

export const metadata: Metadata = {
    title: 'ShortlistAI - Smart Job Application Assistant',
    description: 'Optimize your resume and analyze job descriptions instantly with the ShortlistAI Chrome Extension.',
};

export default function ExtensionPage() {
    const extensionUrl = "https://chromewebstore.google.com/detail/khechfcaojdnompddcgheiioobledncn";

    return (
        <main className="flex flex-col min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">

            {/* --- Hero Section --- */}
            <section className="relative pt-5 pb-32 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

                {/* Container with margins */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">

                    {/* Headlines */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                        Beat the Bots. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            Land the Interview.
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        The Chrome extension that reads job descriptions for you. Get instant <strong>ATS match scores</strong> and resume optimization tips without leaving LinkedIn.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Button size="lg" className="h-14 px-8 text-lg font-medium rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-1" asChild>
                            <Link href={extensionUrl} target="_blank">
                                <Chrome className="mr-2 h-5 w-5" />
                                Add to Chrome - Free
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-medium rounded-full bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all" asChild>
                            <Link href="#how-it-works">
                                See how it works
                            </Link>
                        </Button>
                    </div>

                    {/* --- Browser Mockup Component --- */}
                    <BrowserMockup />

                    {/* Social Proof */}
                    <div className="mt-20 pt-10 border-t border-slate-800/50">
                        <p className="text-sm font-semibold text-slate-500 mb-8 uppercase tracking-widest">
                            Optimized for top platforms
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale mix-blend-screen">
                            <span className="text-xl font-bold font-serif text-white">LinkedIn</span>
                            <span className="text-xl font-bold font-sans text-white">Indeed</span>
                            <span className="text-xl font-bold font-mono text-white">Glassdoor</span>
                            <span className="text-xl font-bold font-serif text-white">Monster</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Value Proposition Grid --- */}
            <section className="py-24 bg-slate-900/50 border-y border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Why use ShortlistAI?</h2>
                        <p className="text-slate-400 text-lg">
                            We bridge the gap between your resume and the hiring manager's requirements.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="h-6 w-6 text-indigo-400" />}
                            title="Instant Match Score"
                            desc="Stop guessing. Know exactly how well your resume matches the job description before you hit apply."
                        />
                        <FeatureCard
                            icon={<Layout className="h-6 w-6 text-purple-400" />}
                            title="Keyword Optimization"
                            desc="Identify missing hard skills and keywords that ATS bots are programmed to look for."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="h-6 w-6 text-emerald-400" />}
                            title="Private & Secure"
                            desc="Your data is processed securely via HTTPS. We respect your privacy and never sell your data."
                        />
                    </div>
                </div>
            </section>

            {/* ... Rest of your sections (How it works, CTA, etc.) ... */}

            {/* Keeping the end of your file the same as before */}
            <section id="how-it-works" className="py-24 bg-slate-950">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* ... Your existing How It Works content ... */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-16">
                        <div className="w-full md:w-1/2">
                            <h2 className="text-3xl font-bold text-white mb-6">
                                Your personal recruiter, <br />
                                <span className="text-indigo-400">living in your browser.</span>
                            </h2>
                            <div className="space-y-8">
                                <StepRow
                                    num="1"
                                    title="Install the Extension"
                                    desc="Add to Chrome in one click. Pin it to your toolbar."
                                />
                                <StepRow
                                    num="2"
                                    title="Visit any Job Post"
                                    desc="Go to LinkedIn, Indeed, Glassdoor or any other platform. Select the Job description and right click and choose Analyze with ShortlistAI button."
                                />
                                <StepRow
                                    num="3"
                                    title="Get Insights Instantly"
                                    desc="Open the panel to see your ATS score and fix keyword gaps immediately."
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="bg-slate-950 rounded-2xl shadow-lg border border-slate-800 p-6 mb-6 transform translate-x-4 hover:translate-x-2 transition-transform duration-500">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-emerald-900/30 p-2 rounded-full border border-emerald-500/20">
                                        <Check className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <span className="font-semibold text-slate-200">Resume Analyzed</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[92%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                </div>
                            </div>

                            <div className="bg-slate-950 rounded-2xl shadow-lg border border-slate-800 p-6 transform -translate-x-4 hover:-translate-x-2 transition-transform duration-500">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-indigo-900/30 p-2 rounded-full border border-indigo-500/20">
                                        <Download className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <span className="font-semibold text-slate-200">Keywords Injected</span>
                                </div>
                                <p className="text-xs text-slate-400 font-mono">Added: React, TypeScript, CI/CD</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 mx-4 mb-4 sm:mx-6 sm:mb-6 lg:mx-8 lg:mb-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="container px-4 mx-auto text-center relative z-10">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">Ready to land your dream job?</h2>
                    <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
                        Join 5,000+ professionals optimizing their job search today.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" className="h-14 px-8 bg-white text-slate-950 hover:bg-indigo-50 font-bold rounded-full transition-all hover:scale-105" asChild>
                            <Link href={extensionUrl} target="_blank">
                                Install Extension
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}

// Sub-components can stay in this file or move to separate files if you prefer
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-lg hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="mb-6 bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:bg-indigo-950/30 group-hover:border-indigo-500/30 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
                {desc}
            </p>
        </div>
    );
}

function StepRow({ num, title, desc }: { num: string, title: string, desc: string }) {
    return (
        <div className="flex gap-5 group">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-900 text-indigo-400 font-bold flex items-center justify-center border border-slate-800 group-hover:border-indigo-500/50 group-hover:text-indigo-300 transition-colors shadow-lg">
                {num}
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-200 transition-colors">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}