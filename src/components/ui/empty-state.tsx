"use client";

/**
 * EmptyState — a consistent "nothing here" placeholder with optional CTA.
 * Use it whenever a list, search, or section has no rows.
 */

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Optional action — rendered as a button below the description. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-12 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-zinc-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-zinc-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
