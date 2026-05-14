"use client";

/**
 * Friends page — rebuilt UI.
 *
 * Layout: horizontal segmented tabs at the top (Friends / Requests / Find),
 * single-column content below. Skeletons during initial load, ARIA-aware
 * toast for errors, modal confirm for destructive actions.
 *
 * State management: a single `useEffect` hydrates friends + requests once.
 * Tab switching is local and never refetches; mutations refetch the
 * relevant slice and update locally.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { Tabs } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { Skeleton } from "~/components/ui/skeleton";
import { Toast } from "~/components/ui/toast";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";

import { FriendCard, type Friend } from "~/components/friends/friend-card";
import { RequestCard } from "~/components/friends/request-card";
import { UserSearch, type SearchUser } from "~/components/friends/user-search";

interface FriendRequest {
  id: string;
  fromUser?: { id: string; name: string; username?: string; image?: string };
  toUser?: { id: string; name: string; username?: string; image?: string };
  message?: string;
  createdAt: string;
}

type Tab = "friends" | "requests" | "search";

export default function FriendsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [removingLoading, setRemovingLoading] = useState(false);

  /* ----------------------------------------------------------- data fetch */

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/friends");
      if (!res.ok) throw new Error("Failed to load friends");
      const data = await res.json();
      setFriends(data.friends ?? []);
      setIncoming(data.incomingRequests ?? []);
      setOutgoing(data.outgoingRequests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load friends");
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    let alive = true;
    void (async () => {
      setLoading(true);
      await refresh();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [isLoaded, user, router, refresh]);

  /* ------------------------------------------------------------ mutations */

  const searchUsers = useCallback(async (q: string): Promise<SearchUser[]> => {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=20`);
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    return (data.users ?? []) as SearchUser[];
  }, []);

  const sendRequest = useCallback(
    async (toUserId: string) => {
      setPendingUser(toUserId);
      try {
        const res = await fetch("/api/friends/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toUserId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Couldn't send request");
        }
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't send request");
      } finally {
        setPendingUser(null);
      }
    },
    [refresh],
  );

  const respond = useCallback(
    async (requestId: string, action: "accept" | "decline") => {
      setPendingRequest(requestId);
      // Optimistic: remove from incoming immediately; refresh confirms.
      const prev = incoming;
      setIncoming((rs) => rs.filter((r) => r.id !== requestId));
      try {
        const res = await fetch("/api/friends/requests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId, action }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Couldn't ${action} request`);
        }
        await refresh();
      } catch (e) {
        // Restore on failure.
        setIncoming(prev);
        setError(e instanceof Error ? e.message : `Couldn't ${action} request`);
      } finally {
        setPendingRequest(null);
      }
    },
    [incoming, refresh],
  );

  const cancelRequest = useCallback(
    async (requestId: string) => {
      setPendingRequest(requestId);
      const prev = outgoing;
      setOutgoing((rs) => rs.filter((r) => r.id !== requestId));
      try {
        const res = await fetch(`/api/friends/requests?requestId=${encodeURIComponent(requestId)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Couldn't cancel request");
        }
        await refresh();
      } catch (e) {
        setOutgoing(prev);
        setError(e instanceof Error ? e.message : "Couldn't cancel request");
      } finally {
        setPendingRequest(null);
      }
    },
    [outgoing, refresh],
  );

  const performRemove = useCallback(async () => {
    if (!removing) return;
    setRemovingLoading(true);
    const prev = friends;
    setFriends((fs) => fs.filter((f) => f.friendshipId !== removing.id));
    try {
      const res = await fetch(`/api/friends/${removing.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't remove friend");
      }
      await refresh();
      setRemoving(null);
    } catch (e) {
      setFriends(prev);
      setError(e instanceof Error ? e.message : "Couldn't remove friend");
    } finally {
      setRemovingLoading(false);
    }
  }, [friends, refresh, removing]);

  /* -------------------------------------------------------------- render */

  const tabItems = useMemo(
    () =>
      [
        { value: "friends" as const, label: "Friends", count: friends.length },
        { value: "requests" as const, label: "Requests", count: incoming.length, badge: incoming.length > 0 ? ("danger" as const) : undefined },
        { value: "search" as const, label: "Find people" },
      ] as const,
    [friends.length, incoming.length],
  );

  if (!isLoaded) {
    return <PageShell><FriendsSkeleton /></PageShell>;
  }
  if (!user) return null;

  return (
    <PageShell>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Friends</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Connect with other watchers. See their lists, recommend each other shows.
          </p>
        </div>
        <Tabs value={tab} onChange={setTab} items={tabItems} ariaLabel="Friends tabs" />
      </header>

      {loading ? (
        <FriendsSkeleton />
      ) : (
        <>
          {tab === "friends" && (
            friends.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3.5 19c.7-3 3-4.5 5.5-4.5s4.8 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                }
                title="No friends yet"
                description="Find people who share your taste in anime and connect."
                action={<Button onClick={() => setTab("search")}>Find people</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map((f) => (
                  <FriendCard
                    key={f.id}
                    friend={f}
                    onRemove={(friendshipId, name) => setRemoving({ id: friendshipId, name })}
                  />
                ))}
              </div>
            )
          )}

          {tab === "requests" && (
            <div className="space-y-8">
              <section>
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
                  Incoming ({incoming.length})
                </h2>
                {incoming.length === 0 ? (
                  <EmptyState title="No incoming requests" description="When someone wants to connect, you'll see it here." />
                ) : (
                  <div className="space-y-2">
                    {incoming.map((r) =>
                      r.fromUser ? (
                        <RequestCard
                          key={r.id}
                          id={r.id}
                          direction="incoming"
                          user={r.fromUser}
                          message={r.message}
                          createdAt={r.createdAt}
                          onAccept={(id) => respond(id, "accept")}
                          onDecline={(id) => respond(id, "decline")}
                          pendingId={pendingRequest}
                        />
                      ) : null,
                    )}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
                  Sent ({outgoing.length})
                </h2>
                {outgoing.length === 0 ? (
                  <EmptyState title="No outgoing requests" description="You haven't sent any pending requests." />
                ) : (
                  <div className="space-y-2">
                    {outgoing.map((r) =>
                      r.toUser ? (
                        <RequestCard
                          key={r.id}
                          id={r.id}
                          direction="outgoing"
                          user={r.toUser}
                          message={r.message}
                          createdAt={r.createdAt}
                          onCancel={cancelRequest}
                          pendingId={pendingRequest}
                        />
                      ) : null,
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "search" && (
            <UserSearch
              fetcher={searchUsers}
              onAddFriend={sendRequest}
              pendingUserId={pendingUser}
            />
          )}
        </>
      )}

      <Toast message={error} kind="error" onDismiss={() => setError(null)} />

      <ConfirmDialog
        open={!!removing}
        onCancel={() => setRemoving(null)}
        onConfirm={performRemove}
        title={removing ? `Remove ${removing.name}?` : "Remove friend?"}
        description="They'll need to send a new request to reconnect."
        confirmLabel="Remove"
        destructive
        loading={removingLoading}
      />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0F0E16]">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">{children}</div>
    </main>
  );
}

function FriendsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-4">
          <div className="flex items-start gap-3">
            <Skeleton rounded="full" className="h-14 w-14" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
