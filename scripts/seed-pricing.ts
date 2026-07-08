import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

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
        paypalPlanId: 'P-09G239902Y3340720NFFLJXY', // PayPal Plan ID (Live)
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
        paypalPlanId: 'P-10X49417336220825NFFLKJA', // PayPal Plan ID (Live)
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
        paypalPlanId: 'P-05M666451V631953LNFFLHDY', // PayPal Plan ID
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
        paypalPlanId: 'P-4M9785276H958822KNFFLIJA', // PayPal Plan ID (Live)
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
        paypalPlanId: 'P-6M580881VM893674TNFFLI2Y', // PayPal Plan ID (Live)
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
        paypalPlanId: 'P-4X993862FS1550934NFFLJKY', // PayPal Plan ID (Live)
        active: true,
    },

    // ========== USA ANNUAL PLAN ==========
    {
        _id: 'pro-annual-usd',
        name: 'Pro+ Annual',
        type: 'annual_plan',
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
        type: 'annual_plan',
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
        type: 'annual_plan',
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

async function seedPricing() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('🗑️  Cleared existing products');

        // Insert new products
        await Product.insertMany(products);
        console.log(`✅ Seeded ${products.length} products`);

        console.log('\n📊 Product Summary:');
        const creditPacks = products.filter(p => p.type === 'credit_pack');
        const subscriptions = products.filter(p => p.type === 'subscription');
        const freeTier = products.filter(p => p.type === 'free_tier');

        console.log(`   - Free Tier: ${freeTier.length}`);
        console.log(`   - Credit Packs: ${creditPacks.length} (India only)`);
        console.log(`   - Subscriptions: ${subscriptions.length}`);
        console.log('     - India: 2 (Monthly, Quarterly)');
        console.log('     - USA: 3 (Monthly, Quarterly, Annual)');
        console.log('     - Europe: 3 (Monthly, Quarterly, Annual)');
        console.log('     - UK: 3 (Monthly, Quarterly, Annual)');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedPricing();
