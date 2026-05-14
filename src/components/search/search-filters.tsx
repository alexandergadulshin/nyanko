"use client";

import type React from "react";
import type { GenreItem, SearchCategory } from "~/utils/api";
import type { SearchParams } from "~/hooks/use-search";

const TYPE_OPTIONS: Record<"anime" | "manga", { value: string; label: string }[]> = {
  anime: [
    { value: "", label: "Any type" },
    { value: "tv", label: "TV" },
    { value: "movie", label: "Movie" },
    { value: "ova", label: "OVA" },
    { value: "special", label: "Special" },
    { value: "ona", label: "ONA" },
    { value: "music", label: "Music" },
  ],
  manga: [
    { value: "", label: "Any type" },
    { value: "manga", label: "Manga" },
    { value: "novel", label: "Light Novel" },
    { value: "oneshot", label: "One-shot" },
    { value: "doujin", label: "Doujinshi" },
    { value: "manhwa", label: "Manhwa" },
    { value: "manhua", label: "Manhua" },
  ],
};

const STATUS_OPTIONS: Record<"anime" | "manga", { value: string; label: string }[]> = {
  anime: [
    { value: "", label: "Any status" },
    { value: "airing", label: "Airing" },
    { value: "complete", label: "Finished" },
    { value: "upcoming", label: "Upcoming" },
  ],
  manga: [
    { value: "", label: "Any status" },
    { value: "publishing", label: "Publishing" },
    { value: "complete", label: "Finished" },
    { value: "hiatus", label: "Hiatus" },
    { value: "discontinued", label: "Discontinued" },
    { value: "upcoming", label: "Upcoming" },
  ],
};

const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "g", label: "G — All ages" },
  { value: "pg", label: "PG — Children" },
  { value: "pg13", label: "PG-13 — Teens" },
  { value: "r17", label: "R — 17+" },
  { value: "r", label: "R+ — Mild nudity" },
];

const SCORE_OPTIONS = [
  { value: 0, label: "Any score" },
  { value: 5, label: "5+" },
  { value: 6, label: "6+" },
  { value: 7, label: "7+" },
  { value: 8, label: "8+" },
  { value: 9, label: "9+" },
];

const ORDER_OPTIONS: Record<SearchCategory, { value: string; label: string }[]> = {
  anime: [
    { value: "score", label: "Score" },
    { value: "popularity", label: "Popularity" },
    { value: "rank", label: "Rank" },
    { value: "title", label: "Title" },
    { value: "start_date", label: "Start date" },
  ],
  manga: [
    { value: "score", label: "Score" },
    { value: "popularity", label: "Popularity" },
    { value: "rank", label: "Rank" },
    { value: "title", label: "Title" },
    { value: "chapters", label: "Chapters" },
  ],
  characters: [
    { value: "favorites", label: "Favorites" },
    { value: "name", label: "Name" },
  ],
  people: [
    { value: "favorites", label: "Favorites" },
    { value: "name", label: "Name" },
  ],
};

const SELECT_CLASS =
  "w-full rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-white ring-1 ring-inset ring-white/10 transition focus:outline-none focus:ring-2 focus:ring-purple-400/50 [&>option]:bg-[#221c33]";

interface SearchFiltersProps {
  category: SearchCategory;
  params: SearchParams;
  genres: GenreItem[];
  onChange: (patch: Partial<SearchParams>) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function GenreRow({
  label,
  genres,
  selected,
  tone,
  onToggle,
}: {
  label: string;
  genres: GenreItem[];
  selected: number[];
  tone: "include" | "exclude";
  onToggle: (id: number) => void;
}) {
  const activeClass =
    tone === "include"
      ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40"
      : "bg-rose-500/20 text-rose-200 ring-rose-400/40";

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-gray-400">
        {label}
        {selected.length > 0 ? ` · ${selected.length}` : ""}
      </span>
      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pr-1">
        {genres.map((g) => {
          const active = selected.includes(g.mal_id);
          return (
            <button
              key={g.mal_id}
              type="button"
              onClick={() => onToggle(g.mal_id)}
              className={`rounded-full px-2.5 py-1 text-xs ring-1 ring-inset transition ${
                active
                  ? activeClass
                  : "bg-white/[0.04] text-gray-300 ring-white/10 hover:bg-white/[0.08]"
              }`}
            >
              {g.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SearchFilters({
  category,
  params,
  genres,
  onChange,
}: SearchFiltersProps) {
  const isMedia = category === "anime" || category === "manga";
  const defaultOrder =
    category === "characters" || category === "people" ? "favorites" : "score";

  const toggleGenre = (id: number, exclude: boolean) => {
    const inc = params.genres ?? [];
    const exc = params.excludeGenres ?? [];
    if (exclude) {
      onChange({
        excludeGenres: exc.includes(id)
          ? exc.filter((g) => g !== id)
          : [...exc, id],
        genres: inc.filter((g) => g !== id),
      });
    } else {
      onChange({
        genres: inc.includes(id)
          ? inc.filter((g) => g !== id)
          : [...inc, id],
        excludeGenres: exc.filter((g) => g !== id),
      });
    }
  };

  return (
    <div className="mt-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06] sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {isMedia && (
          <Field label="Type">
            <select
              className={SELECT_CLASS}
              value={params.type ?? ""}
              onChange={(e) => onChange({ type: e.target.value })}
            >
              {TYPE_OPTIONS[category].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        {isMedia && (
          <Field label="Status">
            <select
              className={SELECT_CLASS}
              value={params.status ?? ""}
              onChange={(e) => onChange({ status: e.target.value })}
            >
              {STATUS_OPTIONS[category].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        {category === "anime" && (
          <Field label="Rating">
            <select
              className={SELECT_CLASS}
              value={params.rating ?? ""}
              onChange={(e) => onChange({ rating: e.target.value })}
            >
              {RATING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        {isMedia && (
          <Field label="Min score">
            <select
              className={SELECT_CLASS}
              value={params.minScore ?? 0}
              onChange={(e) => onChange({ minScore: Number(e.target.value) })}
            >
              {SCORE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Sort by">
          <select
            className={SELECT_CLASS}
            value={params.orderBy || defaultOrder}
            onChange={(e) => onChange({ orderBy: e.target.value })}
          >
            {ORDER_OPTIONS[category].map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Order">
          <select
            className={SELECT_CLASS}
            value={params.sort || "desc"}
            onChange={(e) =>
              onChange({ sort: e.target.value as "asc" | "desc" })
            }
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </Field>
      </div>

      {isMedia && genres.length > 0 && (
        <div className="mt-4 space-y-3">
          <GenreRow
            label="Include genres"
            genres={genres}
            selected={params.genres ?? []}
            tone="include"
            onToggle={(id) => toggleGenre(id, false)}
          />
          <GenreRow
            label="Exclude genres"
            genres={genres}
            selected={params.excludeGenres ?? []}
            tone="exclude"
            onToggle={(id) => toggleGenre(id, true)}
          />
        </div>
      )}
    </div>
  );
}
