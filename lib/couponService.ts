import Coupon, { ICoupon } from '@/models/Coupon';
import dbConnect from '@/lib/mongodb';

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

export interface CouponValidationResult {
    valid: boolean;
    discountAmount: number;   // Amount saved (in the plan's currency unit)
    finalAmount: number;      // Price after discount
    message: string;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
}

/* ─────────────────────────────────────────────
   Validate — Pure read, no side-effects
   ───────────────────────────────────────────── */

export async function validateCoupon(
    code: string,
    planId: string,
    originalAmount: number,
    currency: string
): Promise<CouponValidationResult> {
    await dbConnect();

    const fail = (message: string): CouponValidationResult => ({
        valid: false,
        discountAmount: 0,
        finalAmount: originalAmount,
        message,
    });

    // 1. Normalize
    const normalized = code.trim().toUpperCase();
    if (!normalized) return fail('Please enter a coupon code.');

    // 2. Existence
    const coupon = await Coupon.findOne({ code: normalized });
    if (!coupon) return fail('Invalid coupon code.');

    // 3. Active
    if (!coupon.isActive) return fail('This coupon is no longer active.');

    // 4. Expiry
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return fail('This coupon has expired.');
    }

    // 5. Usage limit
    if (
        coupon.maxRedemptions !== null &&
        coupon.redemptionCount >= coupon.maxRedemptions
    ) {
        return fail('This coupon has reached its usage limit.');
    }

    // 6. Plan applicability
    if (
        coupon.applicablePlans.length > 0 &&
        !coupon.applicablePlans.includes(planId)
    ) {
        return fail('This coupon does not apply to the selected plan.');
    }

    // 7. Min order
    if (
        coupon.minOrderAmount !== null &&
        coupon.minOrderAmount !== undefined &&
        originalAmount < coupon.minOrderAmount
    ) {
        return fail(
            `Minimum order amount of ${coupon.minOrderAmount} required.`
        );
    }

    // 8. Currency match for FIXED_AMOUNT
    if (
        coupon.discountType === 'FIXED_AMOUNT' &&
        coupon.currency &&
        coupon.currency !== currency.toUpperCase()
    ) {
        return fail('This coupon is not valid for your currency.');
    }

    // ── Calculate discount ──
    let discountAmount: number;

    if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = Math.round((originalAmount * coupon.discountValue) / 100);
    } else {
        // FIXED_AMOUNT
        discountAmount = Math.round(coupon.discountValue);
    }

    // Cap discount so final can't go below 0
    discountAmount = Math.min(discountAmount, originalAmount);
    const finalAmount = Math.max(originalAmount - discountAmount, 0);

    const label =
        coupon.discountType === 'PERCENTAGE'
            ? `${coupon.discountValue}% off applied!`
            : `Discount of ${coupon.discountValue} applied!`;

    return {
        valid: true,
        discountAmount,
        finalAmount,
        message: label,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
    };
}

/* ─────────────────────────────────────────────
   Redeem — Atomic increment (race-condition safe)
   ───────────────────────────────────────────── */

export async function redeemCoupon(code: string): Promise<ICoupon | null> {
    await dbConnect();

    const normalized = code.trim().toUpperCase();

    // Atomic: only increments if still under the limit (or unlimited)
    const updated = await Coupon.findOneAndUpdate(
        {
            code: normalized,
            isActive: true,
            $or: [
                { maxRedemptions: null },
                { $expr: { $lt: ['$redemptionCount', '$maxRedemptions'] } },
            ],
        },
        { $inc: { redemptionCount: 1 } },
        { new: true }
    );

    return updated;
}
