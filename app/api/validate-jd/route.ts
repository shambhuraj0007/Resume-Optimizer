import { NextResponse } from "next/server";
import { validateJobDescription } from "@/lib/jd-validation";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { text } = body;

        // 1. Basic Payload Check
        if (!text || typeof text !== 'string') {
            return NextResponse.json({
                status: 'REJECT',
                message: "Missing or invalid required field: text",
                ok: false,
                isValid: false
            }, { status: 400 });
        }

        // 2. Run the Validation Logic
        const result = validateJobDescription(text);

        // 3. Determine 'ok' status for frontend compatibility
        // We cast to 'any' here briefly to safely access 'status' 
        // in case TypeScript definitions aren't fully synced yet.
        const currentStatus = (result as any).status;

        // If status exists, use it. If not, fallback to isValid.
        const isAcceptable = currentStatus
            ? currentStatus !== 'REJECT'
            : result.isValid;

        return NextResponse.json({
            ...result,
            // Ensure status is explicitly included in the response even if the library didn't return it
            status: currentStatus || (result.isValid ? 'ACCEPT' : 'REJECT'),
            ok: isAcceptable
        });

    } catch (error) {
        console.error("JD Validation Error:", error);
        return NextResponse.json(
            {
                status: 'REJECT',
                message: "Internal server error during validation",
                ok: false,
                isValid: false
            },
            { status: 500 }
        );
    }
}