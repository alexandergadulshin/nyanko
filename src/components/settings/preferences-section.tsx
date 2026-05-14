"use client";

import { Field, SelectInput } from "./settings-fields";
import { ToggleRow } from "./settings-toggle-row";

export interface PreferencesFormValues {
  language: string;
  autoMarkCompleted: boolean;
  spoilerWarnings: boolean;
}

interface Props {
  values: PreferencesFormValues;
  onChange: <K extends keyof PreferencesFormValues>(
    key: K,
    value: PreferencesFormValues[K],
  ) => void;
  theme: "light" | "dark";
  onThemeChange: (next: "light" | "dark") => void;
}

const LANGUAGES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "ja", label: "Japanese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

const THEME_SAMPLES: ReadonlyArray<{
  value: "dark" | "light";
  label: string;
  preview: string;
}> = [
  {
    value: "dark",
    label: "Dark",
    preview: "bg-gradient-to-br from-[#1a1330] via-[#0d0a1f] to-[#10071e]",
  },
  {
    value: "light",
    label: "Light",
    preview: "bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-300",
  },
];

export function PreferencesSection({ values, onChange, theme, onThemeChange }: Props) {
  return (
    <>
      <Field label="Theme">
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Theme">
          {THEME_SAMPLES.map((t) => {
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onThemeChange(t.value)}
                className={
                  "group overflow-hidden rounded-2xl p-1.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 " +
                  (active
                    ? "bg-gradient-to-br from-purple-500/30 to-pink-500/20 ring-1 ring-inset ring-purple-400/50"
                    : "bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.07]")
                }
              >
                <div
                  className={`relative h-20 w-full rounded-xl ${t.preview} ring-1 ring-inset ring-black/20`}
                >
                  {/* mock window chrome */}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 py-2">
                  <span
                    className={
                      "text-sm font-medium " + (active ? "text-white" : "text-zinc-200")
                    }
                  >
                    {t.label}
                  </span>
                  {active ? (
                    <span className="text-xs font-medium text-purple-300">selected</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Language">
        <SelectInput
          value={values.language}
          onChange={(e) => onChange("language", e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-zinc-900">
              {l.label}
            </option>
          ))}
        </SelectInput>
      </Field>

      <div className="space-y-2.5 pt-2">
        <ToggleRow
          label="Auto-mark as completed"
          description="When you watch the final episode, automatically move the show to Completed."
          checked={values.autoMarkCompleted}
          onChange={(v) => onChange("autoMarkCompleted", v)}
        />
        <ToggleRow
          label="Spoiler warnings"
          description="Hide potential plot spoilers behind a tap-to-reveal blur."
          checked={values.spoilerWarnings}
          onChange={(v) => onChange("spoilerWarnings", v)}
        />
      </div>
    </>
  );
}
