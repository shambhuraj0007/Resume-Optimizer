/**
 * GA4 Event Helper (using GTM dataLayer)
 * Push custom events to GTM for tracking programmatic pages
 */

const pushEvent = (event: string, params: Record<string, any> = {}) => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
        event,
        ...params,
    });
};

/**
 * Track page view for programmatic resume template pages
 */
export const trackPageView = (slug: string) => {
    pushEvent('programmatic_page_view', {
        page_type: 'resume_template',
        template_slug: slug,
    });
};

/**
 * Track when user clicks "Get My ATS Score" CTA
 */
export const trackATSRequest = (slug: string) => {
    pushEvent('ats_score_requested', {
        page_type: 'resume_template',
        template_slug: slug,
    });
};

/**
 * Track AI share button clicks (ChatGPT, etc.)
 */
export const trackAIShare = (slug: string, platform: string) => {
    pushEvent('ai_share_click', {
        page_type: 'resume_template',
        template_slug: slug,
        platform,
    });
};

/**
 * Track general CTA clicks on programmatic pages
 */
export const trackCTAClick = (slug: string, ctaName: string) => {
    pushEvent('cta_click', {
        page_type: 'resume_template',
        template_slug: slug,
        cta_name: ctaName,
    });
};

/* ─── Paid-ad Landing Page Events ─── */

export const trackPaidAdLandingView = (params: {
    variant: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    ad_platform: string;
    placement: string;
}) => {
    pushEvent('paid_ad_landing_view', params);
};

export const trackPaidAdSignupStarted = (params: {
    variant: string;
    ad_platform: string;
    utm_campaign: string;
}) => {
    pushEvent('paid_ad_signup_started', params);
};

export const trackPaidAdPaywallView = (params: {
    variant: string;
    ad_platform: string;
    utm_campaign: string;
}) => {
    pushEvent('paid_ad_paywall_view', params);
};

export const trackPaidAdPaymentSuccess = (params: {
    variant: string;
    utm_campaign: string;
}) => {
    pushEvent('paid_ad_payment_success', params);
};

/* ─── Standardised Payment Event (GTM → GA4) ─── */

export const trackPaymentMade = (params: {
    value: number;
    currency: string;       // ISO code: 'USD', 'INR', 'EUR', 'GBP'
    plan_id: string;
    credits_added: number;
    source: string;          // 'MainApp', 'paywall_b', 'payment_status', etc.
}) => {
    pushEvent('payment_made', params);
};

