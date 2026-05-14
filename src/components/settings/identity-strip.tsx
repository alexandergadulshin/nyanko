"use client";

import { Avatar } from "~/components/ui/avatar";

interface IdentityStripProps {
  name: string;
  username: string;
  email: string;
  memberSince: Date | null;
  imageUrl: string;
}

/**
 * IdentityStrip — slim, glanceable identity row at the top of the
 * settings page. Sets the visual tone (gradient backdrop) before the
 * editorial sections start.
 */
export function IdentityStrip({
  name,
  username,
  email,
  memberSince,
  imageUrl,
}: IdentityStripProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-white/[0.03] p-6 ring-1 ring-white/[0.06] backdrop-blur-md sm:p-8">
      {/* gradient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-gradient-to-tr from-indigo-500/20 to-transparent blur-3xl"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Avatar
          name={name}
          src={imageUrl}
          size="xl"
          className="ring-[3px] ring-white/15 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-purple-300/80">
            Signed in as
          </p>
          <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {name || "Unnamed user"}
          </h1>
          <p className="mt-1 truncate text-sm text-zinc-400">
            {username ? `@${username}` : "no username set"}
            {email ? <> · {email}</> : null}
            {memberSince ? (
              <>
                {" "}
                · joined{" "}
                {memberSince.toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })}
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
