"use client";

import { useSyncExternalStore } from "react";

export interface Preferences {
  language: string;
  autoMarkCompleted: boolean;
  spoilerWarnings: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  language: "en",
  autoMarkCompleted: false,
  spoilerWarnings: true,
};

const PREFS_KEY = "nyanko.preferences";
// Same-tab writes don't trigger the `storage` event, so the settings page
// fires this custom event after writing for in-page listeners to pick up.
const PREFS_EVENT = "nyanko:preferences";

// useSyncExternalStore needs getSnapshot to return a stable reference until
// the value actually changes. Cache the parsed object keyed on the raw string.
let cachedRaw: string | null = null;
let cachedValue: Preferences = DEFAULT_PREFERENCES;

function readPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(PREFS_KEY);
  } catch {
    return DEFAULT_PREFERENCES;
  }

  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;

  if (!raw) {
    cachedValue = DEFAULT_PREFERENCES;
    return cachedValue;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    cachedValue = { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    cachedValue = DEFAULT_PREFERENCES;
  }
  return cachedValue;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onChange);
  window.addEventListener(PREFS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PREFS_EVENT, onChange);
  };
}

/** Read the user's persisted preferences, reactive to changes in any tab. */
export function usePreferences(): Preferences {
  return useSyncExternalStore(
    subscribe,
    readPreferences,
    () => DEFAULT_PREFERENCES,
  );
}

/** Persist preferences and notify same-tab listeners. */
export function writePreferences(next: Preferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PREFS_EVENT));
  } catch {
    // localStorage may be unavailable (private mode, quota); ignore.
  }
}
