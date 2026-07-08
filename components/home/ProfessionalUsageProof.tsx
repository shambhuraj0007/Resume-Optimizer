import { type UsageStat, type EmployerLogo } from "@/config/socialProof";

type ProfessionalUsageProofProps = {
    title?: string;
    subtitle?: string;
    stats: UsageStat[];
    logos: EmployerLogo[];
    showLogos: boolean;
};

/**
 * "Used by professionals everywhere" social-proof section.
 * Displays usage statistics in a premium card row, plus optional employer logos.
 */
export default function ProfessionalUsageProof({
    title = "Used by professionals everywhere to sharpen their job search",
    subtitle = "From fresh graduates to senior leaders, ShortlistAI helps candidates apply with confidence, not guesswork.",
    stats,
    logos,
    showLogos,
}: ProfessionalUsageProofProps) {
    const hasStats = stats.length > 0;
    const hasLogos = showLogos && logos.length > 0;

    return (
        <section
            id="professional-usage-proof"
            className="relative py-10 sm:py-20 overflow-hidden bg-white dark:bg-[#030712]"
        >
            {/* Background Glows for Premium Vibe */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] opacity-30 dark:opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
            </div>

            {/* Injecting keyframes for animations */}
            <style>{`
                @keyframes infinite-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-infinite-scroll {
                    animation: infinite-scroll 40s linear infinite;
                }
                .animate-infinite-scroll:hover {
                    animation-play-state: paused;
                }
            `}</style>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">

                {/* Heading Area */}
                <div className="max-w-4xl mx-auto mb-16 sm:mb-20">
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Employer logos row */}
                {hasLogos && (
                    <div className="mb-20 sm:mb-28">
                        {/* Adjusted the header text to be brighter in dark mode (dark:from-gray-300 dark:to-white) */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-12">
                            <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-700" />
                            <p className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-300 dark:to-white">
                                Trusted by Professionals at
                            </p>
                            <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-700" />
                        </div>

                        {/* Masked container for faded edges */}
                        <div
                            className="relative flex w-full max-w-6xl mx-auto overflow-hidden select-none"
                            style={{
                                maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                                WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
                            }}
                        >
                            <div className="flex w-max animate-infinite-scroll items-center gap-12 sm:gap-20 md:gap-28 py-8 pl-12 sm:pl-20 md:pl-28 will-change-transform hover:[animation-play-state:paused]">
                                {[...logos, ...logos].map((logo, idx) => (
                                    <img
                                        key={`${logo.name}-${idx}`}
                                        src={logo.logoUrl}
                                        alt={logo.alt || `${logo.name} logo`}
                                        className="
                            h-8 sm:h-9 md:h-10 w-auto max-w-[120px] sm:max-w-[140px] object-contain cursor-pointer
                            transition-all duration-400 ease-in-out hover:scale-105 
                            
                            /* --- LIGHT MODE --- */
                            grayscale opacity-60 
                            hover:grayscale-0 hover:opacity-100
                            
                            /* --- DARK MODE (High Visibility Fix) --- */
                            /* 1. opacity-80: Keeps them highly visible but not blinding */
                            /* 2. drop-shadow: Adds a slight baseline glow to lift them off the dark background */
                            dark:brightness-0 dark:invert dark:opacity-80 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]
                            
                            /* Hover state snaps to 100% solid white with a stronger glow */
                            hover:dark:opacity-100 hover:dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]
                        "
                                        draggable={false}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats row */}
                {hasStats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                        {stats.map((stat, i) => (
                            <div
                                key={stat.label}
                                className="group relative rounded-[2rem] p-px bg-gradient-to-b from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900/50 hover:from-blue-500 hover:to-purple-500 transition-all duration-500"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 blur-xl transition-all duration-500 rounded-[2rem] -z-10" />
                                <div className="relative h-full bg-white dark:bg-[#080d1a] rounded-[calc(2rem-1px)] p-8 sm:p-10 transition-colors duration-500 flex flex-col items-center justify-center overflow-hidden">
                                    {/* Inner subtle glow on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <p className="relative text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-500 mb-2">
                                        {stat.value}
                                    </p>
                                    <p className="relative text-base sm:text-lg text-gray-500 dark:text-gray-400 font-medium">
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}