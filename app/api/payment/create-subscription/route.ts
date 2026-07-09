import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";
import { createRazorpayOrder } from "@/payment/razorpay";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Product from "@/models/Product";
import { validateCoupon, redeemCoupon } from "@/lib/couponService";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        // 1. Check for NextAuth session
        const session = await getServerSession(authOptions);
        let userEmail = session?.user?.email;

        // 2. Fallback to Phone/JWT auth if no session
        if (!userEmail) {
            const { verifyAuth } = await import("@/lib/auth");
            const phoneUser = await verifyAuth(req);
            if (phoneUser) {
                const userDoc = await User.findById(phoneUser.userId);
                userEmail = userDoc?.email;
            }
        }

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { planKey, returnTo, couponCode } = body;

        // Fetch plan from Database
        const plan = await Product.findById(planKey);

        if (!plan) {
            return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
        }

        const subscriptionId = `SUB_${Date.now()}`;

        // Determine provider based on currency/region
        // Assuming INR -> RAZORPAY, others -> PAYPAL
        const provider = plan.prices.find((p: any) => p.currency === 'INR') ? 'RAZORPAY' : 'PAYPAL';

        // Get price for the plan's primary region/currency (or handle logic to pick correct price based on user region if passed)
        // For simplicity, we can use the basePriceUSD if it's international, or the specific regional price.
        // However, the hardcoded logic was explicit. Let's infer:
        // If planKey has 'inr', 'usd', 'eur', 'gbp' suffix, pick that price.
        let price = plan.basePriceUSD;
        let currency = 'USD';

        if (planKey.endsWith('inr')) {
            const p = plan.prices.find((x: any) => x.currency === 'INR');
            if (p) { price = p.amount; currency = 'INR'; }
        } else if (planKey.endsWith('eur')) {
            const p = plan.prices.find((x: any) => x.currency === 'EUR');
            if (p) { price = p.amount; currency = 'EUR'; }
        } else if (planKey.endsWith('gbp')) {
            const p = plan.prices.find((x: any) => x.currency === 'GBP');
            if (p) { price = p.amount; currency = 'GBP'; }
        } else {
            // Default USD
            const p = plan.prices.find((x: any) => x.currency === 'USD');
            if (p) { price = p.amount; currency = 'USD'; }
        }

        // ── Coupon handling ──
        let finalPrice = price;
        let appliedCoupon: string | undefined;
        let couponDiscount: number | undefined;

        if (couponCode) {
            const couponResult = await validateCoupon(couponCode, planKey, price, currency);
            if (!couponResult.valid) {
                return NextResponse.json({ error: couponResult.message }, { status: 400 });
            }
            const redeemed = await redeemCoupon(couponCode);
            if (!redeemed) {
                return NextResponse.json({ error: 'Coupon usage limit reached.' }, { status: 400 });
            }
            finalPrice = couponResult.finalAmount;
            appliedCoupon = couponCode.trim().toUpperCase();
            couponDiscount = couponResult.discountAmount;
        }

        if (provider === "RAZORPAY") {
            // SWITCH TO ORDER FLOW (One-time payment for Credits)

            const orderId = `ORDER_${Date.now()}`;

            // Derive validity: 'month' -> 1, '3 months' -> 3, 'year' -> 12
            let validityMonths = 1;
            if (plan.period === '3 months') validityMonths = 3;
            else if (plan.period === 'year') validityMonths = 12;

            // Create Order
            const razorpayOrder = await createRazorpayOrder(
                finalPrice,
                'INR',
                orderId
            );

            // Create Transaction Record
            await Transaction.create({
                userId: user._id,
                gateway: 'RAZORPAY',
                orderId: orderId,
                razorpayOrderId: razorpayOrder.id,
                amount: finalPrice,
                currency: currency,
                credits: plan.credits || 0,
                status: 'pending',
                packageType: planKey,
                validityMonths: validityMonths,
                paymentMethod: 'razorpay_pg_pro',
                ...(appliedCoupon && { couponCode: appliedCoupon, discountAmount: couponDiscount }),
            });

            return NextResponse.json({
                provider: "RAZORPAY",
                razorpay_order_id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: 'INR',
                orderId: orderId, // For frontend tracking
                isOrder: true
            });

        } else if (provider === "PAYPAL") {
            // Check if plan has a PayPal Plan ID
            if (!plan.paypalPlanId) return NextResponse.json({ error: "Configuration Error: Missing PayPal Plan ID" }, { status: 500 });

            return NextResponse.json({
                provider: "PAYPAL",
                planId: plan.paypalPlanId
            });
        }

        return NextResponse.json({ error: "Provider not supported" }, { status: 400 });

    } catch (error: any) {
        console.error("Create Subscription Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
