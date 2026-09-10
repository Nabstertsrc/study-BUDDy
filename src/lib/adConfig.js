/**
 * Google ads config for Study Buddy.
 * Android: AdMob native SDK. Browser: AdSense / Ad Placement API (same pub + AdMob slots).
 * Policy: rewarded watch-to-unlock only; calm banners; never incentivize clicks.
 */
export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-4822909337458174";
export const ADMOB_APP_ID = import.meta.env.VITE_ADMOB_APP_ID || "ca-app-pub-4822909337458174~3440478092";
export const ADMOB_REWARDED_AI = import.meta.env.VITE_ADMOB_REWARDED_AI || "ca-app-pub-4822909337458174/2775826783";
export const ADSENSE_LAB_BANNER_SLOT = import.meta.env.VITE_ADSENSE_LAB_BANNER_SLOT || "4474358169";

export const ADMOB_BANNER_LAB = import.meta.env.VITE_ADMOB_BANNER_LAB || "ca-app-pub-4822909337458174/8704764718";

/** AI generations unlocked per completed rewarded ad */
export const AI_CREDITS_PER_REWARD = 3;

/** Soft daily free AI uses when no ad inventory is available */
export const WEB_DAILY_FREE_AI = 3;

export const AI_CREDITS_STORAGE_KEY = "studybuddy_ai_credits_v1";
export const WEB_DAILY_STORAGE_KEY = "studybuddy_ai_web_daily_v1";
