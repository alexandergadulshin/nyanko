"use client";

/**
 * ProfileActivity — Apple-style recent activity card with tinted status
 * chips and polished hover states. Rows are dense but generously padded;
 * hover lifts the row subtly with a soft bg.
 */

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "./profile-stats";

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

const STATUS_CHIP: Record<ActivityEntry["status"], string> = {
  completed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  watching: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  paused: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  dropped: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
  planning: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/25",
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

export function ProfileActivity({ list, limit = 6 }: ProfileActivityProps) {
  const router = useRouter();
  const items = useMemo(
    () =>
      [...list]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, limit),
    [list, limit],
  );

  return (
    <section id="recent-activity">
      <SectionCard>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-white">Recent activity</h2>
          {list.length > limit && (
            <button
              onClick={() => router.push("/anime-list")}
              className="text-xs font-medium text-purple-300 transition-colors hover:text-purple-200 focus-visible:outline-none focus-visible:underline"
            >
              View full list →
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-400">No activity yet.</p>
        ) : (
          <ul className="mt-5 space-y-1">
            {items.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => router.push(`/anime/${e.animeId}`)}
                  className="group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-all hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
                >
                  {e.animeImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.animeImage}
                      alt=""
                      className="h-14 w-10 shrink-0 rounded-lg object-cover bg-zinc-800 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.6)]"
                    />
                  ) : (
                    <div className="h-14 w-10 shrink-0 rounded-lg bg-zinc-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white group-hover:text-purple-200 transition-colors">
                      {e.animeTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Ep {e.episodesWatched}
                      {e.totalEpisodes ? ` / ${e.totalEpisodes}` : ""}
                      {e.score ? <> · <span className="text-amber-300 font-mono">{e.score}</span></> : null}
                      <span> · {timeAgo(e.updatedAt)}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${STATUS_CHIP[e.status]}`}
                  >
                    {STATUS_LABEL[e.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
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
