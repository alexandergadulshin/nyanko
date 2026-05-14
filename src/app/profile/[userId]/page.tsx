"use client";

/**
 * Profile page — rebuilt UI.
 *
 * Composition only: data fetching here, presentation in /components/profile.
 * Parallelises the 3 startup requests (profile, favorites, friendship
 * status) so the page hydrates as fast as the slowest one rather than the
 * sum.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { Toast } from "~/components/ui/toast";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Button } from "~/components/ui/button";

import {
  ProfileHero,
  type FriendshipStatus,
  type ProfileSummary,
} from "~/components/profile/profile-hero";
import { ProfileStats } from "~/components/profile/profile-stats";
import {
  ProfileFavorites,
  type FavoriteItem,
  type FavoriteType,
} from "~/components/profile/profile-favorites";
import {
  ProfileActivity,
  type ActivityEntry,
} from "~/components/profile/profile-activity";
import { ProfileSkeleton } from "~/components/profile/profile-skeleton";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = React.use(params);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [animeList, setAnimeList] = useState<ActivityEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [friendship, setFriendship] = useState<FriendshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  // Modal state for destructive friend removal.
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Ownership is derived once we've fetched the profile and have its
  // canonical Clerk ID. Computing from the URL param alone breaks when the
  // URL contains a username instead of a Clerk ID.
  const isOwn = !!profile && !!user && user.id === profile.id;

  /* --------------------------------------------------------------- fetch */

  const refresh = useCallback(async () => {
    setError(null);
    try {
      // 1. Profile (the URL param may be either a Clerk ID or a username;
      // the API resolves both). We need this first because the favorites /
      // friend-status calls depend on the resolved profile.id.
      const pRes = await fetch(`/api/profile/${userId}`);
      if (!pRes.ok) throw new Error(`Profile fetch failed (${pRes.status})`);
      const pData = (await pRes.json()) as {
        profile: ProfileSummary;
        animeList: ActivityEntry[];
      };

      setProfile(pData.profile);
      setAnimeList(pData.animeList ?? []);

      // 2. Canonicalise the URL: prefer /profile/<username> over the raw
      // Clerk ID. Replace (not push) so the back button isn't polluted.
      if (pData.profile.username && pData.profile.username !== userId) {
        router.replace(`/profile/${pData.profile.username}`);
        // The effect re-fires under the new userId; bail to avoid a
        // duplicate fetch.
        return;
      }

      // 3. Ownership-dependent companions, using the canonical Clerk ID.
      const ownProfile = !!user && user.id === pData.profile.id;
      const [fData, fsData] = await Promise.all([
        ownProfile
          ? fetch("/api/favorites").then((r) => (r.ok ? r.json() : { favorites: [] }))
          : Promise.resolve({ favorites: [] }),
        !ownProfile && user
          ? fetch(`/api/friends/status/${pData.profile.id}`).then((r) =>
              r.ok ? r.json() : null,
            )
          : Promise.resolve(null),
      ]);

      setFavorites(fData.favorites ?? []);
      setFriendship(fsData ?? null);

      // Force onboarding when own profile lacks required fields.
      if (ownProfile && (!pData.profile?.username || !pData.profile?.name)) {
        router.push("/onboarding");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load profile");
    }
  }, [userId, user, router]);

  useEffect(() => {
    if (!isLoaded) return;
    let alive = true;
    void (async () => {
      setLoading(true);
      await refresh();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [isLoaded, userId, refresh]);

  /* --------------------------------------------------- derived statistics */

  const stats = useMemo(() => {
    const by = { completed: 0, watching: 0, paused: 0, dropped: 0, planning: 0 };
    let episodes = 0;
    let scored = 0;
    let scoreSum = 0;
    for (const a of animeList) {
      if (a.status in by) by[a.status as keyof typeof by]++;
      episodes += a.episodesWatched;
      if (a.score) {
        scored++;
        scoreSum += a.score;
      }
    }
    const totalMinutes = episodes * 24; // standard episode estimate
    return {
      totalAnime: animeList.length,
      totalEpisodes: episodes,
      totalDays: Math.round((totalMinutes / 60 / 24) * 10) / 10,
      averageScore: scored > 0 ? scoreSum / scored : null,
      byStatus: by,
    };
  }, [animeList]);

  /* --------------------------------------------------------- favorites */

  const addFavorite = useCallback(
    async (type: FavoriteType, item: { malId: number; title: string; image: string }) => {
      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            itemId: item.malId,
            itemTitle: item.title,
            itemImage: item.image,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Couldn't add favorite");
        }
        const fres = await fetch("/api/favorites");
        if (fres.ok) {
          const data = await fres.json();
          setFavorites(data.favorites ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't add favorite");
      }
    },
    [],
  );

  const removeFavorite = useCallback(async (type: FavoriteType, itemId: number) => {
    const prev = favorites;
    setFavorites((f) => f.filter((x) => !(x.type === type && x.itemId === itemId)));
    try {
      const res = await fetch(`/api/favorites?type=${type}&itemId=${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Couldn't remove favorite");
    } catch (e) {
      setFavorites(prev);
      setError(e instanceof Error ? e.message : "Couldn't remove favorite");
    }
  }, [favorites]);

  /* --------------------------------------------------------- friendship */

  const refreshFriendship = useCallback(async () => {
    if (isOwn || !user || !profile) return;
    const res = await fetch(`/api/friends/status/${profile.id}`);
    if (res.ok) setFriendship(await res.json());
  }, [isOwn, user, profile]);

  const sendRequest = useCallback(async () => {
    if (!profile) return;
    setFriendActionLoading(true);
    try {
      const res = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: profile.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't send request");
      }
      await refreshFriendship();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send request");
    } finally {
      setFriendActionLoading(false);
    }
  }, [profile, refreshFriendship]);

  const respond = useCallback(
    async (action: "accept" | "decline") => {
      if (!friendship?.requestId) return;
      setFriendActionLoading(true);
      try {
        const res = await fetch("/api/friends/requests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: friendship.requestId, action }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Couldn't ${action} request`);
        }
        await refreshFriendship();
      } catch (e) {
        setError(e instanceof Error ? e.message : `Couldn't ${action} request`);
      } finally {
        setFriendActionLoading(false);
      }
    },
    [friendship, refreshFriendship],
  );

  const cancelRequest = useCallback(async () => {
    if (!friendship?.requestId) return;
    setFriendActionLoading(true);
    try {
      const res = await fetch(
        `/api/friends/requests?requestId=${encodeURIComponent(friendship.requestId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Couldn't cancel request");
      await refreshFriendship();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't cancel request");
    } finally {
      setFriendActionLoading(false);
    }
  }, [friendship, refreshFriendship]);

  const removeFriend = useCallback(async () => {
    if (!friendship?.friendshipId) return;
    setFriendActionLoading(true);
    try {
      const res = await fetch(`/api/friends/${friendship.friendshipId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't remove friend");
      await refreshFriendship();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove friend");
    } finally {
      setFriendActionLoading(false);
      setConfirmRemove(false);
    }
  }, [friendship, refreshFriendship]);

  /* ------------------------------------------------------------ render */

  if (!isLoaded || loading) {
    return (
      <Shell>
        <ProfileSkeleton />
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <SignedOut />
      </Shell>
    );
  }

  if (error && !profile) {
    return (
      <Shell>
        <NotFound message={error} />
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <NotFound message="Profile not found" />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-8">
        <ProfileHero
          profile={profile}
          stats={{
            totalAnime: stats.totalAnime,
            totalEpisodes: stats.totalEpisodes,
            totalDays: stats.totalDays,
            averageScore: stats.averageScore,
          }}
          isOwn={!!isOwn}
          friendship={friendship}
          pendingFriendAction={friendActionLoading}
          onSendRequest={sendRequest}
          onCancelRequest={cancelRequest}
          onAcceptRequest={() => respond("accept")}
          onDeclineRequest={() => respond("decline")}
          onRemoveFriend={() => setConfirmRemove(true)}
          onEditProfile={() => router.push("/settings")}
        />

        <ProfileStats stats={stats} />

        {(favorites.length > 0 || isOwn) && (
          <ProfileFavorites
            favorites={favorites}
            isOwn={!!isOwn}
            onAdd={addFavorite}
            onRemove={removeFavorite}
          />
        )}

        <ProfileActivity list={animeList} />
      </div>

      <Toast message={error} kind="error" onDismiss={() => setError(null)} />

      <ConfirmDialog
        open={confirmRemove}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={removeFriend}
        title={`Remove ${profile.name} from friends?`}
        description="They'll need to send a new request to reconnect."
        confirmLabel="Remove"
        destructive
        loading={friendActionLoading}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  // Slightly deeper background than the rest of the app so the gradient
  // banner in the header reads with more pop. Avatar ring uses the same
  // value so it visually anchors to the page.
  return (
    <main className="min-h-screen bg-[#0A0917]">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-24 sm:px-6">{children}</div>
    </main>
  );
}

function SignedOut() {
  const router = useRouter();
  return (
    <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-10 text-center">
      <h2 className="text-lg font-semibold text-zinc-50">Sign in to view profiles</h2>
      <p className="mt-2 text-sm text-zinc-400">
        You need an account to see anyone's profile or your own.
      </p>
      <div className="mt-6">
        <Button onClick={() => router.push("/auth")}>Sign in</Button>
      </div>
    </div>
  );
}

function NotFound({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-10 text-center">
      <h2 className="text-lg font-semibold text-zinc-50">{message}</h2>
      <div className="mt-6">
        <Button variant="secondary" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    </div>
  );
}
