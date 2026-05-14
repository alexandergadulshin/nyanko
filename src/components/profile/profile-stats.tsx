"use client";

/**
 * ProfileStats — Apple-style "watch breakdown" card. The hero card
 * already shows the headline numbers; this section drills into the
 * status composition with a polished horizontal segmented bar.
 *
 * One rounded-3xl card. Inside: section label, segmented bar with
 * smooth color-band transitions, legend grid.
 */

import { useMemo } from "react";

export interface ProfileStatsInput {
  totalAnime: number;
  totalEpisodes: number;
  totalDays: number;
  averageScore: number | null;
  byStatus: {
    completed: number;
    watching: number;
    paused: number;
    dropped: number;
    planning: number;
  };
}

const STATUS_META: ReadonlyArray<{
  key: keyof ProfileStatsInput["byStatus"];
  label: string;
  bar: string;
  text: string;
  dot: string;
}> = [
  { key: "completed", label: "Completed", bar: "bg-emerald-400", text: "text-emerald-200", dot: "bg-emerald-400" },
  { key: "watching",  label: "Watching",  bar: "bg-sky-400",     text: "text-sky-200",     dot: "bg-sky-400" },
  { key: "paused",    label: "Paused",    bar: "bg-amber-400",   text: "text-amber-200",   dot: "bg-amber-400" },
  { key: "dropped",   label: "Dropped",   bar: "bg-rose-400",    text: "text-rose-200",    dot: "bg-rose-400" },
  { key: "planning",  label: "Planning",  bar: "bg-zinc-400",    text: "text-zinc-200",    dot: "bg-zinc-400" },
];

interface ProfileStatsProps {
  stats: ProfileStatsInput;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const segments = useMemo(() => {
    const total = stats.totalAnime || 1;
    return STATUS_META.map((m) => ({
      ...m,
      value: stats.byStatus[m.key],
      pct: (stats.byStatus[m.key] / total) * 100,
    }));
  }, [stats]);

  return (
    <section id="statistics">
      <SectionCard>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-white">List composition</h2>
          <p className="text-xs text-zinc-400">{stats.totalAnime} total</p>
        </div>

        <div
          role="img"
          aria-label="Distribution of anime by status"
          className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-white/[0.05]"
        >
          {segments.map((s) =>
            s.value > 0 ? (
              <div
                key={s.key}
                className={`h-full ${s.bar} transition-[width] duration-700`}
                style={{ width: `${s.pct}%` }}
                title={`${s.label}: ${s.value}`}
              />
            ) : null,
          )}
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
          {segments.map((s) => (
            <li key={s.key}>
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
                <span className="text-xs uppercase tracking-wider text-zinc-400">{s.label}</span>
              </div>
              <p className={`mt-1 font-mono text-xl font-semibold tabular-nums ${s.text}`}>
                {s.value}
              </p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </section>
  );
}

export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] bg-white/[0.03] ring-1 ring-white/[0.06] backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] p-6 sm:p-8">
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold tracking-tight text-white">{children}</h2>
  );
}
