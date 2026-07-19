import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Clock, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AdGate — shows a Google AdSense ad before an AI feature runs.
 * 
 * Usage:
 *   <AdGate
 *     featureName="Quiz Generator"
 *     onProceed={() => runMyAIFunction()}
 *     trigger={<Button>Generate Quiz</Button>}
 *   />
 * 
 * Props:
 *   featureName  — Display name of the AI feature (e.g. "Quiz Generator")
 *   onProceed    — Callback fired when user clicks Continue after the ad
 *   trigger      — The button/element that opens the gate
 *   adSlot       — AdSense ad slot ID (optional, falls back to placeholder)
 *   skipDelay    — Seconds before Continue is enabled (default: 5)
 */
export default function AdGate({
  featureName = "AI Feature",
  onProceed,
  trigger,
  adSlot = "AUTO",
  skipDelay = 5,
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(skipDelay);
  const [canContinue, setCanContinue] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const adRef = useRef(null);
  const intervalRef = useRef(null);

  const openGate = useCallback((e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setIsOpen(true);
    setCountdown(skipDelay);
    setCanContinue(false);
    setAdLoaded(false);
  }, [skipDelay]);

  const handleProceed = useCallback(() => {
    setIsOpen(false);
    if (onProceed) onProceed();
  }, [onProceed]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) {
      clearInterval(intervalRef.current);
      return;
    }
    setCountdown(skipDelay);
    setCanContinue(false);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isOpen, skipDelay]);

  // Push AdSense ad when modal opens
  useEffect(() => {
    if (!isOpen || !adRef.current) return;
    try {
      // Only push if AdSense is loaded and the slot hasn't been filled
      if (window.adsbygoogle && adRef.current.dataset.adStatus !== 'done') {
        window.adsbygoogle.push({});
        adRef.current.dataset.adStatus = 'done';
      }
      setAdLoaded(true);
    } catch (e) {
      setAdLoaded(true); // Show placeholder if AdSense fails
    }
  }, [isOpen]);

  // Clone trigger element to intercept its onClick
  const triggerWithGate = trigger
    ? React.cloneElement(trigger, {
        onClick: (e) => {
          // If trigger has its own onClick, we replace it with openGate
          openGate(e);
        },
      })
    : null;

  return (
    <>
      {/* Trigger element */}
      {triggerWithGate}

      {/* Ad Gate Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              {/* Header gradient bar */}
              <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                      AI Feature
                    </p>
                    <h3 className="font-black text-white text-sm leading-tight">
                      {featureName}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Ad area */}
              <div className="px-6 pt-5 pb-2">
                <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 min-h-[120px] flex items-center justify-center">
                  {/* AdSense unit — replace data-ad-client with your publisher ID */}
                  <ins
                    ref={adRef}
                    className="adsbygoogle"
                    style={{ display: "block", width: "100%", minHeight: "120px" }}
                    data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX"
                    data-ad-slot={adSlot}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                  />
                  {/* Placeholder shown if AdSense hasn't loaded */}
                  {!adLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 pointer-events-none">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
                      <p className="text-xs font-medium">Loading ad...</p>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-300 text-center mt-1 font-bold uppercase tracking-wider">
                  Advertisement • Keeps AI features free
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-3 space-y-3">
                {/* Trust message */}
                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 rounded-xl p-3">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs leading-tight">
                    <span className="font-bold text-slate-700">Why ads?</span>{" "}
                    Ads let us keep all AI features completely free for students.
                    We never spam or auto-refresh.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProceed}
                    disabled={!canContinue}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:from-violet-700 hover:to-indigo-700 transition-all"
                  >
                    {canContinue ? (
                      <>
                        Continue
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        Continue in {countdown}s
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress bar for countdown */}
              <div className="h-1 bg-slate-100">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  initial={{ width: "100%" }}
                  animate={{ width: canContinue ? "100%" : `${((skipDelay - countdown) / skipDelay) * 100}%` }}
                  transition={{ ease: "linear", duration: 0.9 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
