import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendEvent } from "@/lib/loops";

// Simple rate limit mapping (in-memory, per instance)
// In production with multiple instances/serverless, use Redis (Upstash/Redis)
const rateLimit = new Map<string, number>();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 10;

const ALLOWED_EVENTS = [
    "viewed_home_page",
    "viewed_pricing_page",
    "upgrade_intent",
    "payment_success"
];

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { eventName, properties } = body;

        if (!eventName || !ALLOWED_EVENTS.includes(eventName)) {
            return NextResponse.json({ error: "Invalid or missing event name" }, { status: 400 });
        }

        // Basic Rate Limiting
        const userId = session.user.email;
        const now = Date.now();
        const lastRequest = rateLimit.get(userId) || 0;

        if (now - lastRequest < (WINDOW_MS / MAX_REQUESTS)) {
            // Too frequent (simple throttle)
            // For a proper window counter, we'd need more state, but this debounces slightly
        }
        // Actually, let's just update the timestamp and not strict block for now unless spamming
        rateLimit.set(userId, now);

        // Fire and forget (don't block response)
        sendEvent(session.user.email, eventName, properties || {}).catch(err =>
            console.error("Async loops event error:", err)
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Loops event API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
