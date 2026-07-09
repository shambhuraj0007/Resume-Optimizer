import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { fetchRazorpayOrder } from "@/payment/razorpay";
import { addCredits } from "@/payment/creditService";

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

        const { orderId } = await req.json();

        if (!orderId) {
            console.error("Verify Razorpay: Missing orderId");
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        console.log(`[VERIFY RAZORPAY] Verifying order: ${orderId}`);

        // 1. Find Transaction locally
        const transaction = await Transaction.findOne({ orderId: orderId });
        if (!transaction) {
            console.error(`[VERIFY RAZORPAY] Transaction not found for orderId: ${orderId}`);
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        console.log(`[VERIFY RAZORPAY] Local transaction found: ${transaction.orderId}, Status: ${transaction.status}`);

        // 2. If already completed, return success immediately (Idempotency)
        if (transaction.status === "completed") {
            console.log(`[VERIFY RAZORPAY] Order already completed: ${orderId}`);
            return NextResponse.json({
                success: true,
                message: "Already completed",
                amount: transaction.amount,
                currency: transaction.currency,
                credits: transaction.credits,
                plan_id: transaction.packageType,
            });
        }

        // 3. Verify with Razorpay
        if (!transaction.razorpayOrderId) {
            console.error(`[VERIFY RAZORPAY] Missing razorpayOrderId in transaction: ${orderId}`);
            return NextResponse.json({ error: "Missing Razorpay Order ID" }, { status: 400 });
        }

        console.log(`[VERIFY RAZORPAY] Fetching status from Razorpay API...`);
        const rzpOrder = (await fetchRazorpayOrder(transaction.razorpayOrderId)) as any;
        console.log(`[VERIFY RAZORPAY] Razorpay Status: ${rzpOrder.status}`);

        // Check if PAID
        if (rzpOrder.status === "paid") {
            // Update Transaction
            transaction.status = "completed";
            // Get payment details from rzpOrder or default
            const paymentId = rzpOrder.payments?.items?.[0]?.id || transaction.paymentId || "rzp_pay_success";
            transaction.paymentId = paymentId;
            await transaction.save();

            // Add Credits and Update Region
            const user = await User.findById(transaction.userId);
            if (user) {
                await addCredits(
                    (user._id as any).toString(),
                    transaction.credits,
                    transaction.validityMonths
                );

                // Update User Region based on Currency (Source of Truth)
                let newRegion = user.region;
                if (transaction.currency === 'INR') newRegion = 'INDIA';
                else if (transaction.currency === 'EUR') newRegion = 'EUROPE';
                else if (transaction.currency === 'GBP') newRegion = 'UK';
                else if (transaction.currency === 'USD') newRegion = 'USA';

                if (newRegion !== user.region) {
                    user.region = newRegion;
                    await user.save();
                }

                // ------------------------------------------------------------------
                // LOOPS.SO INTEGRATION
                // ------------------------------------------------------------------
                try {
                    const { syncContact, sendTransactionalEmail } = await import('@/lib/loops');

                    // Sync user to Loops with updated paid status
                    await syncContact(user);

                    // Send confirmation email
                    const { getReadablePlanName } = await import('@/lib/plans');
                    await sendTransactionalEmail('cmkshnmnk22vr0iya201q1mb2', user.email, {
                        name: user.name,
                        amount: transaction.amount,
                        plan: getReadablePlanName(transaction.packageType),
                        credits: transaction.credits,
                        invoiceLink: `${process.env.NEXT_PUBLIC_URL}/invoices/${orderId}`,
                        dashboardLink: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
                    });
                } catch (loopsError) {
                    console.error('[VERIFY RAZORPAY] Loops integration error:', loopsError);
                }
            }

            return NextResponse.json({
                success: true,
                amount: transaction.amount,
                currency: transaction.currency,
                credits: transaction.credits,
                plan_id: transaction.packageType,
            });
        } else {
            console.warn(`[VERIFY RAZORPAY] Payment not paid. Status: ${rzpOrder.status}`);

            // Update Failed Status if applicable
            if (rzpOrder.status === "failed") {
                transaction.status = "failed";
                await transaction.save();
            }

            return NextResponse.json({
                success: false,
                status: rzpOrder.status,
                error: `Payment status: ${rzpOrder.status}`
            });
        }

    } catch (error: any) {
        console.error("Verify Razorpay Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
