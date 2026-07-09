import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { createRazorpayOrder } from "@/payment/razorpay";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/mongodb";
import { validateCoupon, redeemCoupon } from "@/lib/couponService";

// Configuration for Credit Packs (India)
const CREDIT_PACKS: any = {
  "5-scan-pack": { credits: 5, price: 99, name: "5-scan Pack" },
  "20-scan-pack": { credits: 20, price: 299, name: "20-scan Pack" },
  "50-scan-pack": { credits: 50, price: 599, name: "50-scan Pack" },
};

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packageType, region, returnTo, couponCode } = body;

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Default to India logic if region is India or unspecified (fallback)
    // Actually, check if it's a credit pack. Only India has credit packs.
    if (CREDIT_PACKS[packageType]) {
      // India - Cashfree Flow
      const pack = CREDIT_PACKS[packageType];
      let finalPrice = pack.price;
      let appliedCoupon: string | undefined;
      let discountAmount: number | undefined;

      // ── Coupon handling ──
      if (couponCode) {
        const couponResult = await validateCoupon(couponCode, packageType, pack.price, 'INR');
        if (!couponResult.valid) {
          return NextResponse.json({ error: couponResult.message }, { status: 400 });
        }
        // Atomic redeem
        const redeemed = await redeemCoupon(couponCode);
        if (!redeemed) {
          return NextResponse.json({ error: 'Coupon usage limit reached.' }, { status: 400 });
        }
        finalPrice = couponResult.finalAmount;
        appliedCoupon = couponCode.trim().toUpperCase();
        discountAmount = couponResult.discountAmount;
      }

      const orderId = `ORDER_${uuidv4().substring(0, 8)}_${Date.now()}`;

      // Ensure phone number exists for Cashfree
      const customerPhone = user.phone || "9999999999";
      const customerEmail = user.email;

      // Create Razorpay Order
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
        currency: 'INR',
        credits: pack.credits,
        status: 'pending',
        packageType: packageType,
        validityMonths: 3,
        paymentMethod: 'razorpay_pg',
        ...(appliedCoupon && { couponCode: appliedCoupon, discountAmount }),
      });

      return NextResponse.json({
        gateway: 'RAZORPAY',
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount, // in paise
        currency: 'INR',
        orderId: orderId
      });
    }

    return NextResponse.json({ error: "Invalid package type for order creation" }, { status: 400 });

  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
