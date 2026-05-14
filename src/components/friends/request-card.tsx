"use client";

/**
 * RequestCard — single row in the friend-requests list. Renders two modes:
 *   - incoming: shows Accept + Decline
 *   - outgoing: shows Cancel
 */

import { useRouter } from "next/navigation";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

export interface RequestUser {
  id: string;
  name: string;
  username?: string;
  image?: string;
}

interface RequestCardProps {
  id: string;
  direction: "incoming" | "outgoing";
  user: RequestUser;
  message?: string;
  createdAt: string;
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  /** When this id matches, show a spinner on the primary action. */
  pendingId?: string | null;
}

export function RequestCard({
  id,
  direction,
  user,
  message,
  createdAt,
  onAccept,
  onDecline,
  onCancel,
  pendingId,
}: RequestCardProps) {
  const router = useRouter();
  const isPending = pendingId === id;
  const verb = direction === "incoming" ? "sent" : "Sent";

  return (
    <div className="flex items-center gap-4 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors">
      <button
        onClick={() => router.push(`/profile/${user.id}`)}
        className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        aria-label={`View ${user.name}'s profile`}
      >
        <Avatar name={user.name} src={user.image} size="md" hoverable />
      </button>

      <div className="min-w-0 flex-1">
        <button
          onClick={() => router.push(`/profile/${user.id}`)}
          className="block max-w-full truncate text-left text-sm font-semibold text-zinc-50 hover:text-purple-300 focus-visible:outline-none focus-visible:underline"
        >
          {user.name}
        </button>
        {user.username && (
          <p className="truncate text-xs text-zinc-500">@{user.username}</p>
        )}
        {message && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">&ldquo;{message}&rdquo;</p>
        )}
        <p className="mt-1 text-[11px] text-zinc-600">
          {verb} {new Date(createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {direction === "incoming" && (
          <>
            <Button
              size="sm"
              loading={isPending}
              onClick={() => onAccept?.(id)}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => onDecline?.(id)}
            >
              Decline
            </Button>
          </>
        )}
        {direction === "outgoing" && (
          <Button
            size="sm"
            variant="outline"
            loading={isPending}
            onClick={() => onCancel?.(id)}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
