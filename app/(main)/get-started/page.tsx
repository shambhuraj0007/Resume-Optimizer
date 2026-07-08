"use client";

/**
 * Fallback page for /get-started.
 * In production, the middleware assigns variant "a" or "b" via cookie
 * and rewrites to /get-started/a or /get-started/b — so this page
 * is only reached if middleware is bypassed (e.g. direct file access).
 * We default to Variant A (free-first) for safety.
 */

import VariantA from "./VariantA";

export default function GetStartedPage() {
    return <VariantA />;
}