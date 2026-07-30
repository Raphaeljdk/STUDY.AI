'use client';

import Script from 'next/script';

/**
 * Google Ads (gtag.js) integration component.
 * Place this inside <head> via RootLayout.
 *
 * Required env var:
 *   NEXT_PUBLIC_GADS_ID = "AW-XXXXXXX"  (your Google Ads conversion ID)
 *
 * Optional env vars for remarketing:
 *   NEXT_PUBLIC_GADS_CONVERSION_SIGNUP  = label for sign-up conversion
 *   NEXT_PUBLIC_GADS_CONVERSION_CHAT    = label for chat interaction
 *   NEXT_PUBLIC_GADS_CONVERSION_FLASH   = label for flashcard generation
 */

const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID || '';

export function GoogleAdsScript() {
  if (!GADS_ID) return null;

  return (
    <>
      {/* gtag.js base script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`}
        strategy="afterInteractive"
      />
      {/* gtag config */}
      <Script id="google-ads-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GADS_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Utility to fire a Google Ads conversion event                      */
/* ------------------------------------------------------------------ */

/**
 * Track a Google Ads conversion.
 * @param conversionLabel - e.g. "AW-123/abc123/def456" or just the label portion
 */
export function trackConversion(conversionLabel: string, value?: number) {
  if (typeof window === 'undefined' || !GADS_ID) return;

  const gtag = (window as any).gtag;
  if (typeof gtag === 'function') {
    gtag('event', 'conversion', {
      send_to: `${GADS_ID}/${conversionLabel}`,
      value: value ?? 1,
      currency: 'BRL',
    });
  }
}

/**
 * Track a custom Google Ads event (for remarketing audiences).
 */
export function trackEvent(eventName: string, params?: Record<string, string | number>) {
  if (typeof window === 'undefined' || !GADS_ID) return;

  const gtag = (window as any).gtag;
  if (typeof gtag === 'function') {
    gtag('event', eventName, {
      send_to: GADS_ID,
      ...params,
    });
  }
}
