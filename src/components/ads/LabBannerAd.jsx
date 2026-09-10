import { useEffect, useRef } from "react";
import { canShowAdMob, removeLabBanner, showLabBanner } from "@/lib/adMobService";
import { mountWebLabBanner } from "@/lib/webAdsService";

/**
 * Calm Lab banner: native AdMob banner OR browser AdSense display unit.
 */
export default function LabBannerAd() {
  const ref = useRef(null);

  useEffect(() => {
    if (canShowAdMob()) {
      showLabBanner();
      return () => {
        removeLabBanner();
      };
    }
    let cancelled = false;
    mountWebLabBanner(ref.current).catch(() => {});
    return () => {
      cancelled = true;
      if (ref.current) ref.current.innerHTML = "";
    };
  }, []);

  if (canShowAdMob()) {
    return <div className="h-16 w-full shrink-0" aria-hidden />;
  }

  return (
    <div className="w-full mt-6 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 min-h-[60px]">
      <div ref={ref} className="w-full" />
      <p className="sr-only">Advertisement</p>
    </div>
  );
}
