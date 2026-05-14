"use client";

/**
 * ProfileActivity — recent updates to the user's anime list, newest first.
 * Renders the latest N entries with their poster, title, status pill, and
 * "updated" timestamp.
 */

import { useMemo } from "react";
import { useRouter } from "next/navigation";

export interface ActivityEntry {
  id: string;
  animeId: number;
  animeTitle: string;
  animeImage?: string;
  status: "planning" | "watching" | "completed" | "dropped" | "paused";
  score?: number | null;
  episodesWatched: number;
  totalEpisodes?: number | null;
  updatedAt: string;
}

const STATUS_PILL: Record<ActivityEntry["status"], string> = {
  completed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  watching: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  paused: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  dropped: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  planning: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
};

const STATUS_LABEL: Record<ActivityEntry["status"], string> = {
  completed: "Completed",
  watching: "Watching",
  paused: "Paused",
  dropped: "Dropped",
  planning: "Planning",
};

interface ProfileActivityProps {
  list: ActivityEntry[];
  limit?: number;
}

export function ProfileActivity({ list, limit = 8 }: ProfileActivityProps) {
  const router = useRouter();
  const items = useMemo(
    () =>
      [...list]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, limit),
    [list, limit],
  );

  return (
    <section
      id="recent-activity"
      className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 sm:p-8"
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Recent activity
        </h2>
        {list.length > limit && (
          <button
            onClick={() => router.push("/anime-list")}
            className="text-xs text-purple-300 hover:text-purple-200 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            View full list →
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {items.map((e) => (
            <li
              key={e.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/anime/${e.animeId}`)}
              onKeyDown={(k) => {
                if (k.key === "Enter" || k.key === " ") {
                  k.preventDefault();
                  router.push(`/anime/${e.animeId}`);
                }
              }}
              className="flex cursor-pointer items-center gap-3 py-3 transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-lg -mx-2 px-2"
            >
              {e.animeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.animeImage}
                  alt={e.animeTitle}
                  className="h-14 w-10 shrink-0 rounded object-cover bg-zinc-800"
                />
              ) : (
                <div className="h-14 w-10 shrink-0 rounded bg-zinc-800" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{e.animeTitle}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Ep {e.episodesWatched}
                  {e.totalEpisodes ? ` / ${e.totalEpisodes}` : ""}
                  {e.score ? ` · ${e.score}/10` : ""}
                  {" · "}
                  {timeAgo(e.updatedAt)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STATUS_PILL[e.status]}`}
              >
                {STATUS_LABEL[e.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - +new Date(iso);
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
