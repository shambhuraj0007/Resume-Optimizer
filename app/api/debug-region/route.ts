import { NextRequest, NextResponse } from "next/server";
import { getRegionFromIP } from "@/lib/geo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        // Extract IP exactly as packages route does
        let ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
        if (ip.includes(',')) ip = ip.split(',')[0].trim();

        const region = await getRegionFromIP(ip);

        let userRegion = null;
        if (session?.user?.email) {
            const user = await User.findOne({ email: session.user.email });
            if (user) {
                userRegion = user.region;
            }
        }

        return NextResponse.json({
            ip,
            detectedRegion: region,
            headers: Object.fromEntries(req.headers.entries()),
            session: session || "No session",
            userRegionFromDB: userRegion || "Not found"
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
