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

        console.log(`[Onboarding] API called for: ${session.user.email}`);
        await connectDB();

        // Find user and update flag to true
        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email.toLowerCase() },
            { hasCompletedOnboarding: true, lastSeen: new Date() },
            { new: true }
        );

        console.log(`[Onboarding] Update result for ${session.user.email}:`, updatedUser?.hasCompletedOnboarding);

        // Sync to Loops (Fire and forget)
        if (updatedUser) {
            import("@/lib/loops").then(({ syncContact }) => {
                syncContact(updatedUser).catch(e => console.error("Loops sync error in onboarding:", e));
            });
        }

        return NextResponse.json({ success: true, status: updatedUser?.hasCompletedOnboarding });
    } catch (error) {
        console.error("Onboarding update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
