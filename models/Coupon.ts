import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;       // e.g. 20 for 20%, or 2000 for $20 / ₹2000
    currency?: string;           // Required for FIXED_AMOUNT — 'INR', 'USD', 'EUR', 'GBP'
    maxRedemptions: number | null; // null = unlimited
    redemptionCount: number;
    expiresAt: Date | null;
    applicablePlans: string[];   // Product _id values; empty = all plans
    isActive: boolean;
    minOrderAmount?: number | null;
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema: Schema<ICoupon> = new Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        discountType: {
            type: String,
            enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            uppercase: true,
            trim: true,
            default: null,
        },
        maxRedemptions: {
            type: Number,
            default: null, // null = unlimited
        },
        redemptionCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        applicablePlans: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        minOrderAmount: {
            type: Number,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for fast lookups during validation
CouponSchema.index({ isActive: 1, expiresAt: 1 });

// Prevent Mongoose model compilation errors in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Coupon;
}

const Coupon: Model<ICoupon> =
    mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
