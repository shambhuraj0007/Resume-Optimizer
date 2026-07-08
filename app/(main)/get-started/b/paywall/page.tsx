"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { trackPaidAdPaywallView } from "@/lib/analytics";
import PricingPage from "@/app/(main)/pricing/page";

export default function PaywallPage() {
    const { data: session } = useSession();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Auth guard
    useEffect(() => {
        if (!session && !isAuthenticated) {
            router.push("/signin?callbackUrl=/get-started/b/paywall");
        }
    }, [session, isAuthenticated, router]);

    // Set returnTo so pricing page redirects to ATS checker after payment
    useEffect(() => {
        localStorage.setItem("returnTo", "/ats-checker");
    }, []);

    // Track paywall view
    useEffect(() => {
        trackPaidAdPaywallView({
            variant: "b",
            ad_platform: searchParams.get("ad_platform") || "",
            utm_campaign: searchParams.get("utm_campaign") || "",
        });
    }, [searchParams]);

    return <PricingPage hideFreeTier />;
}
