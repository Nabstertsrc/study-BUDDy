import React, { useEffect, useRef } from 'react';

/**
 * AdBanner — Compliant Google AdSense display ad unit.
 * Renders only in browser environments and avoids double-push on StrictMode.
 *
 * Props:
 *  slot      — ad slot ID (string)
 *  format    — 'auto' | 'fluid' | 'rectangle' | 'vertical' (default 'auto')
 *  className — extra wrapper classes
 *  style     — inline style overrides for the <ins> element
 */
export default function AdBanner({
  slot,
  format = 'auto',
  className = '',
  style = {},
}) {
  const insRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Guard: only push once, and only when the element exists
    if (pushed.current) return;
    if (!insRef.current) return;
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch (e) {
      // AdSense not loaded — silently ignore (e.g. ad-blocker)
    }
  }, []);

  return (
    <div className={`ad-banner-wrapper w-full overflow-hidden ${className}`} aria-label="Advertisement">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-4822909337458174"
        data-ad-slot={slot || ''}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
