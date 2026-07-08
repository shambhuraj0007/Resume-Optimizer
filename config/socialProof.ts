// ============================================================
// SOCIAL PROOF CONFIGURATION — config/socialProof.ts
// ============================================================
//
// This file controls the two social-proof sections on the homepage:
//   1. MediaLogoStrip   → "AS SEEN IN" press/media logos
//   2. ProfessionalUsageProof → usage stats + employer logos
//
// ── HOW TO UPDATE (for non-technical team members) ──────────
//
// ▸ To SHOW or HIDE the "As Seen In" strip:
//     Change  visible: false  →  visible: true   (or vice-versa)
//
// ▸ To ADD a new media logo:
//     1. Upload your logo file (SVG preferred) to /public/media/
//     2. Add a new entry to the `logos` array below, e.g.:
//        { name: "Forbes", logoUrl: "/media/forbes.svg", linkUrl: "https://forbes.com/article", alt: "Forbes logo" }
//
// ▸ To UPDATE stats (usage numbers):
//     Edit the `value` and `label` strings in the `stats` array.
//
// ▸ To SHOW employer logos:
//     1. Upload logo files to /public/logos/
//     2. Add entries to the `logos` array inside professionalUsageProofConfig
//     3. Change  showLogos: false  →  showLogos: true
//
// ▸ After making changes:
//     Open a Pull Request → get it reviewed → merge → deploy picks it up.
// ============================================================

// ----- Type definitions -----

export type MediaLogo = {
    /** Display name, e.g. "The Economic Times" */
    name: string;
    /** Path to logo asset, e.g. "/media/economic-times.svg" */
    logoUrl: string;
    /** Optional link to the article about ShortlistAI on that site */
    linkUrl?: string;
    /** Alt text for accessibility */
    alt?: string;
};

export type UsageStat = {
    /** e.g. "Resumes analyzed" */
    label: string;
    /** e.g. "3,000+" */
    value: string;
};

export type EmployerLogo = {
    /** e.g. "Swiggy" */
    name: string;
    /** Path to logo asset, e.g. "/logos/swiggy.svg" */
    logoUrl: string;
    /** Alt text for accessibility */
    alt?: string;
};

// ----- Configs -----

export const mediaLogoStripConfig = {
    /**
     * Master visibility toggle.
     * Set to `true` once you have real press logos ready to display.
     */
    visible: false,

    /** Section heading (rendered as uppercase label) */
    title: "AS SEEN IN",

    /** Short blurb beneath the heading */
    subtitle: "Featured by leading career and business publications.",

    /**
     * Array of press / media logos.
     * Add entries here when you get press coverage.
     * Each logo needs at minimum: name + logoUrl.
     * If linkUrl is set, the logo becomes a clickable link to the article.
     */
    logos: [
        // Example (uncomment and update when ready):
        // { name: "The Economic Times", logoUrl: "/media/economic-times.svg", linkUrl: "https://economictimes.com/...", alt: "The Economic Times logo" },
        // { name: "YourStory", logoUrl: "/media/yourstory.svg", linkUrl: "https://yourstory.com/...", alt: "YourStory logo" },
    ] as MediaLogo[],
};

export const professionalUsageProofConfig = {
    /** Main heading */
    title: "Used by professionals everywhere to sharpen their job search",

    /** Supporting subtitle */
    subtitle:
        "From fresh graduates to senior leaders, ShortlistAI helps candidates apply with confidence, not guesswork.",

    /**
     * Usage statistics displayed in a row of cards.
     * Update these values as your real numbers grow.
     */
    stats: [
        { value: "3,000+", label: "Resumes analyzed" },
        { value: "+27", label: "Average ATS score improvement" },
        { value: "15+", label: "Countries our users come from" },
    ] as UsageStat[],

    /**
     * Toggle to show/hide the employer logos row.
     * Set to `true` once you have brand permission and logos ready.
     */
    showLogos: true,

    /**
     * Array of employer / company logos.
     * Add entries here when you have permission to display them.
     */
    logos: [
        // Logos are auto-discovered from /public/logos/ — no need to list them here.
        // You can still add manual overrides here if needed, they'll be merged with auto-discovered ones.
    ] as EmployerLogo[],
};
