import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import { getRegionFromIP } from "@/lib/geo";

type Region = "IN" | "US" | "EU" | "GB";

// Country code to region mapping
function mapCountryToRegion(countryCode: string): Region {
  const code = countryCode.toUpperCase();

  if (code === 'IN') return 'IN';
  if (code === 'US') return 'US';
  if (code === 'GB' || code === 'UK') return 'GB';

  // EU countries
  const EU_COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE',
    'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT',
    'RO', 'SK', 'SI', 'ES', 'SE'
  ];
  if (EU_COUNTRIES.includes(code)) return 'EU';

  // Default to US for other countries
  return 'US';
}

// Map full region names to country codes for GeoLite2
function regionNameToCode(region: string): Region {
  if (region === 'INDIA') return 'IN';
  if (region === 'USA') return 'US';
  if (region === 'UK') return 'GB';
  if (region === 'EUROPE') return 'EU';
  return 'US';
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    let region: Region = 'US'; // Default (fallback to USA)
    let regionSource = 'default';

    // 1. Check User Profile (Source of Truth for Paid Users)
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });
      if (user?.isPaidUser && user.region) {
        // Convert full region name (e.g. "INDIA") to two-letter code (e.g. "IN")
        region = regionNameToCode(user.region);
        regionSource = 'user_profile';
        console.log(`[PACKAGES API] Using saved region for paid user: ${user.region} -> ${region}`);
      }
    }

    // 2. If not a paid user, use middleware-injected country or IP detection
    if (regionSource === 'default') {
      // First, try the middleware header
      let countryCode = req.headers.get('x-user-country');

      // Fallback: Check for mockCountry query parameter (dev mode)
      if (!countryCode || countryCode === 'US') {
        const url = new URL(req.url);
        const mockCountry = url.searchParams.get('mockCountry');
        if (mockCountry && process.env.NODE_ENV === 'development') {
          countryCode = mockCountry.toUpperCase();
          console.log(`[PACKAGES API] Using mockCountry query param: ${countryCode}`);
        }
        // If still US (default from middleware), try IP-based detection
        else if (countryCode === 'US' && !mockCountry) {
          try {
            const clientIp = getClientIp(req);
            const detectedRegion = await getRegionFromIP(clientIp);
            region = regionNameToCode(detectedRegion);
            regionSource = 'ip_detection';
            console.log(`[PACKAGES API] Using IP detection: ${clientIp} -> ${detectedRegion} -> ${region}`);
          } catch (error) {
            console.warn(`[PACKAGES API] IP detection failed, using default US:`, error);
          }
        }
      }

      if (countryCode && regionSource === 'default') {
        region = mapCountryToRegion(countryCode);
        regionSource = 'middleware';
        console.log(`[PACKAGES API] Using country: ${countryCode} -> Region: ${region}`);
      }
    }

    // 3. Fetch all active products from database
    const products = await Product.find({ active: true }).lean();

    if (!products || products.length === 0) {
      console.error('[PACKAGES API] No active products found in database');
      return NextResponse.json(
        { error: "No pricing data available" },
        { status: 500 }
      );
    }

    // 4. Build response based on detected region
    const data = buildPricingResponse(products, region);

    console.log(`[PACKAGES API] Returning pricing for region: ${data.region}, currency: ${data.currency} (source: ${regionSource})`);

    // 5. CRITICAL: Add Vary header to prevent CDN caching issues
    const response = NextResponse.json(data);
    response.headers.set('Vary', 'x-user-country');

    return response;

  } catch (error) {
    console.error("[PACKAGES API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

function buildPricingResponse(products: any[], region: Region) {
  // Get region-specific pricing or fallback to USD
  const getPrice = (product: any) => {
    // First, try to find exact region match
    const regionalPrice = product.prices?.find((p: any) => p.regionCode === region);
    if (regionalPrice) {
      return {
        price: regionalPrice.amount,
        currency: regionalPrice.currencySymbol,
        currencyCode: regionalPrice.currency
      };
    }

    // Fallback to US pricing if available
    const usPricing = product.prices?.find((p: any) => p.regionCode === 'US');
    if (usPricing) {
      return {
        price: usPricing.amount,
        currency: usPricing.currencySymbol,
        currencyCode: usPricing.currency
      };
    }

    // Final fallback to basePriceUSD
    return {
      price: product.basePriceUSD,
      currency: '$',
      currencyCode: 'USD'
    };
  };

  // Extract currency from any product with regional pricing
  const sampleProduct = products.find(p =>
    p.prices?.some((pr: any) => pr.regionCode === region)
  );

  console.log(`[PACKAGES API] Sample product for region ${region}:`, sampleProduct ? sampleProduct.name : 'None');

  const currencyInfo = sampleProduct
    ? sampleProduct.prices.find((p: any) => p.regionCode === region)
    : { currencySymbol: '$', currency: 'USD' };

  if (!currencyInfo) {
    console.error(`[PACKAGES API] CRITICAL ERROR: Found sample product but failed to find price for region ${region}`);
    // Fallback to avoid crash
    return {
      region: 'ERROR',
      currency: '$',
      currencyCode: 'USD',
      free_tier: { title: "Error", price: 0, features: [] },
      credit_packs: [],
      subscriptions: []
    };
  }

  // Build free tier
  const freeTierProduct = products.find(p => p.type === 'free_tier');
  const free_tier = freeTierProduct ? {
    title: freeTierProduct.name,
    price: 0,
    features: freeTierProduct.features || []
  } : { title: "Free", price: 0, features: [] };

  // Build credit packs (filter for products that have pricing in this region)
  const credit_packs = products
    .filter(p =>
      p.type === 'credit_pack' &&
      p.prices?.some((pr: any) => pr.regionCode === region)
    )
    .map(p => {
      const priceInfo = getPrice(p);
      return {
        id: p._id,
        name: p.name,
        price: priceInfo.price,
        credits: p.credits || 0,
        save: p.saveText || ''
      };
    });

  // Build subscriptions (filter for products that have pricing in this region)
  // Include both 'subscription' and 'annual_plan' types
  const subscriptions = products
    .filter(p =>
      (p.type === 'subscription' || p.type === 'annual_plan') &&
      p.prices?.some((pr: any) => pr.regionCode === region)
    )
    .map(p => {
      const priceInfo = getPrice(p);
      return {
        id: p._id,
        name: p.name,
        price: priceInfo.price,
        period: p.period || 'month',
        billing: p.billing || 'Monthly',
        credits: p.credits || 0,
        discount: p.discount || '',
        paypalPlanId: p.paypalPlanId || '', // Add PayPal plan ID
        razorpayPlanId: p.razorpayPlanId || '', // Add Razorpay plan ID
      };
    });

  // Map region codes to legacy region names for frontend compatibility
  const regionMap: Record<Region, string> = {
    'IN': 'INDIA',
    'US': 'USA',
    'EU': 'EUROPE',
    'GB': 'UK'
  };

  return {
    region: regionMap[region],
    currency: currencyInfo.currencySymbol,
    currencyCode: currencyInfo.currency,
    free_tier,
    credit_packs,
    subscriptions
  };
}
