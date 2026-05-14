"use client";

/**
 * ProfileSkeleton — Apple-style loading state. Matches the hero card +
 * three section cards so swap-in doesn't shift the page.
 */

import { Skeleton } from "~/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero card */}
      <div className="rounded-[32px] bg-white/[0.03] ring-1 ring-white/[0.06] p-6 sm:p-10">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
          <Skeleton rounded="full" className="h-32 w-32 ring-[3px] ring-white/10" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Composition card */}
      <div className="rounded-[28px] bg-white/[0.03] ring-1 ring-white/[0.06] p-6 sm:p-8">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-5 h-3 w-full" rounded="full" />
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Favorites card */}
      <div className="rounded-[28px] bg-white/[0.03] ring-1 ring-white/[0.06] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3]" />
          ))}
        </div>
      </div>
    </div>
  );
}
