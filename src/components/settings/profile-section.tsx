"use client";

import { UploadButton } from "~/lib/uploadthing";
import { Avatar } from "~/components/ui/avatar";
import { Field, TextInput, TextAreaInput } from "./settings-fields";

export interface ProfileFormValues {
  displayName: string;
  username: string;
  bio: string;
  profileImage: string;
}

interface Props {
  values: ProfileFormValues;
  onChange: <K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) => void;
  canChangeName: boolean;
  canChangeUsername: boolean;
  nextNameChange: Date | null;
  nextUsernameChange: Date | null;
  usernameChecking: boolean;
  usernameAvailable: boolean | null;
  onUsernameInput: (value: string) => void;
  onImageUploadComplete: (res: unknown) => Promise<void> | void;
  onImageUploadError: (error: Error) => void;
}

export function ProfileSection({
  values,
  onChange,
  canChangeName,
  canChangeUsername,
  nextNameChange,
  nextUsernameChange,
  usernameChecking,
  usernameAvailable,
  onUsernameInput,
  onImageUploadComplete,
  onImageUploadError,
}: Props) {
  return (
    <>
      <div className="flex items-center gap-5 rounded-3xl bg-white/[0.03] p-5 ring-1 ring-inset ring-white/[0.05]">
        <Avatar
          name={values.displayName}
          src={values.profileImage}
          size="lg"
          className="ring-[3px] ring-white/10"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-100">Profile photo</p>
          <p className="mt-0.5 text-xs text-zinc-400">PNG / JPG / WebP · 4 MB max.</p>
        </div>
        <UploadButton
          endpoint="profileImage"
          onClientUploadComplete={onImageUploadComplete}
          onUploadError={onImageUploadError}
          appearance={{
            button:
              "rounded-full bg-white text-zinc-900 hover:bg-zinc-100 px-4 py-2 text-sm font-medium transition-colors ut-uploading:bg-zinc-300 ut-uploading:cursor-not-allowed",
            allowedContent: "hidden",
            container: "items-end",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Display name"
          hint={
            canChangeName
              ? "You can rename yourself once per day."
              : nextNameChange
              ? `Locked until ${nextNameChange.toLocaleDateString()}.`
              : undefined
          }
        >
          <TextInput
            value={values.displayName}
            onChange={(e) => onChange("displayName", e.target.value)}
            disabled={!canChangeName}
            placeholder="Your name"
            maxLength={50}
          />
        </Field>

        <Field
          label="Username"
          hint={
            !canChangeUsername && nextUsernameChange
              ? `Locked until ${nextUsernameChange.toLocaleDateString()}.`
              : usernameAvailable === true
              ? "Username is available."
              : "Change once every 7 days."
          }
          error={
            canChangeUsername && usernameAvailable === false
              ? "That username is already taken."
              : undefined
          }
          right={
            usernameChecking ? (
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <Spinner /> checking
              </span>
            ) : usernameAvailable === true ? (
              <span className="text-emerald-300">available</span>
            ) : null
          }
        >
          <TextInput
            value={values.username}
            onChange={(e) => onUsernameInput(e.target.value)}
            disabled={!canChangeUsername}
            placeholder="alexander"
            maxLength={30}
          />
        </Field>
      </div>

      <Field label="Bio" hint={`${values.bio.length} / 280 characters.`}>
        <TextAreaInput
          value={values.bio}
          rows={4}
          maxLength={280}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Tell people what you like to watch."
        />
      </Field>
    </>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 animate-spin" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeDasharray="42"
        strokeLinecap="round"
      />
    </svg>
  );
}
