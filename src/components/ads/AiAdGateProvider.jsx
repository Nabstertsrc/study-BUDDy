import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AI_CREDITS_PER_REWARD } from "@/lib/adConfig";
import { getAiCredits } from "@/lib/aiCredits";
import { canShowAdMob } from "@/lib/adMobService";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const AiCreditsContext = createContext({ credits: 0 });

export function useAiCredits() {
  return useContext(AiCreditsContext);
}

/**
 * Registers a confirm dialog for rewarded ads (watch to unlock — never click-to-earn).
 */
export default function AiAdGateProvider({ children }) {
  const [credits, setCredits] = useState(() => getAiCredits());
  const [open, setOpen] = useState(false);
  const [resolver, setResolver] = useState(null);

  useEffect(() => {
    const onChange = (e) => setCredits(e.detail?.credits ?? getAiCredits());
    window.addEventListener("ai-credits-changed", onChange);
    return () => window.removeEventListener("ai-credits-changed", onChange);
  }, []);

  useEffect(() => {
    window.__studyBuddyConfirmAd = ({ creditsPerReward } = {}) =>
      new Promise((resolve) => {
        if (!canShowAdMob()) {
          resolve(true);
          return;
        }
        setResolver(() => resolve);
        setOpen(true);
        // stash for UI label
        window.__studyBuddyAdCredits = creditsPerReward || AI_CREDITS_PER_REWARD;
      });
    return () => {
      delete window.__studyBuddyConfirmAd;
    };
  }, []);

  const close = useCallback(
    (value) => {
      setOpen(false);
      if (resolver) resolver(value);
      setResolver(null);
    },
    [resolver]
  );

  const value = useMemo(() => ({ credits }), [credits]);

  return (
    <AiCreditsContext.Provider value={value}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Unlock AI with a short ad</h3>
                <p className="text-sm text-slate-500">
                  Watch a rewarded ad to get {window.__studyBuddyAdCredits || AI_CREDITS_PER_REWARD} AI uses.
                  You never need to click the ad — just watch.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => close(false)}>
                Not now
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => close(true)}>
                Watch ad
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Credits left after unlock: shown in Study Lab. Policy-safe rewarded ads only.
            </p>
          </div>
        </div>
      )}
    </AiCreditsContext.Provider>
  );
}
