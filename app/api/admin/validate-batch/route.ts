// app/api/admin/validate-batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateBatch } from "@/lib/resume-templates/validator";
import connectDB from "@/lib/mongodb";
import JobRole from "@/models/JobRole";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "dev-admin-secret";

export async function POST(req: NextRequest) {
    // --- Guard: Admin auth ---
    const authHeader = req.headers.get("x-admin-secret");
    if (authHeader !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Read raw body as JSON string
        const body = await req.json();
        const rawJson = JSON.stringify(body);

        // 2. Validate
        const { validRoles, invalidRoles } = validateBatch(rawJson);

        // 3. Store valid roles via upsert
        let stored = 0;
        if (validRoles.length > 0) {
            await connectDB();

            for (const { slug, data } of validRoles) {
                await JobRole.findOneAndUpdate({ slug }, data, {
                    upsert: true,
                    new: true,
                    runValidators: true,
                });
                stored++;
            }
        }

        // 4. Return report
        return NextResponse.json({
            summary: {
                totalReceived: validRoles.length + invalidRoles.length,
                stored,
                rejected: invalidRoles.length,
            },
            storedSlugs: validRoles.map((v) => v.slug),
            invalidRoles,
        });
    } catch (error) {
        console.error("[validate-batch] Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
