import { Capacitor } from "@capacitor/core";
import { ADMOB_BANNER_LAB, ADMOB_REWARDED_AI } from "./adConfig";
import { isNativeShell } from "./platform";

let initialized = false;

export function canShowAdMob() {
  return isNativeShell() && Capacitor.getPlatform() !== "web";
}

export async function initializeAdMob() {
  if (!canShowAdMob() || initialized) return false;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize({
      initializeForTesting: false,
    });
    initialized = true;
    return true;
  } catch (e) {
    console.warn("[AdMob] initialize failed:", e);
    return false;
  }
}

/**
 * Show a rewarded video. Resolves true only if the user earned the reward
 * (watched through). Never prompts to click the ad.
 */
export async function showRewardedAiAd() {
  if (!canShowAdMob()) {
    const { showWebRewardedAiAd } = await import("./webAdsService");
    return showWebRewardedAiAd();
  }
  try {
    await initializeAdMob();
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.prepareRewardVideoAd({
      adId: ADMOB_REWARDED_AI,
      isTesting: false,
    });
    const reward = await AdMob.showRewardVideoAd();
    // showRewardVideoAd resolves when reward is earned
    if (reward) {
      return { ok: true, reward };
    }
    return { ok: false, reason: "no_reward" };
  } catch (e) {
    console.warn("[AdMob] rewarded failed:", e);
    return { ok: false, reason: String(e?.message || e) };
  }
}

export async function showLabBanner() {
  if (!canShowAdMob()) return;
  try {
    await initializeAdMob();
    const { AdMob, BannerAdSize, BannerAdPosition } = await import("@capacitor-community/admob");
    await AdMob.showBanner({
      adId: ADMOB_BANNER_LAB,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
    });
  } catch (e) {
    console.warn("[AdMob] banner failed:", e);
  }
}

export async function hideLabBanner() {
  if (!canShowAdMob()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.hideBanner();
  } catch {
    /* ignore */
  }
}

export async function removeLabBanner() {
  if (!canShowAdMob()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.removeBanner();
  } catch {
    /* ignore */
  }
}
