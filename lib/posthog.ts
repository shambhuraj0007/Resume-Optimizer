import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

/**
 * Server-side PostHog client (singleton).
 * Used in API routes for revenue & backend event tracking.
 */
export function getPostHogServer(): PostHog {
    if (!posthogClient) {
        const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

        if (!apiKey) {
            console.warn('PostHog API key not configured — events will be no-ops');
            // Return a stub that silently drops events
            return {
                capture: () => { },
                identify: () => { },
                shutdown: async () => { },
            } as unknown as PostHog;
        }

        posthogClient = new PostHog(apiKey, { host });
    }

    return posthogClient;
}
