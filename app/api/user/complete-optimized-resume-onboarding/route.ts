import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Find user and update optimized resume onboarding flag to true
        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email.toLowerCase() },
            { hasCompletedOptimizedResumeOnboarding: true },
            { new: true }
        );

        return NextResponse.json({ success: true, status: updatedUser?.hasCompletedOptimizedResumeOnboarding });
    } catch (error) {
        console.error("Optimized Resume Onboarding update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
