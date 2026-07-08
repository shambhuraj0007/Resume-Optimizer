
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    // Simple security
    if (key !== 'secret_seed_123') { // Hardcoded for this emergency fix
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();

        // Products data (Copied from scripts/seed-pricing.ts)
        const products = [
            // ========== FREE TIER ==========
            {
                _id: 'free-tier',
                name: 'Free',
                type: 'free_tier',
                credits: 3,
                basePriceUSD: 0,
                prices: [
                    { regionCode: 'IN', currency: 'INR', currencySymbol: '₹', amount: 0 },
                    { regionCode: 'US', currency: 'USD', currencySymbol: '$', amount: 0 },
                    { regionCode: 'EU', currency: 'EUR', currencySymbol: '€', amount: 0 },
                    { regionCode: 'GB', currency: 'GBP', currencySymbol: '£', amount: 0 },
                ],
                active: true,
                features: [
                    '3 CV↔JD scans/month',
                    'Watermarked Resume',
                    'Skills Check'
                ]
            },

            // ========== INDIA CREDIT PACKS ==========
            {
                _id: '5-scan-pack',
                name: '5-scan Pack',
                type: 'credit_pack',
                credits: 5,
                basePriceUSD: 1.99,
                prices: [
                    { regionCode: 'IN', currency: 'INR', currencySymbol: '₹', amount: 99 },
                ],
                saveText: 'save ~17%',
                active: true,
            },
            {
                _id: '20-scan-pack',
                name: '20-scan Pack',
                type: 'credit_pack',
                credits: 20,
                basePriceUSD: 5.99,
                prices: [
                    { regionCode: 'IN', currency: 'INR', currencySymbol: '₹', amount: 299 },
                ],
                saveText: 'save ~37%',
                active: true,
            },
            {
                _id: '50-scan-pack',
                name: '50-scan Pack',
                type: 'credit_pack',
                credits: 50,
                basePriceUSD: 11.99,
                prices: [
                    { regionCode: 'IN', currency: 'INR', currencySymbol: '₹', amount: 599 },
                ],
                saveText: 'save ~50%',
                active: true,
            },

            // ========== INDIA SUBSCRIPTIONS ==========
            {
                _id: 'pro-monthly-inr',
                name: 'Pro Monthly',
                type: 'subscription',
                credits: 200,
                period: 'month',
                billing: 'Monthly',
                discount: '75% OFF',
                basePriceUSD: 15,
                prices: [
                    { regionCode: 'IN', currency: 'INR', currencySymbol: '₹', amount: 599 },
                ],
                cashfreePlanId: process.env.CASHFREE_PLAN_MONTHLY_ID || 'PRO_MONTHLY',
                active: true,
            },
            {
                _id: 'pro-quarterly-inr',
                name: 'Pro Quarterly',
                type: 'subscription',
                credits: 700,
                period: '3 months',
                billing: 'Every 3 months',
                discount: '80% OFF',
                basePriceUSD: 39,
                prices: [
                    { regionCode: 'IN', currency: 'INR', currencySymbol: '₹', amount: 1499 },
                ],
                cashfreePlanId: process.env.CASHFREE_PLAN_QUARTERLY_ID || 'PRO_QUARTERLY',
                active: true,
            },

            // ========== USA SUBSCRIPTIONS ==========
            {
                _id: 'pro-monthly-usd',
                name: 'Pro Monthly',
                type: 'subscription',
                credits: 200,
                period: 'month',
                billing: 'Monthly',
                discount: '75% OFF',
                basePriceUSD: 15,
                prices: [
                    { regionCode: 'US', currency: 'USD', currencySymbol: '$', amount: 15 },
                ],
                paypalPlanId: 'P-03734607T4219344GNFFW47A', // PayPal Sandbox Plan ID
                active: true,
            },
            {
                _id: 'pro-quarterly-usd',
                name: 'Pro Quarterly',
                type: 'subscription',
                credits: 700,
                period: '3 months',
                billing: 'Every 3 months',
                discount: '80% OFF',
                basePriceUSD: 39,
                prices: [
                    { regionCode: 'US', currency: 'USD', currencySymbol: '$', amount: 39 },
                ],
                paypalPlanId: 'P-2GF314033P139074HNFFW5NA', // PayPal Sandbox Plan ID
                active: true,
            },

            // ========== EUROPE SUBSCRIPTIONS ==========
            {
                _id: 'pro-monthly-eur',
                name: 'Pro Monthly',
                type: 'subscription',
                credits: 200,
                period: 'month',
                billing: 'Monthly',
                discount: '75% OFF',
                basePriceUSD: 15,
                prices: [
                    { regionCode: 'EU', currency: 'EUR', currencySymbol: '€', amount: 14 },
                ],
                paypalPlanId: 'P-7JE10424P3529311VNFFW5YY', // PayPal Sandbox Plan ID
                active: true,
            },
            {
                _id: 'pro-quarterly-eur',
                name: 'Pro Quarterly',
                type: 'subscription',
                credits: 700,
                period: '3 months',
                billing: 'Every 3 months',
                discount: '80% OFF',
                basePriceUSD: 39,
                prices: [
                    { regionCode: 'EU', currency: 'EUR', currencySymbol: '€', amount: 36 },
                ],
                paypalPlanId: 'P-5TT83749C44797628NFFW6FY', // PayPal Sandbox Plan ID
                active: true,
            },

            // ========== UK SUBSCRIPTIONS ==========
            {
                _id: 'pro-monthly-gbp',
                name: 'Pro Monthly',
                type: 'subscription',
                credits: 200,
                period: 'month',
                billing: 'Monthly',
                discount: '75% OFF',
                basePriceUSD: 15,
                prices: [
                    { regionCode: 'GB', currency: 'GBP', currencySymbol: '£', amount: 13 },
                ],
                paypalPlanId: 'P-8CY85830BD0723543NFFW6QA', // PayPal Sandbox Plan ID
                active: true,
            },
            {
                _id: 'pro-quarterly-gbp',
                name: 'Pro Quarterly',
                type: 'subscription',
                credits: 700,
                period: '3 months',
                billing: 'Every 3 months',
                discount: '80% OFF',
                basePriceUSD: 39,
                prices: [
                    { regionCode: 'GB', currency: 'GBP', currencySymbol: '£', amount: 33 },
                ],
                paypalPlanId: 'P-6H5833252X1261013NFFW6YQ', // PayPal Sandbox Plan ID
                active: true,
            },

            // ========== USA ANNUAL PLAN ==========
            {
                _id: 'pro-annual-usd',
                name: 'Pro+ Annual',
                type: 'subscription',
                credits: 2400,
                period: 'year',
                billing: 'Yearly',
                discount: 'CAREER BUILDER',
                basePriceUSD: 120,
                prices: [
                    { regionCode: 'US', currency: 'USD', currencySymbol: '$', amount: 120 },
                ],
                paypalPlanId: '', // TODO: Add PayPal annual plan ID when created
                active: true,
            },

            // ========== EUROPE ANNUAL PLAN ==========
            {
                _id: 'pro-annual-eur',
                name: 'Pro+ Annual',
                type: 'subscription',
                credits: 2400,
                period: 'year',
                billing: 'Yearly',
                discount: 'CAREER BUILDER',
                basePriceUSD: 120,
                prices: [
                    { regionCode: 'EU', currency: 'EUR', currencySymbol: '€', amount: 112 },
                ],
                paypalPlanId: '', // TODO: Add PayPal annual plan ID when created
                active: true,
            },

            // ========== UK ANNUAL PLAN ==========
            {
                _id: 'pro-annual-gbp',
                name: 'Pro+ Annual',
                type: 'subscription',
                credits: 2400,
                period: 'year',
                billing: 'Yearly',
                discount: 'CAREER BUILDER',
                basePriceUSD: 120,
                prices: [
                    { regionCode: 'GB', currency: 'GBP', currencySymbol: '£', amount: 99 },
                ],
                paypalPlanId: '', // TODO: Add PayPal annual plan ID when created
                active: true,
            },
        ];

        // Seeding logic
        await Product.deleteMany({});
        await Product.insertMany(products);

        return NextResponse.json({
            success: true,
            message: `Seeded ${products.length} products successfully`,
            productsCount: products.length
        });

    } catch (error) {
        console.error('Seeding API error:', error);
        return NextResponse.json({ error: "Seeding failed", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
