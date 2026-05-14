"use client";

/**
 * ProfileStats — visual breakdown of a user's anime list.
 *
 * Top row: 4 key metrics (Total, Episodes, Days watched, Mean score).
 * Below: a segmented horizontal bar showing watch-time contribution per
 * status (completed/watching/paused/dropped/planning), color-coded with
 * a legend underneath.
 *
 * The status colors are intentionally muted so the bar reads as data, not
 * decoration.
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
  color: string;
  text: string;
}> = [
  { key: "completed", label: "Completed", color: "bg-emerald-500/80", text: "text-emerald-300" },
  { key: "watching", label: "Watching", color: "bg-sky-500/80", text: "text-sky-300" },
  { key: "paused", label: "Paused", color: "bg-amber-500/80", text: "text-amber-300" },
  { key: "dropped", label: "Dropped", color: "bg-rose-500/80", text: "text-rose-300" },
  { key: "planning", label: "Plan to watch", color: "bg-zinc-500/80", text: "text-zinc-300" },
];

interface ProfileStatsProps {
  stats: ProfileStatsInput;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const segments = useMemo(() => {
    const total = stats.totalAnime || 1; // avoid /0
    return STATUS_META.map((m) => ({
      ...m,
      value: stats.byStatus[m.key],
      pct: (stats.byStatus[m.key] / total) * 100,
    }));
  }, [stats]);

  return (
    <section
      id="statistics"
      className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 sm:p-8"
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
        Statistics
      </h2>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Total" value={stats.totalAnime.toLocaleString()} />
        <Metric label="Episodes" value={stats.totalEpisodes.toLocaleString()} />
        <Metric label="Days watched" value={stats.totalDays.toFixed(1)} />
        <Metric
          label="Mean score"
          value={stats.averageScore !== null ? stats.averageScore.toFixed(2) : "—"}
          accent={stats.averageScore !== null}
        />
      </dl>

      {/* Bar */}
      <div className="mt-6">
        <div
          role="img"
          aria-label="Distribution of anime by status"
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.04]"
        >
          {segments.map((s) =>
            s.value > 0 ? (
              <div
                key={s.key}
                className={`h-full ${s.color}`}
                style={{ width: `${s.pct}%` }}
                title={`${s.label}: ${s.value}`}
              />
            ) : null,
          )}
        </div>

        {/* Legend */}
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${s.color}`} aria-hidden="true" />
              <span className="text-zinc-400">{s.label}</span>
              <span className={`font-semibold ${s.text}`}>{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd
        className={`mt-1 font-mono text-2xl font-semibold tracking-tight ${accent ? "text-amber-300" : "text-zinc-50"}`}
      >
        {value}
      </dd>
    </div>
  );
}
