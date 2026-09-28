import { useEffect, useRef } from "react";

/**
 * Shared accessibility behaviour for overlays (mobile nav drawer, modals,
 * side drawers).
 *
 * While `active` is true it:
 *  - locks background scrolling so the page behind the overlay can't move
 *    (essential for touch devices where a swipe on the backdrop scrolls
 *    the content underneath)
 *  - closes the overlay on Escape
 *
 * CSS handles the visual/layout side; this only covers the two things CSS
 * cannot do.
 */
export function useDialogA11y(active: boolean, onClose?: () => void) {
  const closeRef = useRef(onClose);

  // Keep the latest handler without re-running the effect below.
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    // Compensate for the scrollbar disappearing on desktop so the layout
    // doesn't shift horizontally when the overlay opens.
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarGap > 0) body.style.paddingRight = `${scrollbarGap}px`;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current?.();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);
}
