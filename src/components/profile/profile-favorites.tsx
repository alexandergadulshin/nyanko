"use client";

/**
 * ProfileFavorites — Apple-style stacked card with tabbed categories.
 *
 * One rounded-[28px] surface. Inside: pill tabs (Anime / Characters /
 * Voice actors), then a 5-card row with the active type's favorites.
 * Empty slots become Add buttons (owner only). Hover shows a soft scale
 * + brightness bump on each card.
 */

import { useState } from "react";
import { SectionCard } from "./profile-stats";
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

const TABS: ReadonlyArray<{ type: FavoriteType; label: string }> = [
  { type: "anime", label: "Anime" },
  { type: "character", label: "Characters" },
  { type: "person", label: "Voice actors" },
];

const MAX_PER_TYPE = 5;

export function ProfileFavorites({
  favorites,
  isOwn,
  onAdd,
  onRemove,
}: ProfileFavoritesProps) {
  const [active, setActive] = useState<FavoriteType>("anime");
  const [adding, setAdding] = useState<FavoriteType | null>(null);

  const items = favorites.filter((f) => f.type === active);
  const slots = Array.from({ length: MAX_PER_TYPE }, (_, i) => items[i]);

  return (
    <section id="favorites">
      <SectionCard>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-white">Favorites</h2>

          <div
            role="tablist"
            aria-label="Favorite category"
            className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.08]"
          >
            {TABS.map((t) => {
              const isActive = active === t.type;
              return (
                <button
                  key={t.type}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(t.type)}
                  className={
                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all " +
                    (isActive
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-300 hover:text-white hover:bg-white/[0.06]")
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {slots.map((fav, idx) =>
            fav ? (
              <FavoriteCard
                key={fav.id}
                fav={fav}
                isOwn={isOwn}
                onRemove={() => onRemove(fav.type, fav.itemId)}
              />
            ) : isOwn ? (
              <AddSlot key={`empty-${idx}`} onClick={() => setAdding(active)} />
            ) : (
              <div
                key={`empty-${idx}`}
                aria-hidden="true"
                className="aspect-[2/3] rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.04]"
              />
            ),
          )}
        </div>
      </SectionCard>

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

function FavoriteCard({
  fav,
  isOwn,
  onRemove,
}: {
  fav: FavoriteItem;
  isOwn: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/[0.04] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-[1.025]">
      {fav.itemImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fav.itemImage}
          alt=""
          className="h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-zinc-500">No image</div>
      )}

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-8"
      >
        <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-50">
          {fav.itemTitle}
        </p>
      </div>

      {isOwn && (
        <button
          aria-label={`Remove ${fav.itemTitle}`}
          onClick={onRemove}
          className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-black/70 text-zinc-200 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-rose-600 hover:text-white group-hover:flex"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function AddSlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex aspect-[2/3] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-zinc-400 transition-all hover:border-white/25 hover:bg-white/[0.04] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
    >
      <div className="text-center">
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xl transition-transform group-hover:scale-110">+</div>
        <p className="mt-2 text-[11px] uppercase tracking-wider">Add</p>
      </div>
    </button>
  );
}
