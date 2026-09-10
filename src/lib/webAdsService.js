import {
  ADSENSE_CLIENT,
  ADMOB_BANNER_LAB,
  ADMOB_REWARDED_AI,
} from "./adConfig";

let scriptLoaded = false;
let scriptPromise = null;

function ensureAdBreakGlobals() {
  window.adsbygoogle = window.adsbygoogle || [];
  if (typeof window.adBreak !== "function") {
    window.adBreak = window.adConfig = function (o) {
      window.adsbygoogle.push(o);
    };
  }
}

/**
 * Load AdSense / Ad Placement script for browser rewarded + display.
 * Uses publisher client + AdMob unit slots (Google H5 / web placement pattern).
 */
export function loadWebAdsScript() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (scriptLoaded) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    ensureAdBreakGlobals();
    const existing = document.querySelector("script[data-studybuddy-adsense]");
    if (existing) {
      scriptLoaded = true;
      resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.dataset.studybuddyAdsense = "1";
    s.dataset.adFrequencyHint = "30s";
    // AdMob rewarded/banner slots enable Ad Placement rewarded on web when inventory exists
    s.dataset.admobRewardedSlot = ADMOB_REWARDED_AI;
    s.dataset.admobBannerSlot = ADMOB_BANNER_LAB;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
    s.onload = () => {
      scriptLoaded = true;
      ensureAdBreakGlobals();
      try {
        window.adConfig?.({ preloadAdBreaks: "on", sound: "on" });
      } catch {
        /* ignore */
      }
      resolve(true);
    };
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Show a browser rewarded ad via Ad Placement API.
 * Resolves { ok: true } only after adViewed (user watched — never requires a click).
 */
export function showWebRewardedAiAd() {
  return new Promise(async (resolve) => {
    const loaded = await loadWebAdsScript();
    if (!loaded || typeof window.adBreak !== "function") {
      resolve({ ok: false, reason: "script" });
      return;
    }

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    // Safety timeout if no inventory / callbacks never fire
    const timer = setTimeout(() => finish({ ok: false, reason: "timeout_or_no_fill" }), 45000);

    try {
      window.adBreak({
        type: "reward",
        name: "ai_credits",
        beforeReward: (showAdFn) => {
          // Our UI already confirmed; show immediately
          try {
            showAdFn();
          } catch (e) {
            clearTimeout(timer);
            finish({ ok: false, reason: String(e?.message || e) });
          }
        },
        adViewed: () => {
          clearTimeout(timer);
          finish({ ok: true });
        },
        adDismissed: () => {
          clearTimeout(timer);
          finish({ ok: false, reason: "dismissed" });
        },
        adBreakDone: (info) => {
          // If break completes without adViewed, treat as no fill
          if (!settled) {
            clearTimeout(timer);
            const breakStatus = info?.breakStatus || info?.status;
            finish({
              ok: false,
              reason: breakStatus ? String(breakStatus) : "no_fill",
            });
          }
        },
      });
    } catch (e) {
      clearTimeout(timer);
      finish({ ok: false, reason: String(e?.message || e) });
    }
  });
}

/**
 * Render a standard display banner into a container (calm Lab placement).
 */
export async function mountWebLabBanner(containerEl) {
  if (!containerEl) return false;
  const loaded = await loadWebAdsScript();
  if (!loaded) return false;
  containerEl.innerHTML = "";
  const ins = document.createElement("ins");
  ins.className = "adsbygoogle";
  ins.style.display = "block";
  ins.style.minHeight = "60px";
  ins.setAttribute("data-ad-client", ADSENSE_CLIENT);
  // Prefer AdMob banner unit as data-ad-slot numeric part when AdSense unit unavailable
  const slot = ADMOB_BANNER_LAB.includes("/")
    ? ADMOB_BANNER_LAB.split("/").pop()
    : ADMOB_BANNER_LAB;
  ins.setAttribute("data-ad-slot", slot);
  ins.setAttribute("data-ad-format", "auto");
  ins.setAttribute("data-full-width-responsive", "true");
  containerEl.appendChild(ins);
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    return true;
  } catch (e) {
    console.warn("[WebAds] banner push failed:", e);
    return false;
  }
}
