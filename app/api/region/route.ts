import { NextRequest, NextResponse } from "next/server";
import { getRegionFromIP } from "@/lib/geo";

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const region = await getRegionFromIP(ip);

    // Note: getRegionFromIP already handles the lookup and default fallback
    return NextResponse.json({
      ip,
      region,
      // We don't expose raw country code from lib/geo yet, but region is what matters for UI
      countryCode: region === 'INDIA' ? 'IN' : (region === 'UK' ? 'GB' : 'US')
    });
  } catch (error) {
    console.error("GeoIP Error:", error);
    return NextResponse.json({ region: "USA", countryCode: null });
  }
}
