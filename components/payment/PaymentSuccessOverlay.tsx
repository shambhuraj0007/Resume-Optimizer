"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { trackPaymentMade } from "@/lib/analytics";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

export interface PaymentSuccessData {
    credits: number;
    amount: number;
    currency: string;       // ISO code: USD, INR, EUR, GBP
    planId: string;
    source: string;         // MainApp, paywall_b, payment_status
    redirectTo?: string;    // defaults to /ats-checker
}

interface PaymentSuccessOverlayProps {
    data: PaymentSuccessData;
    onComplete?: () => void;
}

/* ─────────────────────────────────────────────
   Confetti Particle
   ───────────────────────────────────────────── */

const CONFETTI_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F1948A", "#82E0AA",
];

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    delay: number;
    type: "circle" | "rect" | "triangle";
}

function generateParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -(Math.random() * 30 + 10),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.8,
        type: (["circle", "rect", "triangle"] as const)[Math.floor(Math.random() * 3)],
    }));
}

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */

export default function PaymentSuccessOverlay({
    data,
    onComplete,
}: PaymentSuccessOverlayProps) {
    const { credits, amount, currency, planId, source, redirectTo = "/ats-checker" } = data;

    const [countdown, setCountdown] = useState(6);
    const [particles] = useState(() => generateParticles(60));
    const hasFiredRef = useRef(false);
    const router = useRouter();

    // ── Fire GTM event ONCE (idempotent via sessionStorage + ref) ──
    useEffect(() => {
        if (hasFiredRef.current) return;

        const storageKey = `payment_tracked_${planId}_${amount}`;
        if (typeof window !== "undefined" && sessionStorage.getItem(storageKey)) {
            hasFiredRef.current = true;
            return;
        }

        trackPaymentMade({
            value: amount,
            currency,
            plan_id: planId,
            credits_added: credits,
            source,
        });

        if (typeof window !== "undefined") {
            sessionStorage.setItem(storageKey, "1");
        }
        hasFiredRef.current = true;
    }, [amount, currency, planId, credits, source]);

    // ── Countdown timer ──
    useEffect(() => {
        if (countdown <= 0) {
            onComplete?.();
            router.push(redirectTo);
            return;
        }

        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, redirectTo, router, onComplete]);

    // ── Format currency symbol ──
    const currencySymbol = useCallback(() => {
        const map: Record<string, string> = {
            USD: "$", INR: "₹", EUR: "€", GBP: "£",
        };
        return map[currency] || currency;
    }, [currency]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                style={{ backdropFilter: "blur(8px)" }}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Confetti particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{
                                x: `${p.x}vw`,
                                y: `${p.y}vh`,
                                rotate: 0,
                                opacity: 1,
                            }}
                            animate={{
                                y: "110vh",
                                rotate: p.rotation + 720,
                                opacity: [1, 1, 1, 0.8, 0],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                delay: p.delay,
                                ease: "easeIn",
                            }}
                            style={{
                                position: "absolute",
                                width: p.size,
                                height: p.type === "rect" ? p.size * 1.5 : p.size,
                                backgroundColor: p.color,
                                borderRadius: p.type === "circle" ? "50%" :
                                    p.type === "triangle" ? "0" : "2px",
                                clipPath: p.type === "triangle"
                                    ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                                    : undefined,
                            }}
                        />
                    ))}
                </div>

                {/* Success Card */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}
                    className="relative z-10 w-full max-w-md mx-4"
                >
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center border border-slate-200 dark:border-slate-700">

                        {/* Party Poppers */}
                        <div className="text-5xl mb-4 flex items-center justify-center gap-3">
                            <motion.span
                                initial={{ rotate: -30, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", delay: 0.3 }}
                            >
                                🎉
                            </motion.span>
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.4 }}
                            >
                                🎊
                            </motion.span>
                            <motion.span
                                initial={{ rotate: 30, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", delay: 0.5 }}
                            >
                                🎉
                            </motion.span>
                        </div>

                        {/* Green checkmark */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                        >
                            <motion.svg
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="w-8 h-8 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <motion.path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                />
                            </motion.svg>
                        </motion.div>

                        {/* Heading */}
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Payment successful.
                        </h2>

                        {/* Credits added */}
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-1">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                                {credits} credits
                            </span>{" "}
                            added to your account.
                        </p>

                        {/* Amount paid badge */}
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 mb-6">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Paid: {currencySymbol()}{amount}
                            </span>
                        </div>

                        {/* Countdown */}
                        <div className="mt-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                Redirecting you to your dashboard in{" "}
                                <span className="font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                                    {countdown}
                                </span>{" "}
                                second{countdown !== 1 ? "s" : ""}…
                            </p>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 6, ease: "linear" }}
                                    className="h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full"
                                />
                            </div>
                        </div>

                        {/* Skip link */}
                        <button
                            onClick={() => {
                                onComplete?.();
                                router.push(redirectTo);
                            }}
                            className="mt-4 text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium transition-colors"
                        >
                            Go now →
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
