import 'dotenv/config';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

const coupons = [
    {
        code: 'LAUNCH20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxRedemptions: 500,
        expiresAt: new Date('2026-12-31T23:59:59Z'),
        applicablePlans: [],           // All plans
        isActive: true,
    },
    {
        code: 'FLAT100',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100,
        currency: 'INR',
        maxRedemptions: 200,
        expiresAt: new Date('2026-06-30T23:59:59Z'),
        applicablePlans: [],
        isActive: true,
    },
    {
        code: 'PROUSER',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        maxRedemptions: null,          // Unlimited
        expiresAt: null,               // Never expires
        applicablePlans: [
            'pro-monthly-inr',
            'pro-quarterly-inr',
            'pro-monthly-usd',
            'pro-quarterly-usd',
            'pro-monthly-eur',
            'pro-quarterly-eur',
            'pro-monthly-gbp',
            'pro-quarterly-gbp',
        ],
        isActive: true,
    },
    {
        code: 'ANNUAL50',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        maxRedemptions: 100,
        expiresAt: new Date('2026-06-30T23:59:59Z'),
        applicablePlans: [
            'pro-annual-usd',
            'pro-annual-inr',
            'pro-annual-eur',
            'pro-annual-gbp',
        ],
        isActive: true,
    },
];

async function seedCoupons() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const coupon of coupons) {
            const existing = await Coupon.findOne({ code: coupon.code });
            if (existing) {
                console.log(`⏭️  Coupon "${coupon.code}" already exists (skipping)`);
                continue;
            }
            await Coupon.create(coupon);
            console.log(`✅ Created coupon: ${coupon.code}`);
        }

        console.log('\n🎉 Coupon seeding complete!');
    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedCoupons();
