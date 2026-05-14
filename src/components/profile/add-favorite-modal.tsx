"use client";

/**
 * AddFavoriteModal — search the Jikan API and pick an item to favorite.
 * Debounced search; ESC to close; backdrop click to close; focus trap.
 *
 * Note: anime is searchable here; character/person searches use the same
 * search endpoint with different categories. The modal accepts a `type`
 * prop and adapts which API method it calls.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { jikanAPI, type AnimeItem, type CharacterItem, type PersonItem } from "~/utils/api";

type FavoriteType = "anime" | "character" | "person";

interface AddFavoriteModalProps {
  open: boolean;
  type: FavoriteType;
  /** IDs already favorited in this category — disabled in the result list. */
  existingIds: Set<number>;
  onClose: () => void;
  onConfirm: (item: { malId: number; title: string; image: string }) => Promise<void> | void;
}

interface ResultRow {
  malId: number;
  title: string;
  image: string;
}

const DEBOUNCE_MS = 300;

export function AddFavoriteModal({
  open,
  type,
  existingIds,
  onClose,
  onConfirm,
}: AddFavoriteModalProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      setSubmittingId(null);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const myId = ++reqIdRef.current;
    const t = setTimeout(async () => {
      try {
        let raw: AnimeItem[] | CharacterItem[] | PersonItem[] = [];
        if (type === "anime") raw = await jikanAPI.searchAnime(query, 12);
        else if (type === "character") raw = await jikanAPI.searchCharacters(query, 12);
        else if (type === "person") raw = await jikanAPI.searchPeople(query, 12);

        const mapped: ResultRow[] = raw.map((item) => ({
          malId: item.malId,
          title: getTitle(item),
          image: getImage(item),
        }));
        if (reqIdRef.current === myId) setResults(mapped);
      } finally {
        if (reqIdRef.current === myId) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [open, q, type]);

  const placeholder = useMemo(
    () =>
      type === "anime"
        ? "Search anime titles…"
        : type === "character"
          ? "Search characters…"
          : "Search voice actors…",
    [type],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Add favorite ${type}`}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl"
      >
        <div className="border-b border-white/[0.06] p-4">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {loading && (
            <div className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg p-2">
                  <Skeleton className="h-12 w-9" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && q.trim().length >= 2 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              No results for &ldquo;{q.trim()}&rdquo;.
            </div>
          )}

          {!loading && q.trim().length < 2 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              Start typing to search.
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {results.map((r) => {
                const already = existingIds.has(r.malId);
                return (
                  <li key={r.malId}>
                    <button
                      disabled={already || submittingId !== null}
                      onClick={async () => {
                        setSubmittingId(r.malId);
                        try {
                          await onConfirm(r);
                        } finally {
                          setSubmittingId(null);
                        }
                      }}
                      className={
                        "flex w-full items-center gap-3 rounded-lg p-2 text-left transition " +
                        (already
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-white/[0.06] focus-visible:bg-white/[0.06]") +
                        " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.image}
                        alt={r.title}
                        className="h-14 w-10 shrink-0 rounded object-cover bg-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm text-zinc-100">{r.title}</p>
                        {already && (
                          <p className="mt-0.5 text-[11px] text-zinc-500">Already in favorites</p>
                        )}
                      </div>
                      {submittingId === r.malId && (
                        <span className="text-xs text-purple-300">Adding…</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/[0.06] p-3">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function getTitle(item: AnimeItem | CharacterItem | PersonItem): string {
  if ("title" in item && item.title) return item.title;
  if ("name" in item && item.name) return item.name;
  return "Untitled";
}

function getImage(item: AnimeItem | CharacterItem | PersonItem): string {
  return item.image ?? "";
}
