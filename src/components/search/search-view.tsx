"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaSlidersH,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import type { GenreItem, SearchCategory } from "~/utils/api";
import {
  useSearch,
  buildSearchQuery,
  type SearchParams,
  type SearchResponse,
} from "~/hooks/use-search";
import { SearchFilters } from "./search-filters";
import { SearchResultCard } from "./search-result-card";

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  anime: "Anime",
  manga: "Manga",
  characters: "Characters",
  people: "People",
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as SearchCategory[];

const FILTER_RESET = {
  type: "",
  status: "",
  rating: "",
  genres: [] as number[],
  excludeGenres: [] as number[],
  minScore: 0,
  orderBy: "",
  sort: "" as const,
};

interface SearchViewProps {
  initialParams: SearchParams;
  initialData: SearchResponse | null;
  genres: GenreItem[];
}

export function SearchView({
  initialParams,
  initialData,
  genres,
}: SearchViewProps) {
  const [params, setParams] = useState<SearchParams>(initialParams);
  const [showFilters, setShowFilters] = useState(false);

  const { results, pagination, loading, error } = useSearch(params, {
    initialData,
  });

  // Mirror state into the URL without a server round-trip — refresh and
  // link-sharing keep working, but typing never re-runs the page.
  useEffect(() => {
    const qs = buildSearchQuery({ ...params, limit: undefined });
    window.history.replaceState(null, "", `/search?${qs}`);
  }, [params]);

  const update = useCallback((patch: Partial<SearchParams>) => {
    setParams((p) => ({ ...p, ...patch, page: 1 }));
  }, []);

  const setCategory = useCallback((category: SearchCategory) => {
    // Filters are category-specific — reset them, keep the query.
    setParams((p) => ({ ...p, ...FILTER_RESET, category, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setParams((p) => ({ ...p, ...FILTER_RESET, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((p) => ({ ...p, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (params.type) n++;
    if (params.status) n++;
    if (params.rating) n++;
    if (params.minScore && params.minScore > 0) n++;
    if (params.orderBy) n++;
    if (params.sort) n++;
    n += params.genres?.length ?? 0;
    n += params.excludeGenres?.length ?? 0;
    return n;
  }, [params]);

  const trimmedQuery = params.q.trim();
  const categoryLabel = CATEGORY_LABELS[params.category];

  return (
    <main className="min-h-screen bg-[#181622]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6">
        {/* Search bar */}
        <div className="relative">
          <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={params.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search anime, manga, characters, people…"
            className="h-14 w-full rounded-2xl bg-white/[0.04] pl-12 pr-12 text-base text-white ring-1 ring-inset ring-white/10 transition placeholder:text-gray-500 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-purple-400/60"
          />
          {params.q && (
            <button
              type="button"
              onClick={() => update({ q: "" })}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 transition hover:bg-white/[0.06] hover:text-white"
            >
              <FaTimes className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category pills + filter toggle */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const active = params.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                  active
                    ? "bg-purple-500/90 text-white ring-purple-400/50"
                    : "bg-white/[0.04] text-gray-300 ring-white/10 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-gray-400 transition hover:text-white"
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                showFilters || activeFilterCount > 0
                  ? "bg-purple-500/15 text-purple-200 ring-purple-400/40"
                  : "bg-white/[0.04] text-gray-300 ring-white/10 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <FaSlidersH className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-purple-500/80 px-1.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <SearchFilters
            category={params.category}
            params={params}
            genres={genres}
            onChange={update}
          />
        )}

        {/* Result meta */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
          <span>
            {loading && results.length === 0
              ? "Searching…"
              : error
                ? ""
                : pagination
                  ? trimmedQuery
                    ? `${pagination.total.toLocaleString()} result${
                        pagination.total === 1 ? "" : "s"
                      }`
                    : `Top ${categoryLabel.toLowerCase()}`
                  : ""}
          </span>
          {pagination && pagination.lastPage > 1 && !error && (
            <span>
              Page {pagination.page.toLocaleString()} of{" "}
              {pagination.lastPage.toLocaleString()}
            </span>
          )}
        </div>

        {/* Results */}
        <div className="mt-3">
          {error ? (
            <div className="rounded-2xl bg-rose-500/10 px-4 py-10 text-center text-sm text-rose-200 ring-1 ring-inset ring-rose-400/20">
              {error}
            </div>
          ) : loading && results.length === 0 ? (
            <ResultsSkeleton />
          ) : results.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.03] px-4 py-16 text-center ring-1 ring-inset ring-white/[0.06]">
              <p className="text-gray-300">
                No {categoryLabel.toLowerCase()} found
                {trimmedQuery ? ` for “${trimmedQuery}”` : ""}.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try a different keyword
                {activeFilterCount > 0 ? " or clearing filters" : ""}.
              </p>
            </div>
          ) : (
            <div
              className={
                loading
                  ? "opacity-50 transition-opacity"
                  : "transition-opacity"
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {results.map((item) => (
                  <SearchResultCard
                    key={`${params.category}-${item.malId}`}
                    item={item}
                    category={params.category}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.lastPage > 1 && !error && (
          <Pagination
            page={pagination.page}
            lastPage={pagination.lastPage}
            hasNext={pagination.hasNextPage}
            onGo={goToPage}
          />
        )}
      </div>
    </main>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
  );
}

function Pagination({
  page,
  lastPage,
  hasNext,
  onGo,
}: {
  page: number;
  lastPage: number;
  hasNext: boolean;
  onGo: (page: number) => void;
}) {
  const windowSize = 2;
  const start = Math.max(1, page - windowSize);
  const end = Math.min(lastPage, page + windowSize);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const btn =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium ring-1 ring-inset transition";
  const idle =
    "bg-white/[0.04] text-gray-300 ring-white/10 hover:bg-white/[0.08] hover:text-white";

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onGo(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${btn} ${idle} disabled:cursor-not-allowed disabled:opacity-30`}
      >
        <FaChevronLeft className="h-3 w-3" />
      </button>

      {start > 1 && (
        <>
          <button type="button" onClick={() => onGo(1)} className={`${btn} ${idle}`}>
            1
          </button>
          {start > 2 && <span className="px-1 text-gray-600">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onGo(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${btn} ${
            p === page
              ? "bg-purple-500/90 text-white ring-purple-400/50"
              : idle
          }`}
        >
          {p}
        </button>
      ))}

      {end < lastPage && (
        <>
          {end < lastPage - 1 && <span className="px-1 text-gray-600">…</span>}
          <button
            type="button"
            onClick={() => onGo(lastPage)}
            className={`${btn} ${idle}`}
          >
            {lastPage}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onGo(page + 1)}
        disabled={!hasNext}
        aria-label="Next page"
        className={`${btn} ${idle} disabled:cursor-not-allowed disabled:opacity-30`}
      >
        <FaChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}
