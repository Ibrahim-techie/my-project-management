import { useEffect, useRef } from "react";

const isTyping = (el) =>
  el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * Runs `handler` when a single key is pressed outside text fields and without
 * modifiers, e.g. useHotkey("/", focusSearch). Pass `enabled: false` to pause it.
 */
export function useHotkey(key, handler, { enabled = true } = {}) {
  const saved = useRef(handler);
  saved.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      if (e.key !== key || e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      // an open dialog or drawer owns the keyboard
      if (document.querySelector('[role="dialog"],[role="alertdialog"]')) return;
      e.preventDefault();
      saved.current(e);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [key, enabled]);
}
