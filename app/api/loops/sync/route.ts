import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { syncContact } from "@/lib/loops";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email.toLowerCase() });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update lastSeen
        user.lastSeen = new Date();
        await user.save();

        // Sync to Loops
        await syncContact(user);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Loops sync API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
