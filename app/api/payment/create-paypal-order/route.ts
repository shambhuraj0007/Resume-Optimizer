import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Product from "@/models/Product";
import { validateCoupon, redeemCoupon } from "@/lib/couponService";

// PayPal API Configuration
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
    const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("PayPal Token Error:", data);
        throw new Error("Failed to get PayPal access token");
    }
    return data.access_token;
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // Get user session
        const session = await getServerSession(authOptions);
        let userEmail = session?.user?.email;

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
        const { planKey, couponCode } = body;

        if (!planKey) {
            return NextResponse.json({ error: "Missing plan key" }, { status: 400 });
        }

        // Fetch the product from database
        const product = await Product.findById(planKey);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Determine currency and price based on planKey suffix
        let currency = "USD";
        let price = product.basePriceUSD;

        if (planKey.endsWith("-eur")) {
            const eurPrice = product.prices.find((p: any) => p.currency === "EUR");
            if (eurPrice) { price = eurPrice.amount; currency = "EUR"; }
        } else if (planKey.endsWith("-gbp")) {
            const gbpPrice = product.prices.find((p: any) => p.currency === "GBP");
            if (gbpPrice) { price = gbpPrice.amount; currency = "GBP"; }
        } else {
            const usdPrice = product.prices.find((p: any) => p.currency === "USD");
            if (usdPrice) { price = usdPrice.amount; currency = "USD"; }
        }

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

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

        // Create PayPal Order
        const orderId = `ORDER_${Date.now()}`;

        const orderPayload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    reference_id: orderId,
                    description: `${product.name} - ${product.credits} Credits`,
                    amount: {
                        currency_code: currency,
                        value: finalPrice.toFixed(2),
                    },
                    custom_id: JSON.stringify({
                        planKey,
                        userId: String(user._id),
                        credits: product.credits,
                        validityMonths: product.period === "year" ? 12 :
                            product.period === "3 months" ? 3 : 1,
                    }),
                },
            ],
            application_context: {
                brand_name: "ShortlistAI",
                landing_page: "NO_PREFERENCE",
                user_action: "PAY_NOW",
                return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
                cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
            },
        };

        const createOrderResponse = await fetch(
            `${PAYPAL_API_BASE}/v2/checkout/orders`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderPayload),
            }
        );

        const orderData = await createOrderResponse.json();

        if (!createOrderResponse.ok) {
            console.error("PayPal Create Order Error:", orderData);
            return NextResponse.json(
                { error: "Failed to create PayPal order", details: orderData },
                { status: 500 }
            );
        }

        // Determine validity
        let validityMonths = 12;
        if (product.period === "month") validityMonths = 1;
        else if (product.period === "3 months") validityMonths = 3;
        else if (product.period === "year") validityMonths = 12;

        // Create Transaction record
        await Transaction.create({
            userId: user._id,
            gateway: "PAYPAL",
            orderId: orderId,
            paypalOrderId: orderData.id,
            amount: finalPrice,
            currency: currency,
            credits: product.credits,
            status: "pending",
            packageType: planKey,
            validityMonths: validityMonths,
            paymentMethod: "paypal_order",
            ...(appliedCoupon && { couponCode: appliedCoupon, discountAmount: couponDiscount }),
        });

        console.log(`✅ Created PayPal order ${orderData.id} for user ${user.email}`);

        return NextResponse.json({
            success: true,
            orderId: orderData.id,
            approvalUrl: orderData.links?.find((l: any) => l.rel === "approve")?.href,
        });

    } catch (error: any) {
        console.error("PayPal create order error:", error);
        return NextResponse.json(
            { error: "Failed to create order", message: error.message },
            { status: 500 }
        );
    }
}
