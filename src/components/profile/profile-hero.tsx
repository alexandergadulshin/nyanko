"use client";

/**
 * ProfileHero — Apple-style floating glass card over a vibrant gradient
 * backdrop. The hero is the page's center of gravity: a single rounded-3xl
 * surface that holds the identity (avatar + name + handle + bio) plus the
 * primary action and a quick-glance stats row.
 *
 * Design notes:
 *  - The backdrop is a tall, soft radial-gradient (purple → magenta → blue)
 *    fading to the page background. Inspired by Apple TV+ and Apple Music
 *    cover-blur treatments.
 *  - The card uses subtle glass (backdrop-blur-xl + low-opacity white fill)
 *    on top of the gradient, so the colors bleed through.
 *  - All corner radii are 24px or 32px; nothing has a "Tailwind default"
 *    rounded-lg look.
 *  - Buttons are pill-shaped (rounded-full).
 */

import { Avatar } from "~/components/ui/avatar";

export type FriendshipState =
  | "self"
  | "friends"
  | "request_sent"
  | "request_received"
  | "not_accepting"
  | "none";

export interface FriendshipStatus {
  status: FriendshipState;
  friendshipId?: string;
  requestId?: string;
  canSendRequest?: boolean;
  message?: string;
}

export interface ProfileSummary {
  id: string;
  name: string;
  username?: string;
  bio?: string;
  image?: string;
  createdAt: string;
}

export interface HeroStats {
  totalAnime: number;
  totalEpisodes: number;
  totalDays: number;
  averageScore: number | null;
}

interface ProfileHeroProps {
  profile: ProfileSummary;
  stats: HeroStats;
  isOwn: boolean;
  friendship?: FriendshipStatus | null;
  pendingFriendAction?: boolean;
  onSendRequest?: () => void;
  onCancelRequest?: () => void;
  onAcceptRequest?: () => void;
  onDeclineRequest?: () => void;
  onRemoveFriend?: () => void;
  onEditProfile?: () => void;
}

export function ProfileHero({
  profile,
  stats,
  isOwn,
  friendship,
  pendingFriendAction = false,
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onEditProfile,
}: ProfileHeroProps) {
  const joined = new Date(profile.createdAt);
  const joinedLabel = joined.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="relative">
      {/* Vibrant backdrop — bleeds behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(80%_100%_at_50%_0%,rgba(168,85,247,0.45)_0%,rgba(236,72,153,0.22)_30%,rgba(59,130,246,0.10)_55%,transparent_80%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_15%,rgba(236,72,153,0.18)_0%,transparent_60%)]" />
      </div>

      {/* Floating glass card */}
      <div className="relative overflow-hidden rounded-[32px] bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-xl shadow-[0_24px_60px_-15px_rgba(168,85,247,0.35),0_8px_24px_-6px_rgba(0,0,0,0.6)]">
        {/* Card-internal soft highlight */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
            <Avatar
              name={profile.name}
              src={profile.image}
              size="2xl"
              className="ring-[3px] ring-white/15 shadow-[0_18px_36px_-12px_rgba(0,0,0,0.7)]"
            />

            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {profile.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-300">
                {profile.username && (
                  <span className="font-medium text-zinc-200">@{profile.username}</span>
                )}
                {profile.username && <span aria-hidden="true">·</span>}
                <span>Joined {joinedLabel}</span>
              </div>
              {profile.bio && (
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-200">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {isOwn ? (
                <PillButton variant="soft" onClick={onEditProfile}>
                  Edit profile
                </PillButton>
              ) : (
                <FriendshipActions
                  friendship={friendship}
                  pending={pendingFriendAction}
                  onSend={onSendRequest}
                  onCancel={onCancelRequest}
                  onAccept={onAcceptRequest}
                  onDecline={onDeclineRequest}
                  onRemove={onRemoveFriend}
                />
              )}
            </div>
          </div>

          {/* Stats strip inside the same hero card */}
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <HeroStat label="Anime" value={fmtCount(stats.totalAnime)} />
            <HeroStat label="Episodes" value={fmtCount(stats.totalEpisodes)} />
            <HeroStat label="Days watched" value={stats.totalDays.toFixed(1)} />
            <HeroStat
              label="Mean score"
              value={stats.averageScore !== null ? stats.averageScore.toFixed(2) : "—"}
              accent={stats.averageScore !== null}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] px-4 py-3 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wider text-zinc-400">{label}</p>
      <p
        className={
          "mt-1 font-mono text-2xl font-semibold tracking-tight tabular-nums " +
          (accent ? "text-amber-200" : "text-white")
        }
      >
        {value}
      </p>
    </div>
  );
}

function PillButton({
  children,
  variant = "primary",
  loading = false,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "soft" | "outline" | "danger";
  loading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium " +
    "transition-all duration-200 active:scale-[0.97] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 " +
    "disabled:opacity-50 disabled:pointer-events-none";
  const tone = {
    primary:
      "bg-white text-zinc-900 shadow-lg shadow-black/30 hover:bg-zinc-100",
    soft:
      "bg-white/10 text-white ring-1 ring-inset ring-white/15 backdrop-blur-sm hover:bg-white/15",
    outline:
      "bg-transparent text-white ring-1 ring-inset ring-white/20 hover:bg-white/[0.06]",
    danger:
      "bg-rose-500/90 text-white shadow-lg shadow-rose-900/40 hover:bg-rose-500",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${tone}`}
    >
      {loading && (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

function FriendshipActions({
  friendship,
  pending,
  onSend,
  onCancel,
  onAccept,
  onDecline,
  onRemove,
}: {
  friendship: FriendshipStatus | null | undefined;
  pending: boolean;
  onSend?: () => void;
  onCancel?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onRemove?: () => void;
}) {
  if (!friendship) return null;
  switch (friendship.status) {
    case "friends":
      return (
        <PillButton variant="soft" loading={pending} onClick={onRemove}>
          ✓ Friends · Remove
        </PillButton>
      );
    case "request_sent":
      return (
        <PillButton variant="outline" loading={pending} onClick={onCancel}>
          Request sent · Cancel
        </PillButton>
      );
    case "request_received":
      return (
        <>
          <PillButton variant="primary" loading={pending} onClick={onAccept}>
            Accept
          </PillButton>
          <PillButton variant="outline" disabled={pending} onClick={onDecline}>
            Decline
          </PillButton>
        </>
      );
    case "not_accepting":
      return (
        <PillButton variant="outline" disabled>
          Not accepting requests
        </PillButton>
      );
    case "none":
      return (
        <PillButton variant="primary" loading={pending} onClick={onSend} disabled={!friendship.canSendRequest}>
          Add friend
        </PillButton>
      );
    case "self":
    default:
      return null;
  }
}

function fmtCount(n: number): string {
  if (n >= 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}
