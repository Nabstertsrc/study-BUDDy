import React from "react";

/**
 * AdGate — Neutralized
 * 
 * Previously showed an ad before proceeding. Now it simply acts as a passthrough,
 * immediately invoking onProceed when triggered.
 */
export default function AdGate({
  featureName = "AI Feature",
  onProceed,
  trigger,
  adSlot = "AUTO",
  skipDelay = 5,
  children,
}) {
  const openGate = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (onProceed) onProceed();
  };

  const triggerWithGate = trigger
    ? React.cloneElement(trigger, {
        onClick: (e) => {
          openGate(e);
        },
      })
    : null;

  return (
    <>
      {triggerWithGate}
    </>
  );
}
