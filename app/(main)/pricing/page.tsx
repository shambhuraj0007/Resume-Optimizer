"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import CheckoutModal, { CheckoutPlan, CheckoutResult } from "@/components/payment/CheckoutModal";


type Region = "INDIA" | "USA" | "EUROPE" | "UK";

export default function PricingPage({ hideFreeTier = false }: { hideFreeTier?: boolean }) {
    const [pricingData, setPricingData] = useState<any>(null);
    const [region, setRegion] = useState<Region>("USA");
    const [loading, setLoading] = useState(true);
    const [processingPackage, setProcessingPackage] = useState<string | null>(
        null
    );

    const [selectedPackId, setSelectedPackId] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { toast } = useToast();
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { isAuthenticated } = useAuth();
    const { refreshBalance } = useCredits();

    const [pendingOrder, setPendingOrder] = useState<any>(null);
    const [isVerifyingPending, setIsVerifyingPending] = useState(false);
    const [pendingStartedAt, setPendingStartedAt] = useState<number | null>(null);

    // Checkout modal state
    const [checkoutPlan, setCheckoutPlan] = useState<CheckoutPlan | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutProcessing, setCheckoutProcessing] = useState(false);
    // Track which flow triggered the modal: 'pack' | 'cashfree-sub' | 'paypal-annual'
    const [checkoutFlow, setCheckoutFlow] = useState<string>("");



    const cleanPackageName = (name: string) =>
        name.replace(/\s*pack$/i, "").trim();

    // ---------- Pending transaction check ----------

    const checkPending = useCallback(async () => {
        try {
            const res = await fetch("/api/payment/latest-pending");
            const data = await res.json();

            const urlOrderId = searchParams.get("order_id");
            if (urlOrderId) {
                setPendingOrder({ orderId: urlOrderId });
                setPendingStartedAt(Date.now());
                return;
            }

            const cfSubId =
                searchParams.get("cf_subscriptionId") ||
                searchParams.get("subscription_id");
            if (cfSubId) {
                setPendingOrder({ cfSubscriptionId: cfSubId, isSubscription: true });
                setPendingStartedAt(Date.now());
                return;
            }

            if (data.pending && data.transaction) {
                setPendingOrder(data.transaction);
                setPendingStartedAt(Date.now());
            }
        } catch (e) {
            console.error("Error checking pending:", e);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!session && !isAuthenticated) return;
        checkPending();
    }, [session, isAuthenticated, checkPending]);

    // Track Pricing Page View
    useEffect(() => {
        const hasTracked = sessionStorage.getItem("tracked_pricing_view");
        if (!hasTracked) {
            fetch("/api/loops/event", {
                method: "POST",
                body: JSON.stringify({ eventName: "viewed_pricing_page" }),
            }).catch((err) => console.error("Tracking error:", err));
            sessionStorage.setItem("tracked_pricing_view", "true");
        }
    }, []);

    // ---------- returnTo persistence ----------
    useEffect(() => {
        const urlReturnTo = searchParams.get('returnTo');
        if (urlReturnTo && urlReturnTo.startsWith('/')) {
            localStorage.setItem('returnTo', urlReturnTo);
        }
    }, [searchParams]);

    const getReturnTo = () => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('returnTo') : null;
        return (stored && stored.startsWith('/')) ? stored : '/dashboard';
    };

    useEffect(() => {
        if (!pendingOrder || isVerifyingPending) return;

        const verifyPending = async () => {
            setIsVerifyingPending(true);
            const orderId = pendingOrder.orderId;
            const cfSubscriptionId = pendingOrder.cfSubscriptionId;
            const isSubscription =
                pendingOrder.isSubscription || !!cfSubscriptionId;

            let retries = isSubscription ? 1 : 5; // Reduced from 20 to 5 to avoid long waiting if user cancelled

            while (retries > 0) {
                // IMPORTANT: If user clicked 'Hide' or timeout cleared the order, stop looping immediately
                if (!pendingOrder) break;

                try {
                    const verifyUrl = isSubscription
                        ? `/api/payment/verify-signature?${searchParams.toString()}`
                        : "/api/payment/verify-cashfree";

                    const res = await fetch(verifyUrl, {
                        method: isSubscription ? "GET" : "POST",
                        headers: { "Content-Type": "application/json" },
                        ...(isSubscription ? {} : { body: JSON.stringify({ orderId }) }),
                    });
                    const data = await res.json();

                    // If the status is 'ACTIVE', it means session is still live but not paid.
                    // For subscriptions, we might only check once. For packs, we poll.
                    if (
                        res.ok &&
                        (data.success ||
                            data.message === "Already completed" ||
                            data.subscriptionStatus === "active")
                    ) {
                        setPendingOrder(null);
                        setPendingStartedAt(null);
                        refreshBalance();

                        // Redirect to dedicated success page
                        const params = new URLSearchParams();
                        if (data.credits) params.set('credits', String(data.credits));
                        if (data.amount) params.set('amount', String(data.amount));
                        if (data.currency) params.set('currency', data.currency);
                        if (data.plan_id) params.set('plan_id', data.plan_id);
                        params.set('source', 'MainApp');
                        router.push(`/payment/success?${params.toString()}`);
                        break;
                    }

                    const failureStatuses = [
                        "FAILED",
                        "USER_DROPPED",
                        "CANCELLED",
                        "EXPIRED",
                        "VOIDED",
                        "ACTIVE", // Cashfree session still open but user didn't pay — stop polling
                    ];
                    if (
                        failureStatuses.includes(data.status) ||
                        data.cfCheckoutStatus === "FAILED"
                    ) {
                        setPendingOrder(null);
                        setPendingStartedAt(null);
                        toast({
                            title: "Payment Not Completed",
                            description:
                                data.status === "USER_DROPPED" || data.status === "ACTIVE"
                                    ? "Payment was not completed."
                                    : "The transaction failed.",
                            variant: "destructive",
                        });
                        break;
                    }
                } catch (e) {
                    console.warn("Verify poll error", e);
                }

                retries--;
                if (retries > 0 && pendingOrder) {
                    await new Promise((r) => setTimeout(r, 5000));
                } else {
                    // Only clear if we actually ran out of retries (and didn't break early)

                }
            }
            setIsVerifyingPending(false);
        };

        verifyPending();
    }, [
        pendingOrder,
        searchParams,
        toast,
        refreshBalance,
        router,
    ]);

    // ---------- Hard 30s timeout for pending banner ----------

    useEffect(() => {
        if (!pendingOrder || !pendingStartedAt) return;

        const timeoutMs = 30_000;
        const elapsed = Date.now() - pendingStartedAt;
        const remaining = timeoutMs - elapsed;

        if (remaining <= 0) {
            setPendingOrder(null);
            setPendingStartedAt(null);
            toast({
                title: "Payment Failed",
                description:
                    "We could not confirm this payment. If money was deducted, please contact support.",
                variant: "destructive",
            });
            return;
        }

        const timer = setTimeout(() => {
            setPendingOrder(null);
            setPendingStartedAt(null);
            toast({
                title: "Payment Failed",
                description:
                    "We could not confirm this payment. If money was deducted, please contact support.",
                variant: "destructive",
            });
        }, remaining);

        return () => clearTimeout(timer);
    }, [pendingOrder, pendingStartedAt, toast]);

    // ---------- Close dropdown on outside click ----------

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // ---------- Region detection handles in API ----------
    // We rely on the API to return the correct region (User profile or IP)
    // We just sync local state when data loads.

    // ---------- Fetch pricing ----------

    const fetchPricing = useCallback(async () => {
        setLoading(true);
        try {
            // Pass mockCountry query param to API if present (for dev testing)
            const urlParams = new URLSearchParams(window.location.search);
            const mockCountry = urlParams.get('mockCountry');
            const apiUrl = mockCountry
                ? `/api/payment/packages?mockCountry=${mockCountry}`
                : '/api/payment/packages';

            const response = await fetch(apiUrl, {
                cache: "no-store",
            });
            const data = await response.json();
            setPricingData(data);

            // Update local region state to match what backend decided
            if (data.region) {
                setRegion(data.region as Region);
            }

            if (data.credit_packs && data.credit_packs.length > 0) {
                setSelectedPackId(data.credit_packs[0].id);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load pricing.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchPricing();
    }, [fetchPricing]);

    // ---------- Handlers ----------

    const openRazorpayCheckout = (orderData: any, receiptId: string) => {
        console.log("Opening Razorpay Checkout for Order:", orderData.razorpay_order_id);

        if (typeof window === "undefined" || !(window as any).Razorpay) {
            console.error("Razorpay SDK not loaded");
            toast({
                title: "Payment Error",
                description: "Payment system unavailable. Please refresh and try again.",
                variant: "destructive",
            });
            return;
        }

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RjXF1HT5E6HTtf",
            amount: orderData.amount, // in paise
            currency: orderData.currency || "INR",
            name: "ShortlistAI",
            description: "Credits / Subscription Upgrade",
            order_id: orderData.razorpay_order_id,
            handler: async function (response: any) {
                setCheckoutProcessing(true);
                try {
                    const verifyRes = await fetch("/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });
                    const verifyData = await verifyRes.json();

                    if (verifyRes.ok && verifyData.success) {
                        toast({
                            title: "Payment Successful!",
                            description: "Your credits have been added.",
                        });

                        const params = new URLSearchParams();
                        if (verifyData.credits) params.set('credits', String(verifyData.credits));
                        params.set('amount', String(verifyData.amount || (orderData.amount / 100)));
                        params.set('currency', 'INR');
                        params.set('plan_id', verifyData.plan_id || 'unknown');
                        params.set('source', 'RazorpayCheckout');

                        router.push(`/payment/success?${params.toString()}`);
                    } else {
                        throw new Error(verifyData.error || "Payment verification failed");
                    }
                } catch (err: any) {
                    console.error("Signature verification error:", err);
                    toast({
                        title: "Verification Failed",
                        description: err.message || "We could not verify your signature.",
                        variant: "destructive",
                    });
                    router.push(`/payment/status?order_id=${receiptId}`);
                } finally {
                    setCheckoutProcessing(false);
                }
            },
            prefill: {
                name: session?.user?.name || "Customer",
                email: session?.user?.email || "",
            },
            theme: {
                color: "#2563EB",
            },
            modal: {
                ondismiss: function () {
                    setProcessingPackage(null);
                    setCheckoutProcessing(false);
                }
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    };

    const handlePackPurchase = async (couponCode?: string) => {
        if (!session && !isAuthenticated)
            return router.push("/signin?callbackUrl=/pricing");
        if (!selectedPackId) return;

        setProcessingPackage(selectedPackId);
        try {
            const res = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packageType: selectedPackId,
                    region,
                    returnTo: getReturnTo(),
                    ...(couponCode && { couponCode }),
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            openRazorpayCheckout(data, data.orderId);
        } catch (error: any) {
            toast({
                title: "Purchase Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setProcessingPackage(null);
        }
    };

    const handleSubscriptionRazorpay = async (planKey: string, couponCode?: string) => {
        if (!session && !isAuthenticated)
            return router.push("/signin?callbackUrl=/pricing");

        try {
            const res = await fetch("/api/payment/create-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planKey,
                    region,
                    returnTo: getReturnTo(),
                    ...(couponCode && { couponCode }),
                }),
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Handle One-time Order (Pro Flow)
            if (data.provider === "RAZORPAY") {
                openRazorpayCheckout(data, data.orderId);
                return;
            }

            if (data.provider === "PAYPAL") {
                return; // Managed client-side by PayPal SDK wrapper
            }
        } catch (error: any) {
            toast({
                title: "Subscription Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    // ---------- Loading / error ----------

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-[600px] rounded-[2rem] bg-white animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!pricingData)
        return <div className="p-8 text-center">Failed to load pricing</div>;

    // ---------- Derived data ----------

    const isIndia = pricingData.region === "INDIA";
    const selectedPack =
        pricingData.credit_packs?.find((p: any) => p.id === selectedPackId) ||
        pricingData.credit_packs?.[0];

    const freeFeatures = [
        "3 CV↔JD scans per month",
        "Realistic ATS match % and interview chance",
        "Skills matched & missing overview",
        "Watermarked optimized resume preview",
    ];

    const creditsFeatures = [
        "Full analysis for each scan",
        "All improvement suggestions unlocked",
        "Optimized resume PDF download",
        "Credits valid for 3 months",
        "No auto-renewal",
    ];

    const proFeatures = [
        "200 CV↔JD scans",
        "Current & potential match %, interview chances",
        "All improvement suggestions (Text, Keywords, Other)",
        "Optimized resume PDF for every JD (unlimited downloads)",
        "*vs 50-pack @ ₹599",
        "History of recent scans & JDs",
        "Priority support",

    ];

    const CARD_MIN_H = "min-h-[640px]";
    const TITLE_H = "h-[48px] mb-2 flex items-center";
    const DESC_H = "h-[40px] mb-4";
    const SELECTION_AREA_H = "h-[88px] mb-2 flex items-end pb-2";
    const PRICE_AREA_H = "h-[60px] mb-6 flex items-start";

    // ---------- JSX ----------

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16 pb-12 font-sans">
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="afterInteractive"
                onLoad={() => console.log("Razorpay SDK Loaded")}
            />
            <section className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-2">
                        Flexible, pay-as-you-go pricing
                    </h1>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch pt-4">
                    <PayPalScriptProvider
                        key={pricingData?.currencyCode || "USD"}
                        options={{
                            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                            intent: "subscription",
                            vault: true,
                            currency: pricingData?.currencyCode || "USD",
                            "data-sdk-integration-source": "button-factory",
                        }}
                    >
                        {/* FREE TIER CARD */}
                        {!hideFreeTier && (<motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`relative flex flex-col h-full ${CARD_MIN_H} p-6 rounded-[2rem] bg-white dark:bg-slate-900 border-[1.5px] border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300`}
                        >
                            <div className={TITLE_H}>
                                <h3 className="text-2xl font-bold text-foreground">
                                    {pricingData.free_tier?.title || "Free"}
                                </h3>
                            </div>
                            <div className={DESC_H}>
                                <p className="text-sm text-muted-foreground">
                                    Try ShortlistAI with no commitment.
                                </p>
                            </div>

                            <div className={SELECTION_AREA_H}>
                                <div className="w-full">
                                    <p className="text-xl text-muted-foreground leading-normal">
                                        Up to{" "}
                                        <span className="font-bold text-foreground">
                                            3 CV↔JD scans
                                        </span>{" "}
                                        per month
                                    </p>
                                </div>
                            </div>

                            <div className={PRICE_AREA_H}>
                                <span className="text-5xl font-extrabold tracking-tighter text-foreground">
                                    {pricingData.currency}
                                    {pricingData.free_tier?.price ?? 0}
                                </span>
                            </div>

                            <div>
                                <Button
                                    onClick={() => router.push("/dashboard")}
                                    className="w-full h-12 rounded-full text-base font-bold mb-8 bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm transition-all"
                                >
                                    Try Now
                                </Button>
                                <div className="mt-2 text-left">
                                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-6" />
                                    <ul className="space-y-3">
                                        {(pricingData.free_tier?.features || freeFeatures).map(
                                            (f: string) => (
                                                <li
                                                    key={f}
                                                    className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400"
                                                >
                                                    <Check className="w-4 h-4 mt-0.5 text-green-500" />
                                                    <span className="leading-snug">{f}</span>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>)}

                        {/* PAY-AS-YOU-GO CARD, if packs exist */}
                        {pricingData.credit_packs &&
                            pricingData.credit_packs.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={`relative flex flex-col h-full ${CARD_MIN_H} p-6 rounded-[2rem] bg-white dark:bg-slate-900 border-[1.5px] border-amber-400 dark:border-amber-500/50 shadow-xl shadow-amber-500/5 transition-all duration-300`}
                                >
                                    <div className={TITLE_H}>
                                        <h3 className="text-2xl font-bold text-foreground">
                                            Pay-as-you-go
                                        </h3>
                                    </div>
                                    <div className={DESC_H}>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Buy once, use within 3 months.
                                        </p>
                                    </div>

                                    <div className={SELECTION_AREA_H}>
                                        <div className="w-full relative group" ref={dropdownRef}>
                                            <div
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className={`
                          relative w-full rounded-xl py-3 pl-4 pr-12 cursor-pointer transition-all duration-300 ease-out
                          border backdrop-blur-sm
                          ${isDropdownOpen
                                                        ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)]"
                                                        : "border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    }
                        `}
                                            >
                                                <span className="block text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">
                                                    Select Pack
                                                </span>
                                                <span className="block text-lg font-bold text-foreground tracking-tight leading-none">
                                                    {cleanPackageName(selectedPack?.name || "")}
                                                </span>

                                                <div
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-300 ease-in-out"
                                                    style={{
                                                        transform: isDropdownOpen
                                                            ? "translateY(-50%) rotate(180deg)"
                                                            : "translateY(-50%) rotate(0deg)",
                                                    }}
                                                >
                                                    <ChevronDown
                                                        className={`h-5 w-5 ${isDropdownOpen ? "text-blue-500" : ""
                                                            }`}
                                                    />
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                                        className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl shadow-slate-400/20 dark:shadow-black/50 z-50 overflow-hidden ring-1 ring-black/5"
                                                    >
                                                        <div className="max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 py-2">
                                                            {pricingData.credit_packs.map((pack: any) => {
                                                                const isSelected =
                                                                    selectedPackId === pack.id;
                                                                return (
                                                                    <div
                                                                        key={pack.id}
                                                                        onClick={() => {
                                                                            setSelectedPackId(pack.id);
                                                                            setIsDropdownOpen(false);
                                                                        }}
                                                                        className={`
                                      relative flex items-center justify-between px-4 py-3.5 cursor-pointer transition-all duration-200
                                      border-l-2
                                      ${isSelected
                                                                                ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-600"
                                                                                : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                                                                            }
                                    `}
                                                                    >
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span
                                                                                className={`text-sm font-bold tracking-tight ${isSelected
                                                                                    ? "text-blue-700 dark:text-blue-400"
                                                                                    : "text-slate-700 dark:text-slate-200"
                                                                                    }`}
                                                                            >
                                                                                {cleanPackageName(pack.name)}
                                                                            </span>
                                                                            <span
                                                                                className={`text-xs ${isSelected
                                                                                    ? "text-blue-600/80 dark:text-blue-400/70"
                                                                                    : "text-slate-400"
                                                                                    }`}
                                                                            >
                                                                                {pricingData.currency}
                                                                                {pack.price}
                                                                            </span>
                                                                        </div>

                                                                        {isSelected && (
                                                                            <motion.div
                                                                                initial={{ scale: 0 }}
                                                                                animate={{ scale: 1 }}
                                                                                className="bg-blue-600 text-white rounded-full p-0.5"
                                                                            >
                                                                                <Check className="h-3 w-3 stroke-[3]" />
                                                                            </motion.div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className={PRICE_AREA_H}>
                                        <span className="text-5xl font-extrabold tracking-tighter text-foreground">
                                            {pricingData.currency}
                                            {selectedPack?.price}
                                        </span>
                                        <span className="text-sm text-muted-foreground font-medium ml-1 mt-auto pb-1">
                                            / one-time
                                        </span>
                                    </div>

                                    <div>
                                        {isIndia ? (
                                            <Button
                                                onClick={() => {
                                                    fetch("/api/loops/event", {
                                                        method: "POST",
                                                        body: JSON.stringify({
                                                            eventName: "upgrade_intent",
                                                            properties: { source: "pricing_page", plan_type: "pay_as_you_go", pack_id: selectedPackId }
                                                        }),
                                                    }).catch(e => console.error(e));
                                                    if (selectedPack) {
                                                        setCheckoutPlan({
                                                            id: selectedPackId,
                                                            name: cleanPackageName(selectedPack.name),
                                                            price: selectedPack.price,
                                                            currency: pricingData.currency,
                                                            currencyCode: pricingData.currencyCode || 'INR',
                                                            period: 'one-time',
                                                            credits: selectedPack.credits,
                                                        });
                                                        setCheckoutFlow('pack');
                                                        setIsCheckoutOpen(true);
                                                    }
                                                }}
                                                disabled={processingPackage !== null}
                                                className="w-full h-12 rounded-full text-base font-bold mb-8 bg-[#1877F2] hover:bg-blue-600 text-white shadow-sm transition-all"
                                            >
                                                {processingPackage ? (
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                ) : (
                                                    "Buy Now"
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="w-full mb-8 relative z-0 min-h-[52px]" style={{ colorScheme: "light" }}>
                                                <Button
                                                    disabled
                                                    className="w-full h-12 rounded-full text-base font-bold mb-8 bg-muted text-muted-foreground cursor-not-allowed"
                                                >
                                                    Coming Soon (PayPal)
                                                </Button>
                                            </div>
                                        )}
                                        <div className="mt-2 text-left">
                                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-6" />
                                            <ul className="space-y-3">
                                                {creditsFeatures.slice(0, 5).map((f) => (
                                                    <li
                                                        key={f}
                                                        className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400"
                                                    >
                                                        <Check className="w-4 h-4 mt-0.5 text-blue-500" />
                                                        <span className="leading-snug">{f}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        {/* SUBSCRIPTIONS CARDS */}
                        {pricingData.subscriptions.map((sub: any, idx: number) => {
                            const isQuarterly = sub.id?.toLowerCase?.().includes("quarter");
                            const isAnnual = sub.id?.toLowerCase?.().includes("annual");
                            const isMonthly = !isQuarterly && !isAnnual;
                            const cta = isQuarterly ? "Buy Now" : "Buy Now";

                            // Dynamic feature list based on plan type
                            const currentPlanFeatures = isAnnual
                                ? [
                                    `${sub.credits || 2400} CV↔JD scans`,
                                    ...proFeatures.slice(1, 4),
                                ]
                                : [
                                    `${isQuarterly ? "700" : "200"} CV↔JD scans`,
                                    ...proFeatures.slice(1, 4),
                                ];

                            return (
                                <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                    className={`relative flex flex-col h-full ${CARD_MIN_H} p-6 rounded-[2rem] bg-white dark:bg-slate-900 border-[3px] ${sub.id === "pro-monthly-inr" ||
                                        sub.id === "pro-monthly-usd" ||
                                        sub.id === "pro-monthly-eur" ||
                                        sub.id === "pro-monthly-gbp"
                                        ? "border-[#ffc83e]"
                                        : isAnnual
                                            ? "border-emerald-400 dark:border-emerald-500"
                                            : "border-indigo-400 dark:border-indigo-500"
                                        } shadow-xl transition-all duration-300`}
                                >
                                    {isMonthly && (
                                        <div
                                            className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-lg z-20 border-2 border-white dark:border-slate-900 ${sub.id === "pro-monthly-inr" ||
                                                sub.id === "pro-monthly-usd" ||
                                                sub.id === "pro-monthly-eur" ||
                                                sub.id === "pro-monthly-gbp"
                                                ? "bg-[#ffc83e] text-slate-900"
                                                : "bg-primary dark:bg-primary text-white dark:text-primary-foreground"
                                                }`}
                                        >
                                            Most Popular
                                        </div>
                                    )}

                                    {isQuarterly && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest shadow-lg z-20 border-2 border-white dark:border-slate-900">
                                            Best Value
                                        </div>
                                    )}

                                    {isAnnual && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-bold uppercase tracking-widest shadow-lg z-20 border-2 border-white dark:border-slate-900">
                                            CAREER BUILDER
                                        </div>
                                    )}

                                    <div className={TITLE_H}>
                                        <div className="flex items-center flex-wrap gap-2">
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {sub.name}
                                            </h3>
                                            {isAnnual ? (
                                                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-sm">
                                                    {pricingData.currency}{Math.round(sub.price / 12)}/MONTH
                                                </span>
                                            ) : (
                                                <span className="bg-[#5c3bfa] text-white text-[10px] font-bold px-2 py-1 rounded-sm">
                                                    {sub.discount || "75% OFF"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={DESC_H}>
                                        <p className="text-sm text-muted-foreground">
                                            {isAnnual
                                                ? "One-time payment • No auto-renewal"
                                                : isIndia
                                                    ? "Flexible – cancel anytime"
                                                    : `Auto-renews ${sub.billing}`}
                                        </p>
                                    </div>

                                    <div className={SELECTION_AREA_H}>
                                        <div className="w-full">
                                            {isAnnual ? (
                                                <p className="text-xl text-muted-foreground leading-normal">
                                                    Includes{" "}
                                                    <span className="font-bold text-foreground">
                                                        {sub.credits || 2400} credits
                                                    </span>{" "}
                                                    for 12 months
                                                </p>
                                            ) : isMonthly ? (
                                                <p className="text-xl text-muted-foreground leading-normal">
                                                    Use up to{" "}
                                                    <span className="font-bold text-foreground">
                                                        {sub.credits || 200} credits
                                                    </span>{" "}
                                                    per month
                                                </p>
                                            ) : (
                                                <p className="text-xl text-muted-foreground leading-normal">
                                                    Includes{" "}
                                                    <span className="font-bold text-foreground">
                                                        {/* UPDATED: Default fallback updated to 700 */}
                                                        {sub.credits || 700} credits
                                                    </span>{" "}
                                                    for 3 months
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className={PRICE_AREA_H}>
                                        <span className="text-5xl font-extrabold tracking-tighter text-foreground">
                                            {pricingData.currency}
                                            {sub.price}
                                        </span>
                                        <span className="text-sm text-muted-foreground font-medium ml-1 mt-auto pb-1">
                                            /{sub.period}
                                        </span>
                                    </div>

                                    <div>
                                        {isIndia ? (
                                            <Button
                                                onClick={() => {
                                                    fetch("/api/loops/event", {
                                                        method: "POST",
                                                        body: JSON.stringify({
                                                            eventName: "upgrade_intent",
                                                            properties: { source: "pricing_page", plan_type: "subscription", plan_id: sub.id }
                                                        }),
                                                    }).catch(e => console.error(e));
                                                    setCheckoutPlan({
                                                        id: sub.id,
                                                        name: sub.name,
                                                        price: sub.price,
                                                        currency: pricingData.currency,
                                                        currencyCode: pricingData.currencyCode || 'INR',
                                                        period: sub.period,
                                                        credits: sub.credits,
                                                    });
                                                     setCheckoutFlow('razorpay-sub');
                                                    setIsCheckoutOpen(true);
                                                }}
                                                className="w-full h-12 rounded-full text-base font-bold mb-8 shadow-sm transition-all bg-[#1877F2] hover:bg-blue-600 text-white"
                                            >
                                                {cta}
                                            </Button>
                                        ) : (
                                            <div
                                                className="w-full mb-8 relative z-0 min-h-[52px]"
                                                style={{ colorScheme: "light" }}
                                            >
                                                {(sub as any).paypalPlanId ? (
                                                    <PayPalButtons
                                                        fundingSource="paypal"

                                                        // 2. Updated styling for high visibility
                                                        style={{
                                                            layout: "vertical",
                                                            color: "gold",      // Changed from silver to gold for better contrast
                                                            shape: "pill",
                                                            label: "subscribe",
                                                            height: 52,
                                                            tagline: false,

                                                        }}
                                                        onClick={(data, actions) => {
                                                            // Track intent
                                                            fetch("/api/loops/event", {
                                                                method: "POST",
                                                                body: JSON.stringify({
                                                                    eventName: "upgrade_intent",
                                                                    properties: { source: "pricing_page", plan_type: "paypal_subscription", plan_id: sub.id }
                                                                }),
                                                            }).catch(e => console.error(e));

                                                            // Check login BEFORE popup opens
                                                            if (!session && !isAuthenticated) {
                                                                toast({
                                                                    title: "Login Required",
                                                                    description: "Please sign in to subscribe to a plan.",
                                                                    variant: "destructive",
                                                                });
                                                                router.push("/signin?returnTo=/pricing");
                                                                return actions.reject();
                                                            }
                                                            return actions.resolve();
                                                        }}
                                                        createSubscription={async (data, actions) => {
                                                            try {
                                                                console.log(
                                                                    "createSubscription for:",
                                                                    sub.id,
                                                                    "paypalPlanId:",
                                                                    (sub as any).paypalPlanId
                                                                );

                                                                // Use paypalPlanId directly from subscription data
                                                                const planId = (sub as any).paypalPlanId;

                                                                if (!planId) {
                                                                    throw new Error("PayPal Plan ID not configured for this subscription");
                                                                }

                                                                return actions.subscription.create({
                                                                    plan_id: planId, // should be P-...
                                                                });
                                                            } catch (err: any) {
                                                                console.error(
                                                                    "PayPal createSubscription error:",
                                                                    err
                                                                );
                                                                toast({
                                                                    title: "Error",
                                                                    description:
                                                                        err.message ||
                                                                        "Failed to initiate subscription",
                                                                    variant: "destructive",
                                                                });
                                                                throw err; // important: rethrow so PayPal closes popup
                                                            }
                                                        }}
                                                        onApprove={async (data, actions) => {
                                                            try {
                                                                console.log(
                                                                    "PayPal Approved. SubID:",
                                                                    data.subscriptionID
                                                                );

                                                                const res = await fetch(
                                                                    "/api/payment/verify-paypal",
                                                                    {
                                                                        method: "POST",
                                                                        headers: {
                                                                            "Content-Type": "application/json",
                                                                        },
                                                                        body: JSON.stringify({
                                                                            subscriptionId: data.subscriptionID,
                                                                        }),
                                                                    }
                                                                );
                                                                const result = await res.json();

                                                                if (result.success) {
                                                                    refreshBalance();

                                                                    // Redirect to dedicated success page
                                                                    const successParams = new URLSearchParams();
                                                                    if (result.credits) successParams.set('credits', String(result.credits));
                                                                    if (result.amount) successParams.set('amount', String(result.amount));
                                                                    if (result.currency) successParams.set('currency', result.currency);
                                                                    if (result.plan_id) successParams.set('plan_id', result.plan_id);
                                                                    successParams.set('source', 'MainApp');
                                                                    router.push(`/payment/success?${successParams.toString()}`);
                                                                } else {
                                                                    toast({
                                                                        title: "Verification Pending",
                                                                        description:
                                                                            "We're confirming your subscription. Please check your dashboard.",
                                                                    });
                                                                    const returnTo = getReturnTo();
                                                                    localStorage.removeItem("returnTo");
                                                                    router.push(returnTo);
                                                                }
                                                            } catch (e) {
                                                                console.error("PayPal verification failed:", e);
                                                                toast({
                                                                    title: "Payment Recorded",
                                                                    description:
                                                                        "Your payment was successful. We'll update your credits shortly.",
                                                                });
                                                                const returnTo = getReturnTo();
                                                                localStorage.removeItem("returnTo");
                                                                router.push(returnTo);
                                                            }
                                                        }}
                                                        onError={(err) => {
                                                            console.error("PayPal onError:", err);
                                                            toast({
                                                                title: "PayPal Error",
                                                                description:
                                                                    "The payment window was closed due to an error. Check console for details.",
                                                                variant: "destructive",
                                                            });
                                                        }}
                                                    />
                                                ) : isAnnual ? (
                                                    /* Annual Plan - One-time Payment via redirect to PayPal */
                                                    <Button
                                                        onClick={() => {
                                                            fetch("/api/loops/event", {
                                                                method: "POST",
                                                                body: JSON.stringify({
                                                                    eventName: "upgrade_intent",
                                                                    properties: { source: "pricing_page", plan_type: "annual_one_time", plan_id: sub.id }
                                                                }),
                                                            }).catch(e => console.error(e));

                                                            if (!session && !isAuthenticated) {
                                                                toast({
                                                                    title: "Login Required",
                                                                    description: "Please sign in to purchase this plan.",
                                                                    variant: "destructive",
                                                                });
                                                                router.push("/signin?returnTo=/pricing");
                                                                return;
                                                            }

                                                            setCheckoutPlan({
                                                                id: sub.id,
                                                                name: sub.name,
                                                                price: sub.price,
                                                                currency: pricingData.currency,
                                                                currencyCode: pricingData.currencyCode || 'USD',
                                                                period: sub.period,
                                                                credits: sub.credits,
                                                            });
                                                            setCheckoutFlow('paypal-annual');
                                                            setIsCheckoutOpen(true);
                                                        }}
                                                        className="w-full h-12 rounded-full text-base font-bold bg-[#FFC439] hover:bg-[#F0B929] text-[#003087] shadow-sm transition-all"
                                                    >
                                                        Buy Now
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        disabled
                                                        className="w-full h-12 rounded-full text-base font-bold bg-muted text-muted-foreground cursor-not-allowed"
                                                    >
                                                        Coming Soon (PayPal)
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-2 text-left">
                                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-6" />
                                            <ul className="space-y-3">
                                                {currentPlanFeatures.map((f) => (
                                                    <li
                                                        key={f}
                                                        className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400"
                                                    >
                                                        <Check className="w-4 h-4 mt-0.5 text-indigo-500" />
                                                        <span className="leading-snug">{f}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </PayPalScriptProvider>
                </div>
            </section>

            {/* Checkout Modal */}
            <CheckoutModal
                plan={checkoutPlan}
                isOpen={isCheckoutOpen}
                onClose={() => {
                    setIsCheckoutOpen(false);
                    setCheckoutProcessing(false);
                }}
                onConfirm={async (result: CheckoutResult) => {
                    setCheckoutProcessing(true);
                    try {
                        if (checkoutFlow === 'pack') {
                            await handlePackPurchase(result.couponCode);
                        } else if (checkoutFlow === 'razorpay-sub') {
                            await handleSubscriptionRazorpay(result.planId, result.couponCode);
                        } else if (checkoutFlow === 'paypal-annual') {
                            toast({
                                title: "Processing...",
                                description: "Redirecting to PayPal...",
                            });
                            const res = await fetch("/api/payment/create-paypal-order", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    planKey: result.planId,
                                    ...(result.couponCode && { couponCode: result.couponCode }),
                                }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Failed to create order");
                            if (data.approvalUrl) {
                                window.location.href = data.approvalUrl;
                            } else {
                                throw new Error("No approval URL returned");
                            }
                        }
                    } catch (err: any) {
                        toast({
                            title: "Payment Error",
                            description: err.message || "Something went wrong",
                            variant: "destructive",
                        });
                    } finally {
                        setCheckoutProcessing(false);
                        setIsCheckoutOpen(false);
                    }
                }}
                processingPayment={checkoutProcessing}
            />


        </main>
    );
}
