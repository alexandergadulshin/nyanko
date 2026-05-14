"use client";

/**
 * Tabs — accessible segmented control. Keyboard-navigable (ArrowLeft/Right,
 * Home/End). Used to be a sidebar in the old friends page; horizontal
 * segmented tabs read better on mobile and look more modern on desktop.
 *
 * Usage:
 *   <Tabs value={tab} onChange={setTab} items={[
 *     { value: "friends", label: "Friends", count: 12 },
 *     { value: "requests", label: "Requests", count: 2, badge: "danger" },
 *   ]} />
 */

import { useId, useRef } from "react";

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  /** Number badge after the label. */
  count?: number;
  /** Visual tone of the count badge. */
  badge?: "default" | "danger";
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (next: T) => void;
  items: ReadonlyArray<TabItem<T>>;
  /** ARIA label for the tablist. */
  ariaLabel?: string;
  className?: string;
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  ariaLabel,
  className = "",
}: TabsProps<T>) {
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusIndex = (i: number) => {
    const n = items.length;
    const idx = ((i % n) + n) % n;
    refs.current[idx]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusIndex(i + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusIndex(i - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusIndex(items.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-inset ring-white/10 ${className}`}
    >
      {items.map((item, i) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${baseId}-tab-${item.value}`}
            aria-selected={isActive}
            aria-controls={`${baseId}-panel-${item.value}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={
              "relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium " +
              "transition-colors duration-150 " +
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 " +
              (isActive
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]")
            }
          >
            <span>{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span
                className={
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold " +
                  (item.badge === "danger"
                    ? "bg-rose-500/90 text-white"
                    : isActive
                      ? "bg-purple-500/40 text-purple-100"
                      : "bg-white/10 text-zinc-300")
                }
                aria-label={`${item.count} items`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
