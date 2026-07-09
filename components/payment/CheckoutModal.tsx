"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check, ShieldCheck } from "lucide-react";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

export interface CheckoutPlan {
    id: string;
    name: string;
    price: number;
    currency: string;        // symbol like ₹, $, €, £
    currencyCode: string;    // ISO code like INR, USD, EUR, GBP
    period?: string;         // "month", "3 months", "year"
    credits?: number;
}

export interface CheckoutResult {
    planId: string;
    couponCode?: string;
    finalPrice: number;
    discountAmount: number;
}

interface CheckoutModalProps {
    plan: CheckoutPlan | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (result: CheckoutResult) => void;
    processingPayment: boolean;
}

type CouponStatus = "idle" | "validating" | "applied" | "error";

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */

export default function CheckoutModal({
    plan,
    isOpen,
    onClose,
    onConfirm,
    processingPayment,
}: CheckoutModalProps) {
    const [couponCode, setCouponCode] = useState("");
    const [couponStatus, setCouponStatus] = useState<CouponStatus>("idle");
    const [couponMessage, setCouponMessage] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);
    const [finalPrice, setFinalPrice] = useState(0);
    const [showCouponField, setShowCouponField] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset state when plan changes or modal opens
    useEffect(() => {
        if (plan && isOpen) {
            setCouponCode("");
            setCouponStatus("idle");
            setCouponMessage("");
            setDiscountAmount(0);
            setFinalPrice(plan.price);
            setShowCouponField(false);
        }
    }, [plan, isOpen]);

    if (!plan) return null;

    /* ── Apply Coupon ── */
    const handleApplyCoupon = async () => {
        const trimmed = couponCode.trim();
        if (!trimmed) return;

        setCouponStatus("validating");
        setCouponMessage("");

        try {
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: trimmed,
                    planId: plan.id,
                    amount: plan.price,
                    currency: plan.currencyCode,
                }),
            });

            const data = await res.json();

            if (data.valid) {
                setDiscountAmount(data.discountAmount);
                setFinalPrice(data.finalAmount);
                setCouponMessage(data.message);
                setCouponStatus("applied");

                // PostHog
                if (typeof window !== "undefined" && (window as any).posthog) {
                    (window as any).posthog.capture("coupon_applied", {
                        coupon_code: trimmed.toUpperCase(),
                        discount_amount: data.discountAmount,
                        plan_id: plan.id,
                    });
                }
            } else {
                setCouponMessage(data.message || "Invalid coupon code.");
                setCouponStatus("error");

                if (typeof window !== "undefined" && (window as any).posthog) {
                    (window as any).posthog.capture("coupon_denied", {
                        coupon_code: trimmed.toUpperCase(),
                        error_reason: data.message,
                    });
                }
            }
        } catch {
            setCouponMessage("Something went wrong. Please try again.");
            setCouponStatus("error");
        }
    };

    /* ── Remove Coupon ── */
    const handleRemoveCoupon = () => {
        setCouponCode("");
        setCouponStatus("idle");
        setCouponMessage("");
        setDiscountAmount(0);
        setFinalPrice(plan.price);
        setShowCouponField(false);
    };

    /* ── Confirm ── */
    const handleConfirm = () => {
        onConfirm({
            planId: plan.id,
            couponCode: couponStatus === "applied" ? couponCode.trim().toUpperCase() : undefined,
            finalPrice,
            discountAmount,
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!processingPayment ? onClose : undefined}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

                            {/* Header */}
                            <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-xl font-bold text-foreground">
                                    Order Summary
                                </h2>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Review your order before payment
                                </p>
                                {!processingPayment && (
                                    <button
                                        onClick={onClose}
                                        className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            {/* Plan details */}
                            <div className="px-6 py-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-foreground text-lg">
                                            {plan.name}
                                        </p>
                                        {plan.credits && (
                                            <p className="text-sm text-muted-foreground">
                                                {plan.credits} credits
                                                {plan.period ? ` • ${plan.period}` : ""}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-lg font-bold text-foreground">
                                        {plan.currency}{plan.price}
                                    </p>
                                </div>

                                {/* Divider */}
                                <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

                                {/* ── Coupon: minimal, collapsed by default ── */}
                                {couponStatus === "applied" ? (
                                    /* Tiny inline applied badge — not a full success card */
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <Check className="h-3 w-3" />
                                            <span className="font-medium">{couponCode.toUpperCase()}</span>
                                            <span className="text-green-500/70">applied</span>
                                        </span>
                                        <button
                                            onClick={handleRemoveCoupon}
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : !showCouponField ? (
                                    /* Collapsed: just a tiny muted link, no icon, no input */
                                    <button
                                        onClick={() => {
                                            setShowCouponField(true);
                                            setTimeout(() => inputRef.current?.focus(), 100);
                                        }}
                                        className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors text-left"
                                    >
                                        Have a code?
                                    </button>
                                ) : (
                                    /* Expanded: compact single-line input */
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-1.5"
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value.toUpperCase());
                                                    if (couponStatus === "error") setCouponStatus("idle");
                                                }}
                                                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                                                placeholder="Promo code"
                                                disabled={couponStatus === "validating"}
                                                className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-slate-400/40 disabled:opacity-50 transition-all uppercase tracking-wider"
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode.trim() || couponStatus === "validating"}
                                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-muted-foreground/40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shrink-0"
                                            >
                                                {couponStatus === "validating" ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    "Apply"
                                                )}
                                            </button>
                                        </div>
                                        {couponStatus === "error" && couponMessage && (
                                            <p className="text-[11px] text-red-500/80 dark:text-red-400/80">
                                                {couponMessage}
                                            </p>
                                        )}
                                    </motion.div>
                                )}

                                {/* Divider */}
                                <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

                                {/* Price breakdown */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="text-foreground font-medium">
                                            {plan.currency}{plan.price}
                                        </span>
                                    </div>

                                    {discountAmount > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-green-600 dark:text-green-400">
                                                Discount
                                            </span>
                                            <span className="text-green-600 dark:text-green-400 font-medium">
                                                -{plan.currency}{discountAmount}
                                            </span>
                                        </motion.div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-base font-bold text-foreground">
                                            Total
                                        </span>
                                        <span className="text-2xl font-extrabold text-foreground tracking-tight">
                                            {plan.currency}{finalPrice}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6 pt-2 space-y-3">
                                <button
                                    onClick={handleConfirm}
                                    disabled={processingPayment}
                                    className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white shadow-lg shadow-blue-500/25 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {processingPayment ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Processing…
                                        </>
                                    ) : (
                                        <>Proceed to Payment</>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Secure payment via Razorpay / PayPal
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
