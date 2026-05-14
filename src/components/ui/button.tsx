"use client";

/**
 * Button — a single styled button with variants, sizes, loading state, and
 * leading/trailing icons. Built to be the only button primitive across the
 * profile + friends rebuild so visual rhythm stays consistent.
 *
 * Variants:
 *  - primary: filled accent. CTA.
 *  - secondary: subtle filled surface. Non-CTA actions.
 *  - ghost: text-only with hover bg. Tertiary actions.
 *  - danger: red filled. Destructive actions.
 *  - outline: bordered, transparent bg. Cancel / secondary CTA.
 */

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white shadow-sm shadow-purple-900/40",
  secondary:
    "bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.08] text-zinc-100 ring-1 ring-inset ring-white/10",
  ghost:
    "bg-transparent hover:bg-white/[0.06] active:bg-white/[0.04] text-zinc-300 hover:text-white",
  danger:
    "bg-rose-600/90 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm shadow-rose-900/40",
  outline:
    "bg-transparent hover:bg-white/[0.05] active:bg-white/[0.03] text-zinc-200 ring-1 ring-inset ring-zinc-700 hover:ring-zinc-600",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-lg font-medium " +
  "transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "whitespace-nowrap";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Show a spinner and disable. */
  loading?: boolean;
  /** Icon shown before children. */
  leadingIcon?: ReactNode;
  /** Icon shown after children. */
  trailingIcon?: ReactNode;
  /** When true, render only an icon (no text). Children should be the icon. */
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    iconOnly = false,
    disabled,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const sizeClass = iconOnly
    ? size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-12 w-12"
        : "h-10 w-10"
    : SIZE_CLASSES[size];

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${sizeClass} ${className}`}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}
      {!loading && leadingIcon}
      {!iconOnly && children}
      {iconOnly && !loading && children}
      {!loading && trailingIcon}
    </button>
  );
});
