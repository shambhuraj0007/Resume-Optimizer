import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
    title: 'Career Hub | Interview Prep, Salaries, Resume Tips — ShortlistAI',
    description:
        'Your complete career resource: interview questions, salary data, resume templates, career roadmaps, and job market trends for Indian professionals.',
    alternates: { canonical: 'https://shortlistai.cv/career-hub/' },
};

export default function CareerHubLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
            {/* Career Hub sub-navigation */}
            <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6 text-sm overflow-x-auto">
                    <a href="/career-hub" className="font-semibold text-indigo-400 shrink-0 hover:text-indigo-300 transition-colors">
                        Career Hub
                    </a>
                    <a href="/career-hub/interview-preparation" className="text-gray-400 hover:text-white transition-colors shrink-0">Interviews</a>
                    <a href="/career-hub/salary-insights" className="text-gray-400 hover:text-white transition-colors shrink-0">Salaries</a>
                    <a href="/career-hub/resume-tips" className="text-gray-400 hover:text-white transition-colors shrink-0">Resume Tips</a>
                    <a href="/career-hub/career-growth" className="text-gray-400 hover:text-white transition-colors shrink-0">Growth</a>
                    <a href="/career-hub/job-market-trends" className="text-gray-400 hover:text-white transition-colors shrink-0">Trends</a>
                    <div className="ml-auto shrink-0">
                        <a
                            href="https://shortlistai.cv"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                            Try Free
                        </a>
                    </div>
                </div>
            </nav>
            <div className="flex-1">
                {children}
            </div>
            <Footer />
        </div>
    );
}
