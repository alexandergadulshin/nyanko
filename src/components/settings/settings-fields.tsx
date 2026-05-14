"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const FIELD_BASE =
  "w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 ring-1 ring-inset ring-white/[0.08] transition-shadow focus:outline-none focus:ring-2 focus:ring-purple-400/70";

const FIELD_DISABLED = "opacity-50 cursor-not-allowed";

export function Field({
  label,
  hint,
  error,
  children,
  right,
}: {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </label>
        {right ? <span className="text-[11px] text-zinc-500">{right}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-rose-300">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", disabled, ...rest } = props;
  return (
    <input
      {...rest}
      disabled={disabled}
      className={`${FIELD_BASE} ${disabled ? FIELD_DISABLED : ""} ${className}`}
    />
  );
}

export function TextAreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`${FIELD_BASE} resize-none ${className}`}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <div className="relative">
      <select
        {...rest}
        className={`${FIELD_BASE} appearance-none pr-10 ${className}`}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
      >
        <path
          d="M6 8l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
