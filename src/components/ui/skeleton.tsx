"use client";

/**
 * Skeleton — shimmer-style loading placeholder. Used while server data is
 * being fetched so the layout doesn't jump when content arrives.
 *
 * `pulse` (default) is cheaper and works fine. `shimmer` runs a gradient.
 */

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
  shimmer?: boolean;
}

const RADIUS = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({
  className = "",
  rounded = "md",
  shimmer = false,
}: SkeletonProps) {
  const base = "bg-white/[0.06]";
  const motion = shimmer
    ? "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent"
    : "animate-pulse";
  return (
    <div
      aria-hidden="true"
      className={`${base} ${RADIUS[rounded]} ${motion} ${className}`}
    />
  );
}
