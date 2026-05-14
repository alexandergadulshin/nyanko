"use client";

/**
 * UserSearch — debounced live search input + result list. As the user
 * types, the query is fired ~300ms after they stop typing. Eliminates
 * the old "type and click Search" pattern.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { Skeleton } from "~/components/ui/skeleton";

export interface SearchUser {
  id: string;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
}

interface UserSearchProps {
  /** Returns the search results for a given query. */
  fetcher: (query: string) => Promise<SearchUser[]>;
  /** Called when the user clicks "Add friend" on a result. */
  onAddFriend: (userId: string) => void | Promise<void>;
  /** Set when an add-friend call is in flight for a user. */
  pendingUserId?: string | null;
}

const DEBOUNCE_MS = 300;
const MIN_LEN = 2;

export function UserSearch({ fetcher, onAddFriend, pendingUserId }: UserSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const reqIdRef = useRef(0);

  // Debounced effect. Each new query bumps a request id so a stale response
  // (slow network) can't overwrite a fresher result.
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_LEN) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const myId = ++reqIdRef.current;
    const t = setTimeout(async () => {
      try {
        const r = await fetcher(q);
        if (reqIdRef.current === myId) setResults(r);
      } finally {
        if (reqIdRef.current === myId) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, fetcher]);

  const hasQuery = query.trim().length >= MIN_LEN;
  const showEmpty = hasQuery && !loading && results.length === 0 && touched;

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTouched(true);
          }}
          placeholder="Search by name or username…"
          aria-label="Search users"
          className="w-full rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/10 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/[0.04]">
              <Skeleton rounded="full" className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((u) => (
            <li
              key={u.id}
              className="group flex items-center gap-3 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-3 hover:bg-white/[0.05] transition-colors"
            >
              <button
                onClick={() => router.push(`/profile/${u.id}`)}
                className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                aria-label={`View ${u.name}'s profile`}
              >
                <Avatar name={u.name} src={u.image} size="md" hoverable />
              </button>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => router.push(`/profile/${u.id}`)}
                  className="block max-w-full truncate text-left text-sm font-semibold text-zinc-50 hover:text-purple-300 focus-visible:outline-none focus-visible:underline"
                >
                  {u.name}
                </button>
                {u.username && (
                  <p className="truncate text-xs text-zinc-500">@{u.username}</p>
                )}
                {u.bio && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{u.bio}</p>
                )}
              </div>
              <Button
                size="sm"
                loading={pendingUserId === u.id}
                onClick={() => void onAddFriend(u.id)}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <EmptyState
          title="No users found"
          description={`Nothing matches “${query.trim()}”. Try a different name or username.`}
        />
      )}

      {!hasQuery && touched && (
        <EmptyState
          title="Keep typing…"
          description="Enter at least 2 characters to search."
        />
      )}
    </div>
  );
}
