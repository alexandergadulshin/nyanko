"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaEye,
  FaPalette,
  FaShieldAlt,
  FaTrash,
} from "react-icons/fa";

import { useTheme } from "~/hooks/use-theme";
import { writePreferences } from "~/hooks/use-preferences";
import { Toast } from "~/components/ui/toast";
import { Skeleton } from "~/components/ui/skeleton";

import { Section } from "~/components/settings/section";
import { SaveBar } from "~/components/settings/save-bar";
import { IdentityStrip } from "~/components/settings/identity-strip";
import {
  ProfileSection,
  type ProfileFormValues,
} from "~/components/settings/profile-section";
import {
  PrivacySection,
  type PrivacyFormValues,
  type ProfileVisibility,
} from "~/components/settings/privacy-section";
import {
  PreferencesSection,
  type PreferencesFormValues,
} from "~/components/settings/preferences-section";
import { AccountSection } from "~/components/settings/account-section";
import { DangerSection } from "~/components/settings/danger-section";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

interface SettingsApiResponse {
  user: {
    name?: string;
    username?: string;
    bio?: string;
    email?: string;
    image?: string;
    allowFriendRequests?: boolean;
    lastNameChange?: string;
    lastUsernameChange?: string;
    profileVisibility?: string;
    showWatchList?: boolean;
    showFavorites?: boolean;
    showStats?: boolean;
    createdAt?: string;
  };
}

interface PersistedForm {
  profile: ProfileFormValues;
  privacy: PrivacyFormValues;
}

interface State extends PersistedForm {
  preferences: PreferencesFormValues;
  email: string;
  memberSince: Date | null;
  lastNameChange: Date | null;
  lastUsernameChange: Date | null;
}

const EMPTY_PROFILE: ProfileFormValues = {
  displayName: "",
  username: "",
  bio: "",
  profileImage: "",
};

const EMPTY_PRIVACY: PrivacyFormValues = {
  profileVisibility: "public",
  showWatchList: true,
  showFavorites: true,
  showStats: true,
  allowFriendRequests: true,
};

const EMPTY_PREFS: PreferencesFormValues = {
  language: "en",
  autoMarkCompleted: false,
  spoilerWarnings: true,
};

const initialState: State = {
  profile: EMPTY_PROFILE,
  privacy: EMPTY_PRIVACY,
  preferences: EMPTY_PREFS,
  email: "",
  memberSince: null,
  lastNameChange: null,
  lastUsernameChange: null,
};

const PREFS_KEY = "nyanko.preferences";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [state, setState] = useState<State>(initialState);
  const [original, setOriginal] = useState<PersistedForm>({
    profile: EMPTY_PROFILE,
    privacy: EMPTY_PRIVACY,
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    kind: "success" | "error";
  } | null>(null);

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkId = useRef(0);

  /* ----------------------------------------------------------- redirect out */
  useEffect(() => {
    if (isLoaded && !user) router.push("/auth");
  }, [isLoaded, user, router]);

  /* ----------------------------------------------------------- initial load */
  useEffect(() => {
    if (!isLoaded || !user) return;
    let alive = true;
    void (async () => {
      let storedPrefs: Partial<PreferencesFormValues> | null = null;
      try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (raw) storedPrefs = JSON.parse(raw) as Partial<PreferencesFormValues>;
      } catch {
        storedPrefs = null;
      }

      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const data = (await res.json()) as SettingsApiResponse;
        if (!alive) return;
        const u = data.user;
        const profile: ProfileFormValues = {
          displayName: u.name ?? user.fullName ?? "",
          username: u.username ?? "",
          bio: u.bio ?? "",
          profileImage: u.image ?? user.imageUrl ?? "",
        };
        const privacy: PrivacyFormValues = {
          profileVisibility:
            (u.profileVisibility as ProfileVisibility | undefined) ?? "public",
          showWatchList: u.showWatchList ?? true,
          showFavorites: u.showFavorites ?? true,
          showStats: u.showStats ?? true,
          allowFriendRequests: u.allowFriendRequests ?? true,
        };
        setState({
          profile,
          privacy,
          preferences: { ...EMPTY_PREFS, ...(storedPrefs ?? {}) },
          email: u.email ?? user.emailAddresses[0]?.emailAddress ?? "",
          memberSince: u.createdAt ? new Date(u.createdAt) : null,
          lastNameChange: u.lastNameChange ? new Date(u.lastNameChange) : null,
          lastUsernameChange: u.lastUsernameChange
            ? new Date(u.lastUsernameChange)
            : null,
        });
        setOriginal({ profile, privacy });
      } catch (err) {
        if (alive) {
          setToast({
            msg: err instanceof Error ? err.message : "Failed to load settings",
            kind: "error",
          });
        }
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isLoaded, user]);

  /* --------------------------------------------------------- derived state */
  const canChangeName = useMemo(() => {
    if (!state.lastNameChange) return true;
    return Date.now() - state.lastNameChange.getTime() >= DAY_MS;
  }, [state.lastNameChange]);

  const canChangeUsername = useMemo(() => {
    if (!state.lastUsernameChange) return true;
    return Date.now() - state.lastUsernameChange.getTime() >= WEEK_MS;
  }, [state.lastUsernameChange]);

  const nextNameChange = useMemo(
    () =>
      state.lastNameChange ? new Date(state.lastNameChange.getTime() + DAY_MS) : null,
    [state.lastNameChange],
  );
  const nextUsernameChange = useMemo(
    () =>
      state.lastUsernameChange
        ? new Date(state.lastUsernameChange.getTime() + WEEK_MS)
        : null,
    [state.lastUsernameChange],
  );

  const dirty = useMemo(() => {
    return (
      JSON.stringify(state.profile) !== JSON.stringify(original.profile) ||
      JSON.stringify(state.privacy) !== JSON.stringify(original.privacy)
    );
  }, [state.profile, state.privacy, original]);

  /* --------------------------------------------------------- field setters */
  const setProfile = useCallback(
    <K extends keyof ProfileFormValues>(k: K, v: ProfileFormValues[K]) => {
      setState((s) => ({ ...s, profile: { ...s.profile, [k]: v } }));
    },
    [],
  );
  const setPrivacy = useCallback(
    <K extends keyof PrivacyFormValues>(k: K, v: PrivacyFormValues[K]) => {
      setState((s) => ({ ...s, privacy: { ...s.privacy, [k]: v } }));
    },
    [],
  );
  const setPreferences = useCallback(
    <K extends keyof PreferencesFormValues>(k: K, v: PreferencesFormValues[K]) => {
      setState((s) => {
        const next = { ...s.preferences, [k]: v };
        writePreferences(next);
        return { ...s, preferences: next };
      });
    },
    [],
  );
  const onThemeChange = useCallback(
    (next: "light" | "dark") => {
      if (next !== theme) toggleTheme();
    },
    [theme, toggleTheme],
  );

  /* ----------------------------------------------- username availability */
  const onUsernameInput = useCallback(
    (value: string) => {
      setProfile("username", value);
      setUsernameAvailable(null);
      if (checkTimer.current) clearTimeout(checkTimer.current);
      // Invalidate any in-flight or pending check; only the latest
      // request's result is allowed to write back to UI state.
      const myId = ++checkId.current;
      const trimmed = value.trim();
      if (!trimmed || trimmed === original.profile.username) {
        setUsernameChecking(false);
        return;
      }
      setUsernameChecking(true);
      checkTimer.current = setTimeout(() => {
        void (async () => {
          try {
            const res = await fetch("/api/settings/username-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: trimmed }),
            });
            if (myId !== checkId.current) return;
            const data = (await res.json()) as { available?: boolean };
            if (myId !== checkId.current) return;
            setUsernameAvailable(
              typeof data.available === "boolean" ? data.available : null,
            );
          } catch {
            if (myId !== checkId.current) return;
            setUsernameAvailable(null);
          } finally {
            if (myId === checkId.current) setUsernameChecking(false);
          }
        })();
      }, 400);
    },
    [original.profile.username, setProfile],
  );

  /* -------------------------------------------------------------- save */
  const saveAll = useCallback(
    async (override?: Partial<ProfileFormValues>) => {
      const profile = { ...state.profile, ...(override ?? {}) };
      const body = {
        displayName: profile.displayName,
        username: profile.username || undefined,
        bio: profile.bio,
        image: profile.profileImage,
        profileVisibility: state.privacy.profileVisibility,
        showWatchList: state.privacy.showWatchList,
        showFavorites: state.privacy.showFavorites,
        showStats: state.privacy.showStats,
        allowFriendRequests: state.privacy.allowFriendRequests,
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to save settings");
      }
      return profile;
    },
    [state.profile, state.privacy],
  );

  const onSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const savedProfile = await saveAll();
      const now = new Date();
      setState((s) => ({
        ...s,
        lastNameChange:
          s.profile.displayName !== original.profile.displayName
            ? now
            : s.lastNameChange,
        lastUsernameChange:
          s.profile.username !== original.profile.username
            ? now
            : s.lastUsernameChange,
      }));
      setOriginal({ profile: savedProfile, privacy: state.privacy });
      setToast({ msg: "Settings saved.", kind: "success" });
    } catch (err) {
      setToast({
        msg: err instanceof Error ? err.message : "Couldn't save settings.",
        kind: "error",
      });
    } finally {
      setSaving(false);
    }
  }, [saveAll, saving, original.profile, state.privacy]);

  const onDiscard = useCallback(() => {
    setState((s) => ({ ...s, profile: original.profile, privacy: original.privacy }));
    setUsernameAvailable(null);
  }, [original]);

  /* ------------------------------------------------------ image upload */
  const onImageUploadComplete = useCallback(
    async (res: unknown) => {
      const arr = res as Array<{ url?: string }> | undefined;
      const url = arr?.[0]?.url;
      if (!url) return;
      setProfile("profileImage", url);
      try {
        const saved = await saveAll({ profileImage: url });
        setOriginal((o) => ({ ...o, profile: saved }));
        setToast({ msg: "Profile photo updated.", kind: "success" });
      } catch (err) {
        setToast({
          msg:
            err instanceof Error
              ? err.message
              : "Uploaded, but couldn't save. Click Save changes.",
          kind: "error",
        });
      }
    },
    [saveAll, setProfile],
  );

  const onImageUploadError = useCallback((error: Error) => {
    setToast({ msg: `Upload failed: ${error.message}`, kind: "error" });
  }, []);

  /* --------------------------------------------------------- delete acct */
  const onDeleteAccount = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/settings/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmDelete: true }),
      });
      if (!res.ok) throw new Error("Failed to delete account");
      const data = (await res.json()) as { shouldSignOut?: boolean };
      if (data.shouldSignOut) {
        await signOut();
        router.push("/?message=Account%20deleted");
      } else {
        router.push("/auth?message=Account%20deleted");
      }
    } catch (err) {
      setToast({
        msg: err instanceof Error ? err.message : "Couldn't delete account.",
        kind: "error",
      });
      setDeleting(false);
    }
  }, [router, signOut]);

  const onSignOut = useCallback(async () => {
    await signOut();
    router.push("/");
  }, [signOut, router]);

  /* ------------------------------------------------------------ render */
  if (!isLoaded || !user || !loaded) {
    return (
      <Shell>
        <LoadingState />
      </Shell>
    );
  }

  return (
    <Shell>
      <IdentityStrip
        name={state.profile.displayName}
        username={state.profile.username}
        email={state.email}
        memberSince={state.memberSince}
        imageUrl={state.profile.profileImage}
      />

      <div className="mt-2">
        <Section
          id="profile"
          icon={<FaUser />}
          title="Profile"
          description="Your photo, name, and bio — what other people see when they land on your profile."
        >
          <ProfileSection
            values={state.profile}
            onChange={setProfile}
            canChangeName={canChangeName}
            canChangeUsername={canChangeUsername}
            nextNameChange={nextNameChange}
            nextUsernameChange={nextUsernameChange}
            usernameChecking={usernameChecking}
            usernameAvailable={usernameAvailable}
            onUsernameInput={onUsernameInput}
            onImageUploadComplete={onImageUploadComplete}
            onImageUploadError={onImageUploadError}
          />
        </Section>

        <Section
          id="privacy"
          icon={<FaEye />}
          title="Privacy"
          description="Choose who can find your profile and which parts of it stay visible."
        >
          <PrivacySection values={state.privacy} onChange={setPrivacy} />
        </Section>

        <Section
          id="preferences"
          icon={<FaPalette />}
          title="Preferences"
          description="Tune how Nyanko looks and behaves while you're watching."
        >
          <PreferencesSection
            values={state.preferences}
            onChange={setPreferences}
            theme={theme}
            onThemeChange={onThemeChange}
          />
        </Section>

        <Section
          id="account"
          icon={<FaShieldAlt />}
          title="Account"
          description="The details tied to your sign-in. Edit these through your auth provider."
        >
          <AccountSection
            email={state.email}
            username={state.profile.username}
            memberSince={state.memberSince}
            onSignOut={() => void onSignOut()}
          />
        </Section>

        <Section
          id="danger"
          icon={<FaTrash />}
          iconAccent="danger"
          title="Danger zone"
          description="Irreversible actions. Once you confirm, your data is gone."
        >
          <DangerSection onDeleteAccount={onDeleteAccount} deleting={deleting} />
        </Section>
      </div>

      <SaveBar
        visible={dirty}
        saving={saving}
        onSave={() => void onSave()}
        onDiscard={onDiscard}
      />

      <Toast
        message={toast?.msg ?? null}
        kind={toast?.kind ?? "info"}
        onDismiss={() => setToast(null)}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0A0917]">
      <div className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:px-6">
        {children}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div>
      <Skeleton className="h-32 w-full rounded-[28px]" />
      <div className="mt-12 space-y-16">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <div className="lg:w-72">
              <Skeleton className="h-11 w-11" rounded="lg" />
              <Skeleton className="mt-5 h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-32" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
            <div className="flex-1 space-y-4">
              <Skeleton className="h-20 w-full" rounded="lg" />
              <Skeleton className="h-14 w-full" rounded="lg" />
              <Skeleton className="h-14 w-full" rounded="lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
