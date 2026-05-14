"use client";

import { Button } from "~/components/ui/button";

interface Props {
  email: string;
  username: string;
  memberSince: Date | null;
  onSignOut: () => void;
}

export function AccountSection({ email, username, memberSince, onSignOut }: Props) {
  return (
    <>
      <dl className="divide-y divide-white/[0.05] overflow-hidden rounded-3xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.05]">
        <Row label="Email" value={email || "—"} />
        <Row label="Username" value={username ? `@${username}` : "—"} />
        <Row
          label="Member since"
          value={
            memberSince
              ? memberSince.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"
          }
        />
      </dl>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </dt>
      <dd className="truncate text-sm text-zinc-100">{value}</dd>
    </div>
  );
}
