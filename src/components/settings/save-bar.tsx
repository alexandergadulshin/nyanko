"use client";

import { useEffect, useState } from "react";

interface SaveBarProps {
  visible: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * SaveBar — Stripe-style floating "you have unsaved changes" bar. Slides
 * up from the bottom only when visible. After save, the parent flips
 * visible to false; we keep DOM around for one extra frame so the slide-out
 * transition runs.
 */
export function SaveBar({ visible, saving, onSave, onDiscard }: SaveBarProps) {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    else {
      // Let the slide-out transition finish before unmounting.
      const t = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4"
    >
      <div
        role="status"
        className={
          "pointer-events-auto flex items-center gap-3 rounded-full bg-zinc-950/85 px-3 py-2 pl-5 ring-1 ring-white/[0.10] shadow-[0_18px_50px_-15px_rgba(168,85,247,0.45),0_8px_24px_-8px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-200 " +
          (visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")
        }
      >
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
          />
          Unsaved changes
        </span>
        <button
          type="button"
          onClick={onDiscard}
          disabled={saving}
          className="rounded-full px-3.5 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          {saving ? (
            <span className="inline-flex items-center gap-1.5">
              <Spinner />
              Saving
            </span>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeDasharray="42"
        strokeLinecap="round"
      />
    </svg>
  );
}
