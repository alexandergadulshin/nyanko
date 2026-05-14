"use client";

/**
 * Toast — single ephemeral status banner. Slides in from the top-right,
 * auto-dismisses after a few seconds, ARIA polite so screen readers
 * announce it.
 *
 * Usage:
 *   const [toast, setToast] = useState<string|null>(null);
 *   ...
 *   <Toast message={toast} kind="error" onDismiss={() => setToast(null)} />
 */

import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  kind?: "error" | "success" | "info";
  /** Auto-dismiss after this many ms. 0 disables. */
  autoCloseMs?: number;
  onDismiss: () => void;
}

const KIND_CLASSES = {
  error:
    "bg-rose-950/95 ring-1 ring-rose-500/30 text-rose-100",
  success:
    "bg-emerald-950/95 ring-1 ring-emerald-500/30 text-emerald-100",
  info: "bg-zinc-900/95 ring-1 ring-white/10 text-zinc-100",
};

export function Toast({ message, kind = "error", autoCloseMs = 5000, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message || autoCloseMs <= 0) return;
    const t = setTimeout(onDismiss, autoCloseMs);
    return () => clearTimeout(t);
  }, [message, autoCloseMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm ${KIND_CLASSES[kind]}`}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm leading-snug">{message}</p>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 rounded p-1 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
