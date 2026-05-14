"use client";

import Link from "next/link";
import { FaStar, FaHeart } from "react-icons/fa";
import type { SearchCategory, SearchItem } from "~/utils/api";

const DETAIL_PATH: Record<SearchCategory, string> = {
  anime: "anime",
  manga: "manga",
  characters: "character",
  people: "person",
};

function itemTitle(item: SearchItem): string {
  return "title" in item ? item.title : item.name;
}

function metaLine(item: SearchItem, category: SearchCategory): string {
  if (category === "anime" && "episodes" in item && item.episodes) {
    return `${item.episodes} episode${item.episodes === 1 ? "" : "s"}`;
  }
  if (category === "manga" && "chapters" in item && item.chapters) {
    return `${item.chapters} chapter${item.chapters === 1 ? "" : "s"}`;
  }
  if (category === "characters") return "Character";
  if (category === "people") return "Person";
  return "";
}

function compactCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);
}

export function SearchResultCard({
  item,
  category,
}: {
  item: SearchItem;
  category: SearchCategory;
}) {
  const title = itemTitle(item);
  const meta = metaLine(item, category);
  const rating = "rating" in item ? item.rating : 0;

  return (
    <Link
      href={`/${DETAIL_PATH[category]}/${item.malId}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.06] transition-all hover:bg-white/[0.06] hover:ring-purple-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-anime.jpg";
          }}
        />
        {"status" in item && item.status && (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {item.status}
          </span>
        )}
        {rating > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300 backdrop-blur-sm">
            <FaStar className="h-2.5 w-2.5" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-white transition-colors group-hover:text-purple-200">
          {title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-gray-400">
          <span>{meta}</span>
          {item.favorites > 0 && (
            <span className="flex items-center gap-1">
              <FaHeart className="h-2.5 w-2.5 text-rose-400/80" />
              {compactCount(item.favorites)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
