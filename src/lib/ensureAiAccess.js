import { AI_CREDITS_PER_REWARD } from "./adConfig";
import {
  addAiCredits,
  getAiCredits,
  getWebDailyRemaining,
  spendAiCredit,
  spendWebDailyFree,
} from "./aiCredits";
import { showRewardedAiAd } from "./adMobService";

const ADMIN_EMAILS = ["nabstertsr@gmail.com", "nabsterts@gmail.com"];

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(String(email).toLowerCase());
}

/**
 * Gate for user-facing AI calls.
 * - Admins: free
 * - Background helpers (isBackground): free (no modal spam)
 * - Spend credit or watch rewarded ad (Android AdMob / browser Ad Placement) → +credits
 * - Web: limited daily free; Soft daily free only if ad inventory does not fill
 */
export async function ensureAiAccess(options = {}) {
  if (options.isBackground || options.skipAdGate) {
    return { allowed: true, skipped: true };
  }

  try {
    const { auth } = await import("./firebase");
    const email = auth?.currentUser?.email;
    if (isAdminEmail(email)) {
      return { allowed: true, admin: true };
    }
  } catch {
    /* continue */
  }

  if (getAiCredits() > 0) {
    spendAiCredit();
    return { allowed: true, fromCredits: true, remaining: getAiCredits() };
  }

  // Confirm then show rewarded ad (AdMob on Android, Ad Placement API in browser)
  if (typeof window.__studyBuddyConfirmAd === "function") {
    const ok = await window.__studyBuddyConfirmAd({
      creditsPerReward: AI_CREDITS_PER_REWARD,
    });
    if (!ok) {
      const err = new Error("Watch a short ad to unlock AI features.");
      err.code = "AI_AD_REQUIRED";
      throw err;
    }
  }

  const result = await showRewardedAiAd();
  if (result.ok) {
    addAiCredits(AI_CREDITS_PER_REWARD);
    spendAiCredit();
    return { allowed: true, fromReward: true, remaining: getAiCredits() };
  }

  // Soft free daily only when ad inventory is unavailable (no fill / AdSense inactive)
  if (getWebDailyRemaining() > 0) {
    spendWebDailyFree();
    return {
      allowed: true,
      fromWebDaily: true,
      remaining: getWebDailyRemaining(),
      adReason: result.reason,
    };
  }

  const err = new Error(
    "No ad was available and today's free AI uses are used up. Try again later, or support us on Buy Me a Coffee."
  );
  err.code = "AI_WEB_LIMIT";
  err.adReason = result.reason;
  throw err;
}
