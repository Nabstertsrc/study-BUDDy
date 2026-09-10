import {
  AI_CREDITS_PER_REWARD,
  AI_CREDITS_STORAGE_KEY,
  WEB_DAILY_FREE_AI,
  WEB_DAILY_STORAGE_KEY,
} from "./adConfig";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getAiCredits() {
  try {
    const n = parseInt(localStorage.getItem(AI_CREDITS_STORAGE_KEY) || "0", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setAiCredits(n) {
  const v = Math.max(0, Math.floor(n));
  localStorage.setItem(AI_CREDITS_STORAGE_KEY, String(v));
  window.dispatchEvent(new CustomEvent("ai-credits-changed", { detail: { credits: v } }));
  return v;
}

export function addAiCredits(amount = AI_CREDITS_PER_REWARD) {
  return setAiCredits(getAiCredits() + amount);
}

export function spendAiCredit() {
  const cur = getAiCredits();
  if (cur <= 0) return false;
  setAiCredits(cur - 1);
  return true;
}

/** Web-only soft free quota (resets daily). Returns remaining free uses today. */
export function getWebDailyRemaining() {
  try {
    const raw = localStorage.getItem(WEB_DAILY_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || data.day !== todayKey()) {
      return WEB_DAILY_FREE_AI;
    }
    return Math.max(0, WEB_DAILY_FREE_AI - (data.used || 0));
  } catch {
    return WEB_DAILY_FREE_AI;
  }
}

export function spendWebDailyFree() {
  const remaining = getWebDailyRemaining();
  if (remaining <= 0) return false;
  const used = WEB_DAILY_FREE_AI - remaining + 1;
  localStorage.setItem(
    WEB_DAILY_STORAGE_KEY,
    JSON.stringify({ day: todayKey(), used })
  );
  return true;
}
