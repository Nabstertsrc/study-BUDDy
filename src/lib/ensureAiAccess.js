import { AI_CREDITS_PER_REWARD } from "./adConfig";
import {
  addAiCredits,
  getAiCredits,
  getWebDailyRemaining,
  spendAiCredit,
  spendWebDailyFree,
} from "./aiCredits";
import { canShowAdMob, showRewardedAiAd } from "./adMobService";
import { isNativeShell } from "./platform";

const ADMIN_EMAILS = ["nabstertsr@gmail.com", "nabsterts@gmail.com"];

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(String(email).toLowerCase());
}

/**
 * Gate for user-facing AI calls.
 * - Admins: free
 * - Background helpers (isBackground): free (no modal spam)
 * - Native: spend credit or watch rewarded ad → +credits
 * - Web: limited daily free; then ask to use the Android app for rewarded ads
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

  if (canShowAdMob()) {
    // Ask UI layer to confirm (optional); then show rewarded ad
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
    if (!result.ok) {
      const err = new Error(
        result.reason === "web"
          ? "Rewarded ads are available in the Study Buddy Android app."
          : "Could not show rewarded ad. Try again in a moment."
      );
      err.code = "AI_AD_FAILED";
      throw err;
    }
    addAiCredits(AI_CREDITS_PER_REWARD);
    spendAiCredit();
    return { allowed: true, fromReward: true, remaining: getAiCredits() };
  }

  // Web fallback — soft free daily quota (not fake ads)
  if (getWebDailyRemaining() > 0) {
    spendWebDailyFree();
    return { allowed: true, fromWebDaily: true, remaining: getWebDailyRemaining() };
  }

  const err = new Error(
    "You've used today's free AI on the web. Open the Study Buddy Android app and watch a short ad to unlock more — or support us on Buy Me a Coffee."
  );
  err.code = "AI_WEB_LIMIT";
  throw err;
}
