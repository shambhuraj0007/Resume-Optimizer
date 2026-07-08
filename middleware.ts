import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Redirect authenticated users away from signin pages
    if (token && (pathname === "/signin" || pathname === "/signin/")) {
      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/profile";
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }

    // === A/B Split for /get-started ===
    // Assign variant at the edge via cookie — zero client-side flicker
    if (pathname === "/get-started" || pathname === "/get-started/") {
      const existingVariant = req.cookies.get("ab-variant")?.value;
      // Allow explicit ?variant= override for testing / analytics attribution
      const urlVariant = req.nextUrl.searchParams.get("variant");
      const variant = urlVariant === "a" || urlVariant === "b"
        ? urlVariant
        : existingVariant === "a" || existingVariant === "b"
          ? existingVariant
          : Math.random() < 0.5 ? "a" : "b";

      // Rewrite (not redirect) to keep URL clean as /get-started
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = `/get-started/${variant}`;
      const response = NextResponse.rewrite(rewriteUrl);

      // Set sticky cookie (30 days) so returning visitors see same variant
      if (existingVariant !== variant) {
        response.cookies.set("ab-variant", variant, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
        });
      }

      return response;
    }

    // === Country Detection Logic ===
    let countryCode = 'US'; // Default fallback

    // 1. DEV MODE OVERRIDE - Check for ?mockCountry query parameter
    if (process.env.NODE_ENV === 'development') {
      const mockCountry = req.nextUrl.searchParams.get('mockCountry');
      if (mockCountry) {
        countryCode = mockCountry.toUpperCase();
        console.log(`[MIDDLEWARE] Using mockCountry: ${countryCode}`);
      }
    }

    // 2. EDGE DETECTION - Vercel (if not overridden by mockCountry)
    if (!req.nextUrl.searchParams.get('mockCountry')) {
      const vercelCountry = req.headers.get('x-vercel-ip-country');
      if (vercelCountry) {
        countryCode = vercelCountry.toUpperCase();
        console.log(`[MIDDLEWARE] Detected from Vercel: ${countryCode}`);
      }
      // 3. EDGE DETECTION - CloudFront (AWS)
      else {
        const cloudFrontCountry = req.headers.get('CloudFront-Viewer-Country');
        if (cloudFrontCountry) {
          countryCode = cloudFrontCountry.toUpperCase();
          console.log(`[MIDDLEWARE] Detected from CloudFront: ${countryCode}`);
        }
      }
    }

    // Inject country code into request headers for API routes to access
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-country', countryCode);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Routes that are completely public (viewable by anyone)
        const publicViewRoutes = [
          "/",              // Homepage
          "/about",         // About page
          "/signin",        // Sign in page
          "/verify-email",  // Email verification
          "/api/auth",      // Auth API routes
        ];

        // Routes that require authentication to access
        const protectedRoutes = [
          "/profile",       // User profile
          "/resume",        // Resume builder/viewer
          "/ats-checker",   // ATS checker
          "/dashboard",     // Dashboard
          "/settings",      // Settings
        ];

        // Check if current path is completely public
        const isPublicView = publicViewRoutes.some((route) =>
          pathname === route || pathname.startsWith(route)
        );

        // Allow public view routes for everyone
        if (isPublicView) {
          return true;
        }

        // Check if current path is protected
        const isProtected = protectedRoutes.some((route) =>
          pathname.startsWith(route)
        );

        // Require authentication for protected routes
        if (isProtected) {
          return !!token;
        }

        // For any other routes, allow access (but they can check auth client-side)
        return true;
      },
    },
    pages: {
      signIn: "/signin",
    },
  }
);

// Only protect specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
