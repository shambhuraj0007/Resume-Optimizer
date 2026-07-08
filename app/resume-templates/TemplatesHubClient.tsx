'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Sparkles,
    Target,
    TrendingUp,
    Search,
    Briefcase,
    ChevronRight,
    ChevronDown,
    Building,
    ArrowRight,
    Banknote,
    Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Analytics helper
const trackHubView = () => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
            event: 'programmatic_hub_view',
            page_type: 'resume_template_hub',
        });
    }
};

type SerializedRole = {
    _id: string;
    slug: string;
    jobTitle: string;
    industry?: string;
    demandLevel?: 'High' | 'Medium' | 'Low' | string;
    topSkills?: string[];
    averageSalary?: string;
    topCompanies?: string[];
    updatedAt: string;
};

type Props = {
    roles: SerializedRole[];
};

export default function TemplatesHubClient({ roles }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState<string | 'All'>('All');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    useEffect(() => { trackHubView(); }, []);

    const allIndustries = useMemo(() => {
        const industries = new Set(roles.map(r => r.industry || 'General'));
        return ['All', ...Array.from(industries).sort()];
    }, [roles]);

    const filteredRoles = useMemo(() => {
        return roles.filter((role) => {
            const matchesSearch =
                role.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                role.industry?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedIndustry === 'All' ||
                (role.industry || 'General') === selectedIndustry;
            return matchesSearch && matchesCategory;
        });
    }, [roles, searchQuery, selectedIndustry]);

    const groupedRoles = useMemo(() => {
        if (selectedIndustry !== 'All') return { [selectedIndustry]: filteredRoles };
        return filteredRoles.reduce((acc: Record<string, typeof filteredRoles>, role) => {
            const industry = role.industry || 'General';
            if (!acc[industry]) acc[industry] = [];
            acc[industry].push(role);
            return acc;
        }, {});
    }, [filteredRoles, selectedIndustry]);

    const activeGroups = Object.keys(groupedRoles).sort();

    const toggleSection = (industry: string) => {
        setExpandedSections(prev => ({ ...prev, [industry]: !prev[industry] }));
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-purple-100 dark:selection:bg-purple-900/30">

            {/* --- HERO SECTION --- */}
            <div className="relative overflow-hidden bg-slate-900 pb-12 pt-8 lg:pt-10">
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[250px] w-[250px] rounded-full bg-purple-500 opacity-20 blur-[80px]"></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-3 lg:px-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300 mb-6 backdrop-blur-sm transition-transform hover:scale-105 cursor-default">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Updated for {new Date().getFullYear()} Trends</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
                        Build a resume that <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                            passes the ATS every time.
                        </span>
                    </h1>

                    <p className="text-base md:text-lg text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
                        Choose from {roles.length}+ industry-specific templates designed to highlight your skills and beat automated screening systems.
                    </p>

                    <div className="flex justify-center mt-6">
                        <Link href="/ats-checker">
                            <Button
                                size="lg"
                                className="group h-11 px-8 bg-white text-slate-900 hover:bg-purple-50 font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] border-2 border-transparent hover:border-purple-200"
                            >
                                <Target className="mr-2 h-4 w-4 text-purple-600 group-hover:rotate-12 transition-transform" />
                                Check Your ATS Score
                                <ChevronRight className="ml-1 h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- FLOATING SEARCH BAR --- */}
            <div className="relative z-20 max-w-3xl mx-auto px-4 -mt-7">
                <div className="group bg-white dark:bg-slate-900 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 p-1.5 flex items-center gap-1 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10">
                    <div className="pl-4 flex-shrink-0">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search job titles (e.g. 'Software Engineer')..."
                        className="flex-1 h-11 border-0 bg-transparent text-base focus-visible:ring-0 shadow-none placeholder:text-slate-400 truncate"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button
                        size="lg"
                        className="h-11 rounded-full px-6 md:px-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-95"
                    >
                        Search Templates
                    </Button>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide mask-fade-right">
                    <span className="text-sm font-semibold text-slate-500 whitespace-nowrap mr-2">
                        Filter by Industry:
                    </span>
                    {allIndustries.map((ind) => (
                        <button
                            key={ind}
                            onClick={() => setSelectedIndustry(ind)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                                selectedIndustry === ind
                                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                            )}
                        >
                            {ind}
                        </button>
                    ))}
                </div>

                <div className="space-y-16">
                    {filteredRoles.length > 0 ? (
                        activeGroups.map((industry) => {
                            const rolesInGroup = groupedRoles[industry];
                            const isExpanded = expandedSections[industry];
                            const displayedRoles = isExpanded ? rolesInGroup : rolesInGroup.slice(0, 3);
                            const hasMore = rolesInGroup.length > 3;

                            return (
                                <section key={industry} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {selectedIndustry === 'All' && (
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {industry}
                                            </h2>
                                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {displayedRoles.map((role) => (
                                            <Link key={role.slug} href={`/resume-templates/${role.slug}`} className="group h-full block">
                                                <Card className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-500 hover:shadow-2xl hover:shadow-purple-900/10 dark:border-slate-800 dark:bg-slate-950">

                                                    {/* Hover Gradient Background Effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                                                    {/* Top Section: Header & Badges */}
                                                    <div className="relative z-10 flex flex-col gap-4 p-6">
                                                        {/* Badges Row */}
                                                        <div className="flex items-center justify-between">
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-slate-100 text-xs font-medium text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-purple-900/30 dark:group-hover:text-purple-300 transition-colors"
                                                            >
                                                                {role.industry || 'General'}
                                                            </Badge>

                                                            {role.demandLevel && (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                                                    <TrendingUp className="h-3 w-3" />
                                                                    {role.demandLevel} Demand
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Title & Description */}
                                                        <div>
                                                            <h3 className="text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-purple-700 dark:text-white line-clamp-2" title={role.jobTitle}>
                                                                {role.jobTitle}
                                                            </h3>
                                                            <p className="mt-2 text-sm text-slate-500 line-clamp-2 dark:text-slate-400">
                                                                ATS-optimized template designed to highlight your key projects and technical skills.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Middle Section: Metrics Box (The "Bento" Grid) */}
                                                    <div className="relative z-10 flex-grow px-6">
                                                        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-100 border border-slate-100 dark:bg-slate-800 dark:border-slate-800">

                                                            {/* Salary Cell */}
                                                            <div className="col-span-1 bg-white p-3 dark:bg-slate-900/60">
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                                                                    <Banknote className="h-3.5 w-3.5" />
                                                                    <span>Avg. Salary</span>
                                                                </div>
                                                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                                    {role.averageSalary || "$60k - $90k"}
                                                                </div>
                                                            </div>

                                                            {/* Companies Cell */}
                                                            <div className="col-span-1 bg-white p-3 dark:bg-slate-900/60">
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                                                                    <Building2 className="h-3.5 w-3.5" />
                                                                    <span>Target Firms</span>
                                                                </div>
                                                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={role.topCompanies?.join(', ')}>
                                                                    {role.topCompanies?.[0] || "Top Tech"}
                                                                    {role.topCompanies && role.topCompanies.length > 1 && (
                                                                        <span className="text-slate-400 font-normal ml-1">+{role.topCompanies.length - 1}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bottom Section: Full Width CTA */}
                                                    <div className="relative z-10 mt-auto border-t border-slate-100/50 p-4 dark:border-slate-800/50">
                                                        <div className="flex items-center justify-end">
                                                            <button className="group relative flex overflow-hidden rounded-full bg-slate-900/5 px-5 py-2.5 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-purple-600 hover:text-white hover:shadow-md hover:shadow-purple-500/20 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-purple-500 dark:hover:text-white">
                                                                <span className="mr-2">View Template</span>

                                                                {/* The "Relay" Arrow Animation Container */}
                                                                <div className="relative flex h-3 w-3 items-center justify-center overflow-hidden">
                                                                    {/* Arrow 1: Starts visible, slides out right on hover */}
                                                                    <ArrowRight className="absolute h-3 w-3 transition-all duration-300 ease-out group-hover:translate-x-full group-hover:opacity-0" />

                                                                    {/* Arrow 2: Starts hidden left, slides in to center on hover */}
                                                                    <ArrowRight className="absolute h-3 w-3 -translate-x-full opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>

                                    {hasMore && (
                                        <div className="mt-8 flex justify-center">
                                            <Button
                                                variant="outline"
                                                onClick={() => toggleSection(industry)}
                                                className="rounded-full px-6 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                            >
                                                {isExpanded ? (
                                                    <>Show Less <ChevronDown className="ml-2 h-4 w-4 rotate-180 transition-transform" /></>
                                                ) : (
                                                    <>Show {rolesInGroup.length - 3} More {industry} Templates <ChevronDown className="ml-2 h-4 w-4" /></>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </section>
                            );
                        })
                    ) : (
                        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                No templates found
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-8">
                                We couldn't find a template matching "{searchQuery}" in {selectedIndustry}.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => { setSearchQuery(''); setSelectedIndustry('All'); }}
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}