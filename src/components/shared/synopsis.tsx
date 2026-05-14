"use client";

import { useState } from "react";
import { usePreferences } from "~/hooks/use-preferences";

interface SynopsisProps {
  text: string;
  className?: string;
}

/**
 * Renders synopsis / about text. When the user has spoiler warnings enabled
 * (the default), the text is blurred behind a tap-to-reveal overlay.
 */
export function Synopsis({ text, className = "" }: SynopsisProps) {
  const { spoilerWarnings } = usePreferences();
  const [revealed, setRevealed] = useState(false);
  const hidden = spoilerWarnings && !revealed;

  return (
    <div className="relative">
      <p
        className={`text-gray-300 leading-relaxed transition-all duration-200 ${className} ${
          hidden ? "select-none blur-sm" : ""
        }`}
      >
        {text}
      </p>
      {hidden && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          aria-label="Reveal synopsis"
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20 text-sm font-medium text-white/90 transition-colors hover:bg-black/30"
        >
          Tap to reveal — spoiler warnings are on
        </button>
      )}
    </div>
  );
}
