"use client";

/**
 * ProfileFavorites — three rows of favorites (anime / characters / people).
 * Each row caps at 5 items. Owner gets "Add" tiles in empty slots and a
 * remove button on hover.
 *
 * Add-favorite uses the AddFavoriteModal exported below.
 */

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { AddFavoriteModal } from "./add-favorite-modal";

export type FavoriteType = "anime" | "character" | "person";

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  itemId: number;
  itemTitle: string;
  itemImage?: string;
}

interface ProfileFavoritesProps {
  favorites: FavoriteItem[];
  isOwn: boolean;
  onAdd: (
    type: FavoriteType,
    item: { malId: number; title: string; image: string },
  ) => Promise<void> | void;
  onRemove: (type: FavoriteType, itemId: number) => Promise<void> | void;
}

const ROW_META: ReadonlyArray<{ type: FavoriteType; title: string }> = [
  { type: "anime", title: "Favorite anime" },
  { type: "character", title: "Favorite characters" },
  { type: "person", title: "Favorite voice actors" },
];

const MAX_PER_TYPE = 5;

export function ProfileFavorites({
  favorites,
  isOwn,
  onAdd,
  onRemove,
}: ProfileFavoritesProps) {
  const [adding, setAdding] = useState<FavoriteType | null>(null);

  const byType: Record<FavoriteType, FavoriteItem[]> = {
    anime: favorites.filter((f) => f.type === "anime"),
    character: favorites.filter((f) => f.type === "character"),
    person: favorites.filter((f) => f.type === "person"),
  };

  const total = favorites.length;

  return (
    <section id="favorites" className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 sm:p-8">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Favorites
        </h2>
        {total > 0 && (
          <span className="text-xs text-zinc-500">{total} total · {MAX_PER_TYPE} max per category</span>
        )}
      </header>

      {total === 0 && !isOwn ? (
        <EmptyState title="No favorites yet" description="When this user adds favorites they'll show up here." />
      ) : (
        <div className="space-y-6">
          {ROW_META.map((row) => (
            <div key={row.type}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-200">{row.title}</h3>
                {isOwn && byType[row.type].length < MAX_PER_TYPE && (
                  <Button size="sm" variant="ghost" onClick={() => setAdding(row.type)}>
                    + Add
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {byType[row.type].map((fav) => (
                  <FavoriteTile
                    key={fav.id}
                    fav={fav}
                    isOwn={isOwn}
                    onRemove={() => onRemove(fav.type, fav.itemId)}
                  />
                ))}
                {byType[row.type].length === 0 && !isOwn && (
                  <p className="col-span-full text-xs text-zinc-500">No {row.title.toLowerCase()} picked yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddFavoriteModal
        open={adding !== null}
        type={adding ?? "anime"}
        existingIds={new Set(favorites.filter((f) => f.type === adding).map((f) => f.itemId))}
        onClose={() => setAdding(null)}
        onConfirm={async (item) => {
          if (!adding) return;
          await onAdd(adding, item);
          setAdding(null);
        }}
      />
    </section>
  );
}

function FavoriteTile({
  fav,
  isOwn,
  onRemove,
}: {
  fav: FavoriteItem;
  isOwn: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06]">
      {fav.itemImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fav.itemImage} alt={fav.itemTitle} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-zinc-500">No image</div>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2"
      >
        <p className="line-clamp-2 text-[11px] font-medium leading-tight text-zinc-100">
          {fav.itemTitle}
        </p>
      </div>
      {isOwn && (
        <button
          aria-label={`Remove ${fav.itemTitle} from favorites`}
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-black/80 text-zinc-200 ring-1 ring-white/10 transition hover:bg-rose-600 hover:text-white group-hover:flex"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
