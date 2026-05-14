/**
 * Server-renderable skeleton used by every /anime, /manga, /character,
 * /person detail route's loading.tsx. Renders instantly during navigation
 * while the page's async data fetch is in flight.
 */

interface DetailSkeletonProps {
  /** Variant determines whether to render the "related works grid" tail. */
  variant: "anime" | "manga" | "character" | "person";
}

export function DetailSkeleton({ variant }: DetailSkeletonProps) {
  const showRelatedGrid = variant !== "anime" && variant !== "manga";
  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent">
      <div className="sticky top-[72px] z-10 bg-[#181622]/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="h-5 w-16 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              <div className="w-full max-w-sm mx-auto aspect-[3/4] rounded-lg bg-white/[0.04] animate-pulse" />
              <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 w-full bg-white/[0.05] rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-9 w-2/3 bg-white/[0.07] rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-white/[0.05] rounded animate-pulse" />
            <div className="space-y-2 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-full bg-white/[0.04] rounded animate-pulse"
                />
              ))}
            </div>
            <div className="flex gap-2 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-20 bg-purple-600/15 rounded-full animate-pulse"
                />
              ))}
            </div>
            {showRelatedGrid && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] bg-white/[0.04] rounded animate-pulse"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
