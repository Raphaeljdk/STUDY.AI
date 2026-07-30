import { useCallback, useEffect } from 'react';
import { trackConversion, trackEvent } from '@/components/GoogleAds';

const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID || '';

/**
 * Hook for tracking page views and custom events via Google Ads / gtag.js.
 *
 * Usage:
 *   const { trackPageView, trackChatMessage, trackFlashcardGeneration, trackSignup } = useGoogleAds();
 */
export function useGoogleAds() {
  // Fire a page_view on mount (SPA navigation support)
  const trackPageView = useCallback((url?: string) => {
    if (!GADS_ID || typeof window === 'undefined') return;
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('config', GADS_ID, {
        page_path: url || window.location.pathname,
      });
    }
  }, []);

  /** Track a chat message sent by the user */
  const trackChatMessage = useCallback(() => {
    const label = process.env.NEXT_PUBLIC_GADS_CONVERSION_CHAT;
    if (label) {
      trackConversion(label);
    }
    trackEvent('chat_message_sent');
  }, []);

  /** Track flashcard generation */
  const trackFlashcardGeneration = useCallback(() => {
    const label = process.env.NEXT_PUBLIC_GADS_CONVERSION_FLASH;
    if (label) {
      trackConversion(label);
    }
    trackEvent('flashcard_generated');
  }, []);

  /** Track user sign-up / registration */
  const trackSignup = useCallback(() => {
    const label = process.env.NEXT_PUBLIC_GADS_CONVERSION_SIGNUP;
    if (label) {
      trackConversion(label);
    }
    trackEvent('sign_up');
  }, []);

  /** Track user login */
  const trackLogin = useCallback(() => {
    trackEvent('login');
  }, []);

  /** Track custom event */
  const trackCustom = useCallback((eventName: string, params?: Record<string, string | number>) => {
    trackEvent(eventName, params);
  }, []);

  // Auto-track page view on mount
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  return {
    trackPageView,
    trackChatMessage,
    trackFlashcardGeneration,
    trackSignup,
    trackLogin,
    trackCustom,
  };
}
