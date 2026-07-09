'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackPaymentMade } from '@/lib/analytics';

/* ─────────────────────────────────────────────
   Confetti System
   ───────────────────────────────────────────── */

const CONFETTI_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA',
];

interface Particle {
    id: number; x: number; y: number; color: string;
    size: number; rotation: number; delay: number;
    type: 'circle' | 'rect' | 'triangle';
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
        type: (['circle', 'rect', 'triangle'] as const)[Math.floor(Math.random() * 3)],
    }));
}

/* ─────────────────────────────────────────────
   Status type
   ───────────────────────────────────────────── */
type PageStatus = 'verifying' | 'success' | 'failed';

/* ─────────────────────────────────────────────
   Page Content
   ───────────────────────────────────────────── */
function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [status, setStatus] = useState<PageStatus>('verifying');
    const [errorMsg, setErrorMsg] = useState('');
    const [countdown, setCountdown] = useState(6);
    const [particles] = useState(() => generateParticles(60));
    const hasFiredRef = useRef(false);

    // Payment data from verification
    const [paymentData, setPaymentData] = useState<{
        credits: number; amount: number; currency: string; planId: string;
    }>({ credits: 0, amount: 0, currency: 'USD', planId: 'unknown' });

    /* ── Verify payment on mount ── */
    useEffect(() => {
        const verify = async () => {
            try {
                const orderId = searchParams.get('order_id');
                const cfSubscriptionId = searchParams.get('cf_subscriptionId');
                const cfStatus = searchParams.get('cf_status');
                const cfCheckoutStatus = searchParams.get('cf_checkoutStatus');

                // --- One-time Order Flow (Credits) ---
                if (orderId) {
                    let retries = 10;
                    let successData = null;

                    while (retries > 0) {
                        try {
                            const res = await fetch('/api/payment/verify-razorpay', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId }),
                            });
                            const data = await res.json();

                            if (res.ok && (data.success || data.message === 'Already completed')) {
                                successData = data;
                                break;
                            }

                            const s = data.status || '';
                            if (s === 'FAILED' || s === 'failed') {
                                throw new Error(data.error || 'Payment failed or was cancelled.');
                            }
                        } catch (inner: any) {
                            if (inner.message?.includes('failed') || inner.message?.includes('cancelled')) throw inner;
                            console.warn(inner);
                        }

                        retries--;
                        if (retries > 0) await new Promise(r => setTimeout(r, 2000));
                    }

                    if (successData) {
                        setPaymentData({
                            credits: successData.credits || 0,
                            amount: successData.amount || 0,
                            currency: successData.currency || 'USD',
                            planId: successData.plan_id || 'unknown',
                        });
                        setStatus('success');
                        return;
                    }

                    throw new Error('Payment verification timed out. Please check your account or try again.');
                }

                // --- If we have pre-populated data (e.g. from PayPal redirect) ---
                const credits = Number(searchParams.get('credits'));
                const amount = Number(searchParams.get('amount'));
                if (credits > 0 || amount > 0) {
                    setPaymentData({
                        credits,
                        amount,
                        currency: searchParams.get('currency') || 'USD',
                        planId: searchParams.get('plan_id') || 'unknown',
                    });
                    setStatus('success');
                    return;
                }

                throw new Error('Invalid payment session. Please complete payment through the pricing page.');

            } catch (err: any) {
                setErrorMsg(err.message || 'Something went wrong');
                setStatus('failed');
            }
        };

        verify();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Fire GTM event ONCE on success ── */
    useEffect(() => {
        if (status !== 'success' || hasFiredRef.current) return;

        if (searchParams.get('tracked') === 'true') {
            hasFiredRef.current = true;
            return;
        }

        const storageKey = `payment_tracked_${paymentData.planId}_${paymentData.amount}`;
        if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) {
            hasFiredRef.current = true;
            return;
        }

        if (paymentData.credits > 0 || paymentData.amount > 0) {
            trackPaymentMade({
                value: paymentData.amount,
                currency: paymentData.currency,
                plan_id: paymentData.planId,
                credits_added: paymentData.credits,
                source: searchParams.get('source') || 'payment_success',
            });
        }

        if (typeof window !== 'undefined') sessionStorage.setItem(storageKey, '1');
        hasFiredRef.current = true;

        // Append tracked=true to URL to protect against refresh
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('tracked', 'true');
        router.replace(currentUrl.pathname + currentUrl.search);

    }, [status, paymentData, searchParams, router]);

    /* ── Countdown → redirect on success ── */
    useEffect(() => {
        if (status !== 'success') return;
        if (countdown <= 0) {
            router.push('/ats-checker');
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [status, countdown, router]);

    /* ── Currency symbol ── */
    const currencySymbol = useCallback(() => {
        const map: Record<string, string> = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };
        return map[paymentData.currency] || paymentData.currency;
    }, [paymentData.currency]);

    /* ═══════════════════════════════════════
       RENDER: Verifying
       ═══════════════════════════════════════ */
    if (status === 'verifying') {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
            >
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 animate-spin" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Verifying Payment</h1>
                    <p className="text-purple-200/60 text-sm">
                        Please wait while we confirm your payment…
                    </p>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════
       RENDER: Failed
       ═══════════════════════════════════════ */
    if (status === 'failed') {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #1a0a0a 100%)' }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 w-full max-w-md mx-4"
                >
                    <div
                        className="rounded-3xl shadow-2xl p-8 text-center border border-red-500/20"
                        style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
                    >
                        {/* Error icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1 }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.2) 100%)',
                                boxShadow: '0 0 30px rgba(239,68,68,0.3)',
                            }}
                        >
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.div>

                        <h1 className="text-3xl font-bold text-white mb-2">Payment Failed</h1>
                        <p className="text-red-200/70 mb-6">{errorMsg}</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-6 py-3 rounded-xl font-medium text-white transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}
                                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                                onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                            >
                                Check Again
                            </button>
                            <button
                                onClick={() => router.push('/pricing')}
                                className="w-full px-6 py-3 rounded-xl font-medium text-white transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                                }}
                            >
                                Back to Pricing
                            </button>
                            <button
                                onClick={() => router.push('/ats-checker')}
                                className="text-sm text-white/40 hover:text-white/60 transition-colors mt-1"
                            >
                                Go to Dashboard →
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    /* ═══════════════════════════════════════
       RENDER: Success  🎉
       ═══════════════════════════════════════ */
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
            >
                {/* Radial glow */}
                <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(circle at 50% 40%, rgba(139,92,246,0.25) 0%, transparent 60%)' }}
                />

                {/* Confetti */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {particles.map(p => (
                        <motion.div
                            key={p.id}
                            initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: 0, opacity: 1 }}
                            animate={{ y: '110vh', rotate: p.rotation + 720, opacity: [1, 1, 1, 0.8, 0] }}
                            transition={{ duration: 3 + Math.random() * 2, delay: p.delay, ease: 'easeIn' }}
                            style={{
                                position: 'absolute',
                                width: p.size,
                                height: p.type === 'rect' ? p.size * 1.5 : p.size,
                                backgroundColor: p.color,
                                borderRadius: p.type === 'circle' ? '50%' : p.type === 'triangle' ? '0' : '2px',
                                clipPath: p.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
                            }}
                        />
                    ))}
                </div>

                {/* Success card */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.15 }}
                    className="relative z-10 w-full max-w-md mx-4"
                >
                    <div
                        className="rounded-3xl shadow-2xl p-8 text-center border border-white/10"
                        style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
                    >
                        {/* Party Poppers */}
                        <div className="text-5xl mb-4 flex items-center justify-center gap-3">
                            <motion.span initial={{ rotate: -30, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>🎉</motion.span>
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4 }}>🎊</motion.span>
                            <motion.span initial={{ rotate: 30, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}>🎉</motion.span>
                        </div>

                        {/* Green checkmark */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))',
                                boxShadow: '0 0 30px rgba(34,197,94,0.3)',
                            }}
                        >
                            <motion.svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <motion.path
                                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                />
                            </motion.svg>
                        </motion.div>

                        <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
                        <p className="text-lg text-purple-200/80 mb-1">Thank you for your purchase.</p>

                        {/* Credits */}
                        {paymentData.credits > 0 && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="text-lg text-white/90 mt-4 mb-2"
                            >
                                <span className="font-semibold text-green-400">{paymentData.credits} credits</span> added to your account
                            </motion.p>
                        )}

                        {/* Amount badge */}
                        {paymentData.amount > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 mb-6 mt-2"
                                style={{ background: 'rgba(255,255,255,0.1)' }}
                            >
                                <span className="text-sm font-medium text-white/70">
                                    Paid: {currencySymbol()}{paymentData.amount}
                                </span>
                            </motion.div>
                        )}

                        {/* Countdown */}
                        <div className="mt-6">
                            <p className="text-sm text-white/50 mb-3">
                                Redirecting in{' '}
                                <span className="font-bold text-purple-400 tabular-nums">{countdown}</span>{' '}
                                second{countdown !== 1 ? 's' : ''}…
                            </p>
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 6, ease: 'linear' }}
                                    className="h-full rounded-full"
                                    style={{ background: 'linear-gradient(90deg, #8B5CF6, #22C55E)' }}
                                />
                            </div>
                        </div>

                        {/* Skip */}
                        <button
                            onClick={() => router.push('/ats-checker')}
                            className="mt-5 text-sm text-purple-400 hover:text-purple-300 hover:underline font-medium transition-colors"
                        >
                            Go to dashboard now →
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ─────────────────────────────────────────────
   Page Export
   ───────────────────────────────────────────── */
export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto" />
                    <p className="mt-6 text-lg text-purple-200/60 font-medium">Loading…</p>
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
