"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaTimes, FaChevronDown } from "react-icons/fa";
import type { SearchCategory, SearchItem } from "~/utils/api";
import { useSearch } from "~/hooks/use-search";

interface AnimeSearchBarProps {
  onItemSelect?: (item: SearchItem) => void;
  placeholder?: string;
  className?: string;
  defaultCategory?: SearchCategory;
}

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  anime: "Anime",
  characters: "Characters",
  people: "People",
  manga: "Manga",
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as SearchCategory[];

const DETAIL_PATH: Record<SearchCategory, string> = {
  anime: "anime",
  manga: "manga",
  characters: "character",
  people: "person",
};

const HighlightMatch = React.memo(function HighlightMatch({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="rounded bg-purple-500/30 text-purple-100">
        {text.slice(i, i + q.length)}
      </span>
      {text.slice(i + q.length)}
    </>
  );
});

function itemTitle(item: SearchItem): string {
  return "title" in item ? item.title : item.name;
}

export function AnimeSearchBar({
  onItemSelect,
  placeholder = "Search…",
  className = "",
  defaultCategory = "anime",
}: AnimeSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>(defaultCategory);
  const [showCategory, setShowCategory] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setCategory(defaultCategory), [defaultCategory]);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ready = query.trim().length >= 2;
  // The shared hook debounces, hits /api/search (shared cache + rate limiter),
  // and aborts the previous request on every new keystroke.
  const { results, loading, error } = useSearch(
    { q: query, category, limit: 8 },
    { debounceMs: 350, enabled: ready },
  );

  useEffect(() => {
    if (ready) setOpen(true);
  }, [ready, results]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCategory(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goToResults = () => {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}&category=${category}`);
  };

  const handleSelect = (item: SearchItem) => {
    setOpen(false);
    setQuery("");
    if (onItemSelect) {
      onItemSelect(item);
    } else {
      router.push(`/${DETAIL_PATH[category]}/${item.malId}`);
    }
  };

  return (
    <div ref={rootRef} className={`relative w-full max-w-2xl ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
        className="flex h-12"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategory((s) => !s)}
            className="flex h-12 items-center gap-1.5 rounded-l-xl border border-r-0 border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-gray-200 transition hover:bg-white/[0.1]"
          >
            {CATEGORY_LABELS[category]}
            <FaChevronDown
              className={`h-3 w-3 transition-transform ${
                showCategory ? "rotate-180" : ""
              }`}
            />
          </button>
          {showCategory && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-[#221c33] shadow-2xl">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setShowCategory(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                    category === cat ? "text-purple-300" : "text-gray-300"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-1">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (ready) setOpen(true);
            }}
            placeholder={placeholder}
            className="h-12 w-full rounded-r-xl border border-white/10 bg-white/[0.04] pl-10 pr-9 text-white placeholder:text-gray-500 transition focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-purple-400/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-gray-500 transition hover:text-white"
            >
              <FaTimes className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>

      {open && ready && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#221c33] shadow-2xl">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Searching…
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-center text-sm text-rose-300">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No {CATEGORY_LABELS[category].toLowerCase()} found for &ldquo;
              {query.trim()}&rdquo;
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                {results.map((item) => (
                  <button
                    key={item.malId}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className="h-14 w-10 flex-shrink-0 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-anime.jpg";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        <HighlightMatch text={itemTitle(item)} query={query} />
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={goToResults}
                className="block w-full border-t border-white/10 bg-white/[0.03] px-4 py-2.5 text-center text-sm font-medium text-purple-300 transition hover:bg-white/[0.06]"
              >
                View all results for &ldquo;{query.trim()}&rdquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
