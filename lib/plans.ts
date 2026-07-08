/**
 * Maps internal plan/package IDs to human-readable names for emails and UI.
 */
export const PLAN_NAMES: Record<string, string> = {
    // Credit Packs
    "5-scan-pack": "Pay as you go (5 scan pack)",
    "20-scan-pack": "Pay as you go (20 scan pack)",
    "50-scan-pack": "Pay as you go (50 scan pack)",

    // Subscriptions (Current)
    "pro-monthly-inr": "Pro Monthly",
    "pro-quarterly-inr": "Pro Quarterly",

    // Subscriptions (Legacy/Fallback)
    "pro_monthly_599": "Pro Monthly",
    "pro_quarterly_1499": "Pro Quarterly",
    "PRO_MONTHLY": "Pro Monthly",
    "PRO_QUARTERLY": "Pro Quarterly",
};

/**
 * Returns the human-readable name for a given plan ID.
 * Falls back to formatting the ID if not found.
 */
export function getReadablePlanName(planId: string): string {
    if (!planId) return "Unknown Plan";

    // Check exact match
    if (PLAN_NAMES[planId]) {
        return PLAN_NAMES[planId];
    }

    // Fallback: capitalized string
    // e.g. "pro-monthly" -> "Pro Monthly"
    return planId
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
