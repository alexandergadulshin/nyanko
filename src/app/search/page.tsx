import type { Metadata } from "next";
import { aggregator, type SearchCategory } from "~/lib/aggregator";
import { SearchView } from "~/components/search/search-view";
import type { SearchParams } from "~/hooks/use-search";

export const metadata: Metadata = {
  title: "Search · Nyanko",
  description: "Search anime, manga, characters, and people.",
};

export const dynamic = "force-dynamic";

const CATEGORIES: readonly SearchCategory[] = [
  "anime",
  "manga",
  "characters",
  "people",
];
const PER_PAGE = 24;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseIds(raw: string | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const categoryRaw = first(sp.category);
  const category: SearchCategory = CATEGORIES.includes(
    categoryRaw as SearchCategory,
  )
    ? (categoryRaw as SearchCategory)
    : "anime";

  const sortRaw = first(sp.sort);
  const sort: SearchParams["sort"] =
    sortRaw === "asc" || sortRaw === "desc" ? sortRaw : "";

  const initialParams: SearchParams = {
    q: first(sp.q) ?? "",
    category,
    type: first(sp.type) ?? "",
    status: first(sp.status) ?? "",
    rating: first(sp.rating) ?? "",
    genres: parseIds(first(sp.genres)),
    excludeGenres: parseIds(first(sp.excludeGenres)),
    minScore: Number(first(sp.minScore)) || 0,
    orderBy: first(sp.orderBy) ?? "",
    sort,
    page: Math.max(1, Number(first(sp.page)) || 1),
    limit: PER_PAGE,
  };

  // Prefetch the first page + genre taxonomy server-side. This hits the same
  // Redis cache the /api/search route uses, so the page paints with real
  // results and the client hook skips its initial fetch.
  const [initialData, genres] = await Promise.all([
    aggregator
      .searchPaged({
        category: initialParams.category,
        query: initialParams.q,
        type: initialParams.type,
        status: initialParams.status,
        rating: initialParams.rating,
        genres: initialParams.genres,
        excludeGenres: initialParams.excludeGenres,
        minScore: initialParams.minScore,
        orderBy: initialParams.orderBy,
        sort: sort || undefined,
        page: initialParams.page,
        limit: PER_PAGE,
      })
      .catch(() => null),
    aggregator.taxonomy.genres().catch(() => []),
  ]);

  return (
    <SearchView
      initialParams={initialParams}
      initialData={initialData}
      genres={genres}
    />
  );
}
