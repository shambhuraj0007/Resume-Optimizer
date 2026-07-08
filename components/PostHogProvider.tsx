"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, ReactNode } from "react";

/* ─────────────────────────────────────────────
   Initialise PostHog (deferred until interaction or timeout)
   ───────────────────────────────────────────── */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialised = false;

function ensureInit() {
    if (initialised || typeof window === "undefined" || !POSTHOG_KEY) return;
    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,        // We send custom pageviews
        capture_pageleave: true,
        autocapture: false,             // Save quota — rely on custom events
        persistence: "localStorage",
    });
    initialised = true;
}

/* ─────────────────────────────────────────────
   Provider + identify (interaction-based defer)
   ───────────────────────────────────────────── */

export default function PostHogProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const identified = useRef(false);

    // Defer PostHog init until first user interaction OR 5s timeout
    useEffect(() => {
        if (!POSTHOG_KEY || typeof window === "undefined") return;

        let done = false;
        const init = () => {
            if (done) return;
            done = true;
            ensureInit();
        };

        // Timeout fallback – capture bouncing visitors after 1.5s
        // (5000ms was landing inside Lighthouse's TBT window causing +490ms TBT regression)
        const timer = setTimeout(init, 1500);

        // Interaction-based triggers (fires immediately on first engagement)
        const events = ["scroll", "click", "keydown", "touchstart"] as const;
        events.forEach((e) =>
            window.addEventListener(e, () => { clearTimeout(timer); init(); }, { once: true })
        );

        return () => {
            clearTimeout(timer);
            // Listeners with { once: true } auto-remove after firing
        };
    }, []);

    // Identify user once they log in
    useEffect(() => {
        if (session?.user?.email && !identified.current) {
            ensureInit(); // ensure init before identify
            posthog.identify(session.user.email, {
                email: session.user.email,
                name: session.user.name || "",
            });
            identified.current = true;
        }
    }, [session]);

    if (!POSTHOG_KEY) return <>{children}</>;

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
