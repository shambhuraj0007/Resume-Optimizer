import { type MediaLogo } from "@/config/socialProof";

type MediaLogoStripProps = {
    title?: string;
    subtitle?: string;
    logos: MediaLogo[];
    visible: boolean;
};

/**
 * "AS SEEN IN" press / media logo strip.
 * Renders a static, greyscale row of publication logos.
 * When `visible` is false, nothing is rendered at all.
 */
export default function MediaLogoStrip({
    title = "AS SEEN IN",
    subtitle = "Featured by leading career and business publications.",
    logos,
    visible,
}: MediaLogoStripProps) {
    // Don't render anything when the section is toggled off
    if (!visible) return null;

    return (
        <section
            id="media-logo-strip"
            className="relative py-6 sm:py-8 overflow-hidden bg-white dark:bg-gray-950"
        >
            {/* Injecting keyframes for animations (matching ProfessionalUsageProof) */}
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
                {/* Section Header matching ProfessionalUsageProof */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6">
                    <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-700" />
                    <p className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-300 dark:to-white">
                        {title}
                    </p>
                    <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-700" />
                </div>

                {/* Subtitle (Optional, standard text if provided) */}
                {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 -mt-6">
                        {subtitle}
                    </p>
                )}

                {/* Logo row with consistent gap and infinite scroll */}
                <div
                    className="relative flex w-full max-w-6xl mx-auto overflow-hidden select-none"
                    style={{
                        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
                    }}
                >
                    <div className="flex w-max animate-infinite-scroll items-center gap-12 sm:gap-20 md:gap-28 py-8 pl-12 sm:pl-20 md:pl-28 will-change-transform hover:[animation-play-state:paused]">
                        {[...logos, ...logos].map((logo, idx) => {
                            const img = (
                                <img
                                    src={logo.logoUrl}
                                    alt={logo.alt || `${logo.name} logo`}
                                    className="
                                        h-8 sm:h-9 md:h-10 w-auto max-w-[120px] sm:max-w-[140px] object-contain cursor-pointer
                                        transition-all duration-300 ease-in-out hover:scale-105
                                        
                                        /* --- LIGHT MODE --- */
                                        grayscale opacity-60 
                                        hover:grayscale-0 hover:opacity-100
                                        
                                        /* --- DARK MODE --- */
                                        dark:brightness-0 dark:invert dark:opacity-80 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]
                                        hover:dark:opacity-100 hover:dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]
                                    "
                                    draggable={false}
                                />
                            );

                            return logo.linkUrl ? (
                                <a
                                    key={`${logo.name}-${idx}`}
                                    href={logo.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Read about ShortlistAI on ${logo.name}`}
                                >
                                    {img}
                                </a>
                            ) : (
                                <span key={`${logo.name}-${idx}`}>{img}</span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
