"use client";

/**
 * FriendCard — single row in the friends grid. Clicking the body
 * navigates to the profile; the remove button is a sibling action
 * that stops propagation.
 */

import { useRouter } from "next/navigation";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

export interface Friend {
  id: string;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
  friendshipId: string;
  friendSince: string;
}

interface FriendCardProps {
  friend: Friend;
  onRemove: (friendshipId: string, name: string) => void;
}

export function FriendCard({ friend, onRemove }: FriendCardProps) {
  const router = useRouter();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/profile/${friend.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/profile/${friend.id}`);
        }
      }}
      className="group cursor-pointer rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-4 transition-all hover:bg-white/[0.05] hover:ring-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
    >
      <div className="flex items-start gap-3">
        <Avatar name={friend.name} src={friend.image} size="lg" hoverable />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-zinc-50">{friend.name}</h3>
          {friend.username && (
            <p className="truncate text-sm text-zinc-400">@{friend.username}</p>
          )}
          {friend.bio && (
            <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">{friend.bio}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="text-xs text-zinc-500">
          Friends since {new Date(friend.friendSince).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(friend.friendshipId, friend.name);
          }}
          className="text-zinc-400 hover:text-rose-400"
          aria-label={`Remove ${friend.name} from friends`}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
