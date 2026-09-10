import { useEffect } from "react";
import { canShowAdMob, removeLabBanner, showLabBanner } from "@/lib/adMobService";

/**
 * Calm bottom banner on native only. Mount on Study Lab — never covers primary CTAs on web.
 */
export default function LabBannerAd() {
  useEffect(() => {
    if (!canShowAdMob()) return undefined;
    showLabBanner();
    return () => {
      removeLabBanner();
    };
  }, []);

  // Native banner is drawn by the SDK over the webview; reserve space so content isn't hidden.
  if (!canShowAdMob()) return null;
  return <div className="h-16 w-full shrink-0" aria-hidden />;
}
