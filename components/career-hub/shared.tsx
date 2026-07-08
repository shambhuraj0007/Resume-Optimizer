import Link from 'next/link';
import { THEME_LABELS } from '@/lib/career-hub-shared';

interface Props {
    theme: string;
    slug: string;
    title: string;
}

const categoryColors: Record<string, string> = {
    technical: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    behavioral: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    hr: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'system-design': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

export function Breadcrumbs({ theme, slug, title }: Props) {
    return (
        <nav className="text-sm text-gray-500 mb-8 flex flex-wrap gap-2">
            <Link href="/career-hub" className="hover:text-indigo-400 transition-colors">Career Hub</Link>
            <span>/</span>
            <Link href={`/career-hub/${theme}`} className="hover:text-indigo-400 transition-colors capitalize">
                {THEME_LABELS[theme] ?? theme}
            </Link>
            <span>/</span>
            <span className="text-gray-300 truncate max-w-xs">{title}</span>
        </nav>
    );
}

export function CTABlock({ text }: { text?: string }) {
    return (
        <div className="mt-12 bg-gradient-to-br from-indigo-500/10 to-cyan-500/8 border border-indigo-500/20 rounded-2xl p-8 text-center">
            <p className="text-lg font-semibold text-white mb-4">
                {text ?? 'Build the resume that gets past ATS scanners →'}
            </p>
            <a
                href="https://shortlistai.cv"
                className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-7 py-3 rounded-lg transition-colors"
            >
                Try ShortlistAI Free
            </a>
        </div>
    );
}

export function CategoryBadge({ category }: { category: string }) {
    const cls = categoryColors[category] ?? 'bg-gray-700 text-gray-300 border-gray-600';
    return (
        <span className={`inline-block text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${cls}`}>
            {category.replace('-', ' ')}
        </span>
    );
}
