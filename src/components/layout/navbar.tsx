"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { APP_CONFIG } from "~/lib/constants";
import { useTheme } from "~/hooks/use-theme";

interface NavLink {
  label: string;
  href: string;
  auth?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "My List", href: "/anime-list", auth: true },
  { label: "Recommendations", href: "/recommendations", auth: true },
  { label: "Friends", href: "/friends", auth: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const fetchedFor = useRef("");
  const navRef = useRef<HTMLElement>(null);

  const isAuthed = !!user;
  const userName =
    displayName ||
    user?.fullName ||
    user?.emailAddresses[0]?.emailAddress ||
    "Account";
  const avatarUrl = profileImage || user?.imageUrl || "";

  /* Pull the DB profile (name + image) once per signed-in user. */
  useEffect(() => {
    if (!isLoaded || !user?.id || fetchedFor.current === user.id) return;
    fetchedFor.current = user.id;
    void (async () => {
      try {
        const res = await fetch(`/api/profile/${user.id}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          profile?: { name?: string; image?: string };
        };
        if (data.profile?.name) setDisplayName(data.profile.name);
        if (data.profile?.image) setProfileImage(data.profile.image);
      } catch {
        /* non-fatal — Clerk's name/image is the fallback */
      }
    })();
  }, [isLoaded, user?.id]);

  /* Close menus on navigation. */
  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  /* Close menus on Escape or an outside click. */
  useEffect(() => {
    if (!mobileOpen && !accountOpen) return;
    const close = () => {
      setMobileOpen(false);
      setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [mobileOpen, accountOpen]);

  const links = NAV_LINKS.filter((l) => !l.auth || isAuthed);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const iconBtn =
    "custom-styled grid h-9 w-9 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70";

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Main"
        className="fixed left-3 right-3 top-3 z-50 h-14 rounded-2xl border border-white/10 bg-[#15131f]/85 shadow-lg shadow-black/30 backdrop-blur-xl sm:left-4 sm:right-4"
      >
        <div className="mx-auto flex h-full w-full max-w-[1536px] items-center gap-1 px-3 sm:gap-2 sm:px-4">
          {/* Logo */}
          <Link
            href="/"
            className="custom-styled flex-shrink-0 rounded-lg px-1.5 text-lg font-bold tracking-tight text-white/95 transition-colors hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70"
          >
            {APP_CONFIG.name}
          </Link>

          {/* Desktop nav links */}
          <div className="ml-2 hidden items-center gap-0.5 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`custom-styled rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70 ${
                  isActive(l.href)
                    ? "bg-white/10 text-white"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <Link href="/search" aria-label="Search" className={iconBtn}>
              <SearchIcon />
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className={iconBtn}
            >
              {theme === "dark" ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* Account — desktop */}
            <div className="relative hidden md:block">
              {!isLoaded ? (
                <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
              ) : isAuthed ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((o) => !o)}
                    aria-expanded={accountOpen}
                    aria-controls="account-menu"
                    aria-label="Account menu"
                    className="custom-styled flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/15 transition hover:ring-purple-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80"
                  >
                    <Avatar url={avatarUrl} name={userName} />
                  </button>
                  {accountOpen && (
                    <div
                      id="account-menu"
                      className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1c1a2b]/95 p-1.5 shadow-2xl backdrop-blur-xl"
                    >
                      <div className="px-2.5 py-2">
                        <p className="truncate text-sm font-semibold text-white/95">
                          {userName}
                        </p>
                        {user?.emailAddresses[0]?.emailAddress && (
                          <p className="truncate text-xs text-white/45">
                            {user.emailAddresses[0].emailAddress}
                          </p>
                        )}
                      </div>
                      <div className="my-1 border-t border-white/10" />
                      <MenuLink href="/profile">Profile</MenuLink>
                      <MenuLink href="/settings">Settings</MenuLink>
                      <div className="my-1 border-t border-white/10" />
                      <SignOutButton>
                        <button
                          type="button"
                          className="custom-styled block w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                        >
                          Sign out
                        </button>
                      </SignOutButton>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/sign-in"
                    className="custom-styled rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="custom-styled rounded-lg bg-purple-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Hamburger — mobile */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
              className={`${iconBtn} md:hidden`}
            >
              <Hamburger open={mobileOpen} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            id="mobile-menu"
            className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#1c1a2b]/95 p-2 shadow-2xl backdrop-blur-xl md:hidden"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`custom-styled block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(l.href)
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}

            <div className="my-2 border-t border-white/10" />

            {!isLoaded ? (
              <div className="px-3 py-2 text-sm text-white/45">Loading…</div>
            ) : isAuthed ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/15">
                    <Avatar url={avatarUrl} name={userName} />
                  </span>
                  <span className="truncate text-sm font-semibold text-white/95">
                    {userName}
                  </span>
                </div>
                <MenuLink href="/profile">Profile</MenuLink>
                <MenuLink href="/settings">Settings</MenuLink>
                <SignOutButton>
                  <button
                    type="button"
                    className="custom-styled block w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                  >
                    Sign out
                  </button>
                </SignOutButton>
              </>
            ) : (
              <>
                <MenuLink href="/sign-in">Sign in</MenuLink>
                <Link
                  href="/sign-up"
                  className="custom-styled mt-1 block rounded-lg bg-purple-600 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-purple-500"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Spacer — keeps every page's content clear of the fixed navbar so
          nothing overlaps it on first load, with no per-page padding. */}
      <div aria-hidden className="h-[76px]" />
    </>
  );
}

/* ------------------------------ subcomponents ----------------------------- */

function MenuLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="custom-styled block rounded-lg px-2.5 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
    >
      {children}
    </Link>
  );
}

function Avatar({ url, name }: { url: string; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-full w-full object-cover" />;
  }
  return (
    <span className="grid h-full w-full place-items-center bg-purple-600 text-sm font-semibold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function Hamburger({ open }: { open: boolean }) {
  return (
    <div
      className="flex h-[18px] w-[18px] flex-col items-center justify-center"
      aria-hidden="true"
    >
      <span
        className={`block h-0.5 w-[18px] rounded-full bg-current transition-all duration-300 ${
          open ? "translate-y-1 rotate-45" : "-translate-y-0.5"
        }`}
      />
      <span
        className={`my-0.5 block h-0.5 w-[18px] rounded-full bg-current transition-all duration-300 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`block h-0.5 w-[18px] rounded-full bg-current transition-all duration-300 ${
          open ? "-translate-y-1 -rotate-45" : "translate-y-0.5"
        }`}
      />
    </div>
  );
}
