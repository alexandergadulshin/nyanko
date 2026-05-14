"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Field, TextInput } from "./settings-fields";

interface Props {
  onDeleteAccount: () => Promise<void> | void;
  deleting: boolean;
}

const DELETE_PHRASE = "DELETE MY ACCOUNT";

export function DangerSection({ onDeleteAccount, deleting }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const canDelete = text === DELETE_PHRASE;

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/[0.04] to-transparent p-5 ring-1 ring-inset ring-rose-500/20 sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-rose-200">Delete account</p>
        <p className="text-xs text-zinc-400">
          Removes your watch list, favorites, friends, and history. This cannot be undone.
        </p>
      </div>

      {!open ? (
        <div className="mt-4">
          <Button variant="danger" onClick={() => setOpen(true)}>
            Delete my account…
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-rose-500/[0.06] p-4 ring-1 ring-inset ring-rose-500/30">
          <Field
            label="Confirm"
            hint={
              <>
                Type{" "}
                <span className="font-mono text-rose-200">{DELETE_PHRASE}</span> below to
                enable the delete button.
              </>
            }
          >
            <TextInput
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={DELETE_PHRASE}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
            />
          </Field>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="danger"
              onClick={() => void onDeleteAccount()}
              loading={deleting}
              disabled={!canDelete || deleting}
            >
              Permanently delete
            </Button>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setOpen(false);
                setText("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
