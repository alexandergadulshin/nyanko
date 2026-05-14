"use client";

import { ToggleRow } from "./settings-toggle-row";

export type ProfileVisibility = "public" | "friends" | "private";

export interface PrivacyFormValues {
  profileVisibility: ProfileVisibility;
  showWatchList: boolean;
  showFavorites: boolean;
  showStats: boolean;
  allowFriendRequests: boolean;
}

interface Props {
  values: PrivacyFormValues;
  onChange: <K extends keyof PrivacyFormValues>(
    key: K,
    value: PrivacyFormValues[K],
  ) => void;
}

const VIS: ReadonlyArray<{
  value: ProfileVisibility;
  label: string;
  description: string;
  glyph: string;
}> = [
  { value: "public",  label: "Public",  description: "Anyone can view your profile.", glyph: "🌐" },
  { value: "friends", label: "Friends", description: "Only friends can view it.",     glyph: "👥" },
  { value: "private", label: "Private", description: "Only you can view it.",         glyph: "🔒" },
];

export function PrivacySection({ values, onChange }: Props) {
  return (
    <>
      <div role="radiogroup" aria-label="Profile visibility" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {VIS.map((o) => {
          const active = values.profileVisibility === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange("profileVisibility", o.value)}
              className={
                "group relative overflow-hidden rounded-3xl p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 " +
                (active
                  ? "bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent ring-1 ring-inset ring-purple-400/40 shadow-[0_10px_30px_-15px_rgba(168,85,247,0.55)]"
                  : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.06]")
              }
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl" aria-hidden="true">{o.glyph}</span>
                <Check active={active} />
              </div>
              <p className={"mt-4 text-base font-semibold " + (active ? "text-white" : "text-zinc-100")}>
                {o.label}
              </p>
              <p className="mt-1 text-xs leading-snug text-zinc-400">{o.description}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5 pt-2">
        <ToggleRow
          label="Show watch list"
          description="Let others see the anime you're tracking."
          checked={values.showWatchList}
          onChange={(v) => onChange("showWatchList", v)}
        />
        <ToggleRow
          label="Show favorites"
          description="Let others see your favorite anime, characters, and voice actors."
          checked={values.showFavorites}
          onChange={(v) => onChange("showFavorites", v)}
        />
        <ToggleRow
          label="Show stats"
          description="Let others see your viewing statistics and watch breakdown."
          checked={values.showStats}
          onChange={(v) => onChange("showStats", v)}
        />
        <ToggleRow
          label="Allow friend requests"
          description="When off, no one can send you a new friend request."
          checked={values.allowFriendRequests}
          onChange={(v) => onChange("allowFriendRequests", v)}
        />
      </div>
    </>
  );
}

function Check({ active }: { active: boolean }) {
  return active ? (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white shadow-[0_4px_10px_-4px_rgba(168,85,247,0.7)]">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          d="M5 12l5 5L20 7"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : (
    <span aria-hidden="true" className="h-6 w-6 rounded-full ring-1 ring-inset ring-white/15" />
  );
}
