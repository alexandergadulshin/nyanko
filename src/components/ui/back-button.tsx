"use client";

import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

/**
 * Tiny client wrapper around router.back() so detail pages can stay
 * server-rendered while still offering a one-tap "back" affordance.
 */
export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={
        className ??
        "flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      }
    >
      <FaArrowLeft />
      <span>Back</span>
    </button>
  );
}
