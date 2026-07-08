import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/couponService';

/* ─────────────────────────────────────────────
   Simple in-memory rate limiter
   10 requests per minute per IP
   ───────────────────────────────────────────── */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT;
}

/* ─────────────────────────────────────────────
   POST /api/coupons/validate
   ───────────────────────────────────────────── */

export async function POST(req: NextRequest) {
    try {
        // Rate limit
        const ip =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            'unknown';

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { valid: false, message: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { code, planId, amount, currency } = body;

        if (!code || !planId || amount === undefined || !currency) {
            return NextResponse.json(
                { valid: false, message: 'Missing required fields.' },
                { status: 400 }
            );
        }

        const result = await validateCoupon(code, planId, amount, currency);

        return NextResponse.json(result, { status: result.valid ? 200 : 200 });
    } catch (error: any) {
        console.error('Coupon validate error:', error);
        return NextResponse.json(
            { valid: false, message: 'Something went wrong.' },
            { status: 500 }
        );
    }
}
