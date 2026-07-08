import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product';

const MONGODB_URI = process.env.MONGODB_URI!;

async function checkPlans() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const plans = await Product.find({
            type: 'subscription',
            $or: [
                { _id: /usd$/ },
                { _id: /eur$/ },
                { _id: /gbp$/ }
            ]
        });

        console.log('\n📋 PayPal Subscription Plans in Database:\n');
        plans.forEach(p => {
            console.log(`${p._id}`);
            console.log(`  Name: ${p.name}`);
            console.log(`  PayPal Plan ID: ${p.paypalPlanId || 'NOT SET'}`);
            console.log('');
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkPlans();
