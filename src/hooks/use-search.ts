"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchCategory, SearchItem } from "~/utils/api";

export interface SearchParams {
  q: string;
  category: SearchCategory;
  type?: string;
  status?: string;
  rating?: string;
  genres?: number[];
  excludeGenres?: number[];
  minScore?: number;
  orderBy?: string;
  sort?: "asc" | "desc" | "";
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  items: SearchItem[];
  page: number;
  hasNextPage: boolean;
  lastPage: number;
  total: number;
}

export type SearchPagination = Omit<SearchResponse, "items">;

interface UseSearchOptions {
  /** Debounce applied when the query text changes (default 300ms). */
  debounceMs?: number;
  /** Server-rendered first page — skips the initial fetch when params match. */
  initialData?: SearchResponse | null;
  /** When false the hook stays idle and never fetches. */
  enabled?: boolean;
}

interface UseSearchState {
  results: SearchItem[];
  pagination: SearchPagination | null;
  loading: boolean;
  error: string | null;
}

/**
 * Serialize search params into a query string. Shared by the hook (to call
 * /api/search) and by the search page (to keep the browser URL in sync) —
 * both use the same parameter names.
 */
export function buildSearchQuery(params: SearchParams): string {
  const sp = new URLSearchParams();
  if (params.q.trim()) sp.set("q", params.q.trim());
  sp.set("category", params.category);
  if (params.type) sp.set("type", params.type);
  if (params.status) sp.set("status", params.status);
  if (params.rating) sp.set("rating", params.rating);
  if (params.genres?.length) sp.set("genres", params.genres.join(","));
  if (params.excludeGenres?.length)
    sp.set("excludeGenres", params.excludeGenres.join(","));
  if (params.minScore && params.minScore > 0)
    sp.set("minScore", String(params.minScore));
  if (params.orderBy) sp.set("orderBy", params.orderBy);
  if (params.sort) sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  return sp.toString();
}

/**
 * Debounced search against /api/search with in-flight request cancellation.
 *
 * - Query-text changes are debounced; category / filter / page changes apply
 *   immediately so clicks feel instant.
 * - Every new request aborts the previous one (AbortController), so a fast
 *   typist never sees results from a stale keystroke.
 * - `initialData` lets a Server Component hand off its first page without a
 *   redundant client fetch.
 */
export function useSearch(
  params: SearchParams,
  options: UseSearchOptions = {},
): UseSearchState {
  const { debounceMs = 300, initialData = null, enabled = true } = options;

  const queryString = buildSearchQuery(params);

  // The query string the server-rendered initialData corresponds to — the
  // first client render matching it skips the network entirely.
  const initialKey = useRef(initialData ? queryString : null);
  const prevQuery = useRef(params.q);

  const [state, setState] = useState<UseSearchState>(() => ({
    results: initialData?.items ?? [],
    pagination: initialData
      ? {
          page: initialData.page,
          hasNextPage: initialData.hasNextPage,
          lastPage: initialData.lastPage,
          total: initialData.total,
        }
      : null,
    loading: false,
    error: null,
  }));

  useEffect(() => {
    if (!enabled) return;

    if (initialKey.current === queryString) {
      initialKey.current = null; // valid for the first matching render only
      prevQuery.current = params.q;
      return;
    }

    // Only debounce when the typed query changed; discrete clicks fire now.
    const queryChanged = prevQuery.current !== params.q;
    prevQuery.current = params.q;
    const delay = queryChanged ? debounceMs : 0;

    const controller = new AbortController();
    let cancelled = false;

    const timer = setTimeout(() => {
      setState((s) => ({ ...s, loading: true, error: null }));

      fetch(`/api/search?${queryString}`, { signal: controller.signal })
        .then(async (res) => {
          const body = (await res.json()) as SearchResponse & { error?: string };
          if (!res.ok) throw new Error(body.error ?? "Search failed");
          return body;
        })
        .then((data) => {
          if (cancelled) return;
          setState({
            results: data.items,
            pagination: {
              page: data.page,
              hasNextPage: data.hasNextPage,
              lastPage: data.lastPage,
              total: data.total,
            },
            loading: false,
            error: null,
          });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : "Search failed",
          }));
        });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
    // params.q is captured via queryString; listing it would double-fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, enabled, debounceMs]);

  return state;
}
