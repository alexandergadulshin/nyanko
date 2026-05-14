"use client";

/**
 * ProfileSkeleton — placeholder rendered while the page hydrates.
 * Matches the final layout's spacing so the page doesn't jump on swap.
 */

import { Skeleton } from "~/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
        <Skeleton className="h-20 w-full rounded-none" />
        <div className="-mt-12 px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <Skeleton rounded="full" className="h-32 w-32 ring-4 ring-[#0F0E16]" />
            <div className="flex-1 space-y-2 pt-3">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 sm:p-8">
        <Skeleton className="mb-4 h-3 w-24" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-2.5 w-full" rounded="full" />
      </section>

      {/* Favorites */}
      <section className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 sm:p-8">
        <Skeleton className="mb-4 h-3 w-24" />
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, row) => (
            <div key={row}>
              <Skeleton className="mb-3 h-4 w-32" />
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
