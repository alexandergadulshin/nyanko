"use client";

import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  icon: ReactNode;
  iconAccent?: "primary" | "danger";
  title: string;
  description: string;
  children: ReactNode;
}

const ACCENT: Record<NonNullable<SectionProps["iconAccent"]>, string> = {
  primary:
    "bg-gradient-to-br from-purple-500/85 to-pink-500/75 text-white shadow-[0_6px_18px_-6px_rgba(168,85,247,0.55)]",
  danger:
    "bg-gradient-to-br from-rose-500/90 to-orange-500/75 text-white shadow-[0_6px_18px_-6px_rgba(244,63,94,0.55)]",
};

/**
 * Section — editorial "form aside" row. Title and description live on the
 * left, controls on the right. Hairline divider on top (suppressed for the
 * first section by the `:first-of-type` rule). The aside is sticky so it
 * stays visible while the user scrolls through long control lists.
 */
export function Section({
  id,
  icon,
  iconAccent = "primary",
  title,
  description,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className="border-t border-white/[0.06] py-12 first-of-type:border-t-0 first-of-type:pt-2 lg:py-16"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="lg:sticky lg:top-28 lg:h-fit lg:w-72 lg:shrink-0">
          <div
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[17px] ${ACCENT[iconAccent]}`}
            aria-hidden="true"
          >
            {icon}
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
            {description}
          </p>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">{children}</div>
      </div>
    </section>
  );
}
