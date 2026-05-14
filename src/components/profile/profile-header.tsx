"use client";

/**
 * ProfileHeader — top section of the profile page: avatar, name, handle,
 * bio, and the friendship action button (or "edit profile" on own page).
 *
 * Friendship state machine:
 *   none           → "Add friend"        (sendRequest)
 *   request_sent   → "Request sent"      (cancelRequest, secondary)
 *   request_recv   → "Accept"/"Decline"  (respond)
 *   friends        → "Friends"           (removeFriend, secondary)
 *   not_accepting  → disabled badge
 */

import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

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

interface ProfileHeaderProps {
  profile: ProfileSummary;
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

export function ProfileHeader({
  profile,
  isOwn,
  friendship,
  pendingFriendAction = false,
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onEditProfile,
}: ProfileHeaderProps) {
  const joined = new Date(profile.createdAt);
  const joinedLabel = joined.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <section className="overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
      {/* Subtle decorative band so the header has visual weight without a heavy banner image */}
      <div
        aria-hidden="true"
        className="h-20 bg-gradient-to-r from-purple-600/20 via-fuchsia-500/10 to-transparent"
      />
      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="-mt-12">
            <Avatar
              name={profile.name}
              src={profile.image}
              size="2xl"
              className="ring-4 ring-[#0F0E16]"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              {profile.name}
            </h1>
            {profile.username && (
              <p className="mt-0.5 text-sm text-zinc-400">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
                {profile.bio}
              </p>
            )}
            <p className="mt-3 text-xs text-zinc-500">Joined {joinedLabel}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isOwn ? (
              <Button variant="secondary" onClick={onEditProfile}>
                Edit profile
              </Button>
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
      </div>
    </section>
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
        <Button variant="secondary" loading={pending} onClick={onRemove}>
          Friends · Remove
        </Button>
      );
    case "request_sent":
      return (
        <Button variant="outline" loading={pending} onClick={onCancel}>
          Request sent · Cancel
        </Button>
      );
    case "request_received":
      return (
        <>
          <Button loading={pending} onClick={onAccept}>
            Accept
          </Button>
          <Button variant="ghost" disabled={pending} onClick={onDecline}>
            Decline
          </Button>
        </>
      );
    case "not_accepting":
      return (
        <Button variant="outline" disabled>
          Not accepting requests
        </Button>
      );
    case "none":
      return (
        <Button loading={pending} onClick={onSend} disabled={!friendship.canSendRequest}>
          Add friend
        </Button>
      );
    case "self":
    default:
      return null;
  }
}
