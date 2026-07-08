import Link from 'next/link';
import { ArrowRight, Code2, Briefcase, BarChart3 } from 'lucide-react';

export default function PopularTemplates() {
    const templates = [
        { slug: 'software-engineer', title: 'Software Engineer', description: 'Optimized for FAANG & Startups', icon: Code2, gradient: 'from-blue-500 to-cyan-500' },
        { slug: 'product-manager', title: 'Product Manager', description: 'Leadership & Strategy focus', icon: Briefcase, gradient: 'from-purple-500 to-pink-500' },
        { slug: 'data-analyst', title: 'Data Analyst', description: 'Data-driven decision making', icon: BarChart3, gradient: 'from-emerald-500 to-teal-500' },
    ];

    return (
        <section className="relative py-8 sm:py-12 overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600 rounded-full blur-[120px]" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 sm:mb-10 gap-4">
                    <div className="max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 sm:mb-3">
                            Craft your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
                                career story.
                            </span>
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                            Popular Resume Templates (battle-tested resume templates)
                        </p>
                    </div>
                    <Link
                        href="/resume-templates"
                        className="hidden md:inline-flex items-center shrink-0 px-5 py-2.5 rounded-full bg-gray-200/60 hover:bg-gray-300/70 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white text-sm font-medium border border-gray-300/50 dark:border-white/10 transition-all backdrop-blur-sm"
                    >
                        See all templates <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {templates.map((template) => {
                        const Icon = template.icon;
                        return (
                            <Link
                                key={template.slug}
                                href={`/resume-templates/${template.slug}`}
                                className="group relative flex flex-col justify-between h-full p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Hover Gradient Overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`} />

                                <div>
                                    <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${template.gradient} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-200 transition-colors">
                                        {template.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                                        {template.description}
                                    </p>
                                </div>

                                <div className="flex items-center text-sm font-semibold text-blue-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-white transition-colors">
                                    <span>View Template</span>
                                    <ArrowRight className="ml-1.5 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-6 md:hidden text-center">
                    <Link
                        href="/resume-templates"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-white text-sm font-medium border border-gray-300/50 dark:border-gray-700 transition-all"
                    >
                        Browse all templates
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}