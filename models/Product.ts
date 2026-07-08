import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegionalPrice {
    regionCode: string; // 'IN', 'US', 'EU', 'GB'
    currency: string;   // 'INR', 'USD', 'EUR', 'GBP'
    currencySymbol: string; // '₹', '$', '€', '£'
    amount: number;
}

export interface IProduct extends Document {
    _id: string; // Custom ID like '5-scan-pack', 'pro-monthly-inr'
    name: string;
    type: 'credit_pack' | 'subscription' | 'free_tier' | 'annual_plan';
    credits?: number;
    period?: string; // 'month', '3 months', etc.
    billing?: string; // 'Monthly', 'Every 3 months'
    discount?: string; // '75% OFF', '80% OFF'
    saveText?: string; // 'save ~17%' - renamed from 'save' to avoid Document.save() conflict
    basePriceUSD: number; // Fallback price in USD
    prices: IRegionalPrice[]; // Regional pricing overrides
    paypalPlanId?: string; // PayPal subscription plan ID (for international subscriptions)
    cashfreePlanId?: string; // Cashfree plan ID (for India subscriptions)
    active: boolean;
    features?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const RegionalPriceSchema = new Schema<IRegionalPrice>({
    regionCode: {
        type: String,
        required: true,
        uppercase: true
    },
    currency: {
        type: String,
        required: true,
        uppercase: true
    },
    currencySymbol: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const ProductSchema: Schema<IProduct> = new Schema(
    {
        _id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['credit_pack', 'subscription', 'free_tier', 'annual_plan'],
            required: true,
        },
        credits: {
            type: Number,
            min: 0,
        },
        period: String,
        billing: String,
        discount: String,
        saveText: String,
        basePriceUSD: {
            type: Number,
            required: true,
            min: 0,
        },
        prices: [RegionalPriceSchema],
        paypalPlanId: String, // PayPal subscription plan ID
        cashfreePlanId: String, // Cashfree plan ID
        active: {
            type: Boolean,
            default: true,
        },
        features: [String],
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
ProductSchema.index({ type: 1, active: 1 });
ProductSchema.index({ 'prices.regionCode': 1 });

// Prevent Mongoose model compilation errors in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Product;
}

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
