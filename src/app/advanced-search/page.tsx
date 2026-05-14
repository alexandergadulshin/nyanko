import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Advanced search has been merged into /search, which now has filters built
 * in. This route just redirects bookmarked links, preserving their params.
 */
const FORWARDED = [
  "q",
  "category",
  "type",
  "status",
  "rating",
  "genres",
  "excludeGenres",
  "minScore",
  "orderBy",
  "sort",
  "page",
] as const;

export default async function AdvancedSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const key of FORWARDED) {
    const raw = sp[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  redirect(query ? `/search?${query}` : "/search");
}
