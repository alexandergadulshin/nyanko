"use client";

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl bg-white/[0.025] px-4 py-3.5 ring-1 ring-inset ring-white/[0.05] transition-colors hover:bg-white/[0.04]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-100">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={
          "flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ring-1 ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 " +
          (disabled ? "opacity-40 cursor-not-allowed " : "") +
          (checked
            ? "bg-purple-500 ring-purple-400/40"
            : "bg-white/[0.08] ring-white/[0.08]")
        }
      >
        <span
          aria-hidden="true"
          className={
            "block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition-transform duration-200 " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </button>
    </div>
  );
}
