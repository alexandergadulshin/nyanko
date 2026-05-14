export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-[#181622]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6">
        <div className="h-14 w-full animate-pulse rounded-2xl bg-white/[0.04]" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full bg-white/[0.04]"
            />
          ))}
        </div>
        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]"
            >
              <div className="aspect-[3/4] animate-pulse bg-white/[0.04]" />
              <div className="space-y-2 p-3">
                <div className="h-3.5 w-full animate-pulse rounded bg-white/[0.05]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
