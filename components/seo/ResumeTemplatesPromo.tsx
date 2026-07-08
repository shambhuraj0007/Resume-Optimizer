'use client';

import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';

const FEATURED_TEMPLATES = [
    { slug: 'software-engineer', title: 'Software Engineer' },
    { slug: 'data-analyst', title: 'Data Analyst' },
    { slug: 'product-manager', title: 'Product Manager' },
    { slug: 'ux-designer', title: 'UX Designer' },
    { slug: 'marketing-manager', title: 'Marketing Manager' },
    { slug: 'devops-engineer', title: 'DevOps Engineer' },
];

export default function ResumeTemplatesPromo() {
    return (
        <section className="mt-12 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Free Resume Templates by Role
                </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Get ATS-optimized templates with industry-specific keywords and formatting tips.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {FEATURED_TEMPLATES.map((template) => (
                    <Link
                        key={template.slug}
                        href={`/resume-templates/${template.slug}`}
                        className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all group"
                    >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                            {template.title}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-500 ml-auto" />
                    </Link>
                ))}
            </div>
            <Link
                href="/resume-templates"
                className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
                View all templates
                <ChevronRight className="h-4 w-4" />
            </Link>
        </section>
    );
}
