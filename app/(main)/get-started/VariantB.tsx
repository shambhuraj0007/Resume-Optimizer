"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    CheckCircle2,
    Upload,
    Sparkles,
    ShieldCheck,
    Star,
    ChevronDown,
    Users,
    TrendingUp,
} from "lucide-react";
import { trackPaidAdLandingView, trackPaidAdSignupStarted } from "@/lib/analytics";

/* ─────────────────── FAQ DATA (spec-exact) ─────────────────── */

const FAQ_ITEMS = [
    {
        q: "How it works?",
        a: "Upload your resume (or build one for free), paste the job description, and hit scan. In under 60 seconds you'll see your ATS match score, missing keywords, and AI-powered suggestions to improve your chances.",
    },
    {
        q: "What is ATS and how does it work?",
        a: "An Applicant Tracking System (ATS) is software that 95% of Fortune 500 companies use to automatically filter resumes. If your resume isn't optimized for ATS, it could be rejected before a human ever reads it — even if you're qualified.",
    },
    {
        q: "Is my data secure?",
        a: "Yes. All uploads are encrypted via HTTPS. We never sell or share your data. You can delete everything from your profile at any time.",
    },
];

/* ─────────────────── PAGE ─────────────────── */

export default function VariantB() {
    const searchParams = useSearchParams();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        trackPaidAdLandingView({
            variant: "b",
            utm_source: searchParams.get("utm_source") || "",
            utm_medium: searchParams.get("utm_medium") || "",
            utm_campaign: searchParams.get("utm_campaign") || "",
            ad_platform: searchParams.get("ad_platform") || "",
            placement: searchParams.get("placement") || "",
        });
    }, [searchParams]);

    const handlePrimaryCTA = () => {
        trackPaidAdSignupStarted({
            variant: "b",
            ad_platform: searchParams.get("ad_platform") || "",
            utm_campaign: searchParams.get("utm_campaign") || "",
        });
    };

    /* Variant B CTA destination: signup → paywall */
    const ctaHref = "/signin?callbackUrl=/get-started/b/paywall";

    return (
        <main className="flex flex-col min-h-screen bg-gradient-to-b from-white via-gray-50/40 to-white dark:from-gray-950 dark:via-gray-900/60 dark:to-gray-950 selection:bg-blue-500/20">

            {/* ══════════════════ HERO ══════════════════ */}
            <section className="relative isolate overflow-hidden">
                <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-blue-400/[0.08] dark:bg-blue-500/[0.15] rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-[10%] right-[-5%] w-[400px] h-[400px] bg-purple-400/[0.07] dark:bg-purple-500/[0.12] rounded-full blur-[90px] pointer-events-none" />

                <div className="relative max-w-3xl mx-auto px-5 pt-[4.5rem] pb-14 sm:pt-20 sm:pb-20 text-center">
                    <h1 className="text-[2rem] leading-[1.1] sm:text-[3rem] sm:leading-[1.08] font-extrabold tracking-tight text-gray-900 dark:text-white mb-5">
                        Stop Getting{" "}
                        <span className="relative">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                                Ghosted
                            </span>
                            <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-full opacity-30" />
                        </span>
                        {" "}by Employers
                    </h1>

                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed sm:mb-8 mb-20">
                        98&nbsp;% of resumes are filtered out by ATS bots before a human sees them.
                        Fix yours in under 60&nbsp;seconds.
                    </p>

                    <div className="flex flex-col items-center gap-4 mb-6">
                        <Button
                            size="lg"
                            className="h-12 sm:h-14 w-full sm:w-auto px-10 sm:px-12 text-2xl sm:text-xl font-bold rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-blue-600/25 dark:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/30"
                            asChild
                        >
                            <Link href={ctaHref} onClick={handlePrimaryCTA}>
                                Fix my CV
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs text-gray-400 dark:text-gray-600">
                        <span>No card required · Data encrypted · Cancel anytime</span>
                    </div>
                </div>
            </section>

            {/* ══════════════════ SOCIAL PROOF ══════════════════ */}
            <section className="py-8 sm:py-6 border-y border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="max-w-5xl mx-auto px-5">
                    <div className="grid grid-cols-3 gap-4 sm:gap-8">
                        <MetricCard icon={<Users className="h-5 w-5" />} value="50,000+" label="Resumes scanned" accent="text-blue-600 dark:text-blue-400" />
                        <MetricCard icon={<TrendingUp className="h-5 w-5" />} value="92%" label="Score improvement" accent="text-purple-600 dark:text-purple-400" />
                        <MetricCard icon={<Star className="h-5 w-5" />} value="4.8★" label="User rating" accent="text-amber-500 dark:text-amber-400" />
                    </div>
                </div>
            </section>

            {/* ══════════════════ HOW IT WORKS ══════════════════ */}
            <section className="py-14 sm:py-20">
                <div className="max-w-5xl mx-auto px-5">
                    <div className="text-center mb-10 sm:mb-14">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-2 block">
                            How it works
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                            From Upload to Offer-Ready
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto">
                            Three simple steps. Less than a minute. No expertise needed.
                        </p>
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
                        <div className="hidden md:block absolute top-[50px] left-[16.67%] right-[16.67%] h-[2px] bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800" />

                        <StepCard
                            num="1"
                            icon={<CheckCircle2 className="h-5 w-5" />}
                            title="Create Free Account"
                            desc="Sign up with Google or email in seconds. Completely free, no card needed."
                            gradient="from-blue-500 to-blue-600"
                        />
                        <StepCard
                            num="2"
                            icon={<Upload className="h-5 w-5" />}
                            title="Add Your Resume"
                            desc="Upload a PDF or build one from scratch using our guided resume builder."
                            gradient="from-purple-500 to-purple-600"
                        />
                        <StepCard
                            num="3"
                            icon={<Sparkles className="h-5 w-5" />}
                            title="Get Score & Fix"
                            desc="See your ATS match score, missing keywords, and AI-powered improvement tips."
                            gradient="from-pink-500 to-pink-600"
                        />
                    </div>
                </div>
            </section>

            {/* ══════════════════ FAQ ══════════════════ */}
            <section className="py-7 sm:py-10">
                <div className="max-w-2xl mx-auto px-5">
                    <div className="text-center mb-10 sm:mb-12">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-2 block">
                            FAQ
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Common Questions
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Everything you need to know before getting started.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {FAQ_ITEMS.map(({ q, a }, i) => {
                            const isOpen = openFaq === i;
                            return (
                                <div
                                    key={i}
                                    className={`rounded-2xl border transition-all duration-300 ${isOpen
                                        ? "border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/[0.05] shadow-lg shadow-blue-100/50 dark:shadow-blue-900/10"
                                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 hover:border-gray-300 dark:hover:border-gray-700"
                                        }`}
                                >
                                    <button
                                        onClick={() => setOpenFaq(isOpen ? null : i)}
                                        className="w-full flex items-center justify-between px-6 py-4 text-left"
                                    >
                                        <span className="text-sm sm:text-[15px] font-semibold text-gray-900 dark:text-white pr-4">{q}</span>
                                        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
                                        <p className="px-6 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {a}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ══════════════════ FINAL CTA ══════════════════ */}
            <section className="mx-4 mb-6 sm:mx-6 lg:mx-8 rounded-[2rem] overflow-hidden relative isolate">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.15),transparent_60%)] pointer-events-none" />

                <div className="relative py-12 sm:py-16 px-6 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 max-w-md mx-auto leading-tight">
                        Your Next Interview Starts Here
                    </h2>
                    <p className="text-white/75 text-sm sm:text-base mb-8 max-w-sm mx-auto">
                        Join 50,000+ job seekers who fixed their resumes and landed more callbacks.
                    </p>

                    <Button
                        size="lg"
                        className="h-12 w-full sm:w-auto px-8 text-base font-bold rounded-full bg-white text-gray-900 hover:bg-gray-100 shadow-2xl shadow-black/15 transition-all duration-300 hover:-translate-y-0.5"
                        asChild
                    >
                        <Link href={ctaHref} onClick={handlePrimaryCTA}>
                            Fix my CV
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}

/* ─────────── Sub-components ─────────── */

function MetricCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string; label: string; accent: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className={`${accent} mb-0.5`}>{icon}</div>
            <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
        </div>
    );
}

function StepCard({ num, icon, title, desc, gradient }: {
    num: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
    gradient: string;
}) {
    return (
        <div className="relative flex flex-col items-center text-center group">
            <div className={`relative z-10 h-[48px] w-[48px] rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                {icon}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-1.5">
                Step {num}
            </span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[260px]">{desc}</p>
        </div>
    );
}
