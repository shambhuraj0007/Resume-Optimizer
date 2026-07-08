"use client";

import { useState, useRef } from "react";
import { Loader2, Check, X, Tag } from "lucide-react";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

export interface CouponResult {
    code: string;
    discountAmount: number;
    finalAmount: number;
    message: string;
}

interface CouponInputProps {
    planId: string;
    amount: number;         // Original price in smallest currency unit
    currency: string;       // 'INR', 'USD', etc.
    onApplied: (result: CouponResult) => void;
    onRemoved: () => void;
}

type Status = "idle" | "open" | "validating" | "success" | "error";

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */

export default function CouponInput({
    planId,
    amount,
    currency,
    onApplied,
    onRemoved,
}: CouponInputProps) {
    const [status, setStatus] = useState<Status>("idle");
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [appliedResult, setAppliedResult] = useState<CouponResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* ── Apply ── */
    const handleApply = async () => {
        const trimmed = code.trim();
        if (!trimmed) return;

        setStatus("validating");
        setMessage("");

        try {
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: trimmed,
                    planId,
                    amount,
                    currency,
                }),
            });

            const data = await res.json();

            if (data.valid) {
                const result: CouponResult = {
                    code: trimmed.toUpperCase(),
                    discountAmount: data.discountAmount,
                    finalAmount: data.finalAmount,
                    message: data.message,
                };
                setAppliedResult(result);
                setMessage(data.message);
                setStatus("success");
                onApplied(result);

                // Analytics — coupon_applied
                if (typeof window !== "undefined" && (window as any).posthog) {
                    (window as any).posthog.capture("coupon_applied", {
                        coupon_code: trimmed.toUpperCase(),
                        discount_amount: data.discountAmount,
                        plan_id: planId,
                    });
                }
            } else {
                setMessage(data.message || "Invalid coupon code.");
                setStatus("error");

                // Analytics — coupon_denied
                if (typeof window !== "undefined" && (window as any).posthog) {
                    (window as any).posthog.capture("coupon_denied", {
                        coupon_code: trimmed.toUpperCase(),
                        error_reason: data.message,
                    });
                }
            }
        } catch {
            setMessage("Something went wrong. Please try again.");
            setStatus("error");
        }
    };

    /* ── Remove ── */
    const handleRemove = () => {
        setCode("");
        setMessage("");
        setAppliedResult(null);
        setStatus("open");
        onRemoved();
    };

    /* ── Render: collapsed state ── */
    if (status === "idle") {
        return (
            <button
                onClick={() => {
                    setStatus("open");
                    setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium mt-2"
            >
                <Tag className="h-3.5 w-3.5" />
                Have a coupon?
            </button>
        );
    }

    /* ── Render: success state ── */
    if (status === "success" && appliedResult) {
        return (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 px-4 py-2.5">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300 flex-1">
                    {appliedResult.code} — {message}
                </span>
                <button
                    onClick={handleRemove}
                    className="p-0.5 rounded-full hover:bg-green-200/60 dark:hover:bg-green-500/20 transition-colors"
                    aria-label="Remove coupon"
                >
                    <X className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </button>
            </div>
        );
    }

    /* ── Render: input state ── */
    return (
        <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        if (status === "error") setStatus("open");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleApply()}
                    placeholder="Enter coupon code"
                    disabled={status === "validating"}
                    className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50 transition-all uppercase"
                />
                <button
                    onClick={handleApply}
                    disabled={!code.trim() || status === "validating"}
                    className="h-9 px-4 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white transition-colors disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                    {status === "validating" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        "Apply"
                    )}
                </button>
            </div>
            {status === "error" && message && (
                <p className="text-xs text-red-500 dark:text-red-400 pl-1">{message}</p>
            )}
        </div>
    );
}
