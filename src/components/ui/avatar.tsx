"use client";

/**
 * Avatar — image with a graceful initials fallback when the image is
 * missing, fails to load, or hasn't been uploaded yet.
 *
 * Initials are derived from the name (first two word-initials, e.g.
 * "Alexander Gadulshin" -> "AG"). The fallback background is a
 * deterministic muted tone derived from the name so two different
 * users with the same first letter stay visually distinct.
 */

import { useState } from "react";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASSES: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
  "2xl": "h-32 w-32 text-3xl",
};

function initialsFor(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

/** Deterministic muted background per name — keeps the page visually
 *  varied without random color flashing on re-render. */
function bgFor(name: string | undefined | null): string {
  const palette = [
    "bg-purple-600/30 text-purple-100",
    "bg-fuchsia-600/30 text-fuchsia-100",
    "bg-pink-600/30 text-pink-100",
    "bg-indigo-600/30 text-indigo-100",
    "bg-violet-600/30 text-violet-100",
    "bg-blue-600/30 text-blue-100",
    "bg-rose-600/30 text-rose-100",
    "bg-emerald-600/30 text-emerald-100",
  ];
  if (!name) return palette[0]!;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length]!;
}

interface AvatarProps {
  name: string | undefined | null;
  src?: string | null;
  size?: Size;
  /** Apply a ring on hover. Useful on cards that link somewhere. */
  hoverable?: boolean;
  className?: string;
}

export function Avatar({
  name,
  src,
  size = "md",
  hoverable = false,
  className = "",
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && src.trim() !== "" && !failed;
  const ringClasses = hoverable
    ? "transition-shadow ring-0 ring-purple-400/0 hover:ring-2 hover:ring-purple-400/60"
    : "";

  const sizeClass = SIZE_CLASSES[size];

  if (showImage) {
    // We deliberately don't use next/image here — user-uploaded avatars are
    // pre-resized client-side and external URLs aren't allow-listed.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name ?? "User avatar"}
        className={`${sizeClass} rounded-full object-cover bg-zinc-800 ${ringClasses} ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      aria-label={name ?? "User avatar"}
      role="img"
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold select-none ${bgFor(name)} ${ringClasses} ${className}`}
    >
      {initialsFor(name)}
    </div>
  );
}
