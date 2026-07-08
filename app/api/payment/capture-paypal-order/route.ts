import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

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
        const { paypalOrderId } = body;

        if (!paypalOrderId) {
            return NextResponse.json({ error: "Missing PayPal order ID" }, { status: 400 });
        }

        // Find the transaction
        const transaction = await Transaction.findOne({ paypalOrderId });
        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Verify ownership
        if (String(transaction.userId) !== String(user._id)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Check if already captured
        if (transaction.status === "completed") {
            return NextResponse.json({
                success: true,
                message: "Order already captured",
                credits: transaction.credits,
            });
        }

        // Capture the order
        const accessToken = await getPayPalAccessToken();

        const captureResponse = await fetch(
            `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const captureData = await captureResponse.json();

        if (!captureResponse.ok) {
            console.error("PayPal Capture Error:", captureData);

            // Update transaction as failed
            transaction.status = "failed";
            (transaction as any).errorMessage = JSON.stringify(captureData);
            await transaction.save();

            return NextResponse.json(
                { error: "Failed to capture PayPal order", details: captureData },
                { status: 500 }
            );
        }

        // Check if payment was completed
        if (captureData.status !== "COMPLETED") {
            console.error("PayPal order not completed:", captureData.status);
            transaction.status = "failed";
            (transaction as any).paypalStatus = captureData.status;
            await transaction.save();

            return NextResponse.json(
                { error: "Payment not completed", status: captureData.status },
                { status: 400 }
            );
        }

        // Payment successful - update transaction
        transaction.status = "completed";
        (transaction as any).paypalStatus = captureData.status;
        (transaction as any).paypalCaptureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
        (transaction as any).completedAt = new Date();
        await transaction.save();

        // Add credits to user
        const credits = transaction.credits || 0;
        const validityMonths = transaction.validityMonths || 12;

        // Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

        // Determine region from currency
        let region = "USA";
        if (transaction.currency === "EUR") region = "EUROPE";
        else if (transaction.currency === "GBP") region = "UK";
        else if (transaction.currency === "INR") region = "INDIA";

        // Update user credits and subscription status
        await User.findByIdAndUpdate(user._id, {
            $inc: { credits: credits },
            $set: {
                isPaidUser: true,
                region: region,
                subscriptionProvider: "PAYPAL",
                subscriptionStatus: "active",
                subscriptionId: paypalOrderId,
                creditValidity: expiryDate,
            },
        });

        console.log(`✅ PayPal order captured. Added ${credits} credits to user ${user.email} (valid until ${expiryDate.toISOString()})`);

        return NextResponse.json({
            success: true,
            credits: credits,
            validity: validityMonths,
            validUntil: expiryDate.toISOString(),
            message: `${credits} credits added to your account!`,
        });

    } catch (error: any) {
        console.error("PayPal order capture error:", error);
        return NextResponse.json(
            { error: "Failed to capture order", message: error.message },
            { status: 500 }
        );
    }
}
