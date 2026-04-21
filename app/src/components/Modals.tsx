"use client";

import { useState, useCallback, useEffect } from "react";

// ── Confirm Modal ──────────────────────────────────────────────────────────

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

let _setConfirm: ((state: ConfirmState | null) => void) | null = null;

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    _setConfirm?.({ ...opts, resolve });
  });
}

export function ConfirmModal() {
  const [state, setState] = useState<ConfirmState | null>(null);
  useEffect(() => {
    _setConfirm = setState;
  }, []);

  const handleClose = useCallback((result: boolean) => {
    state?.resolve(result);
    setState(null);
  }, [state]);

  if (!state) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => handleClose(false)} />
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border border-surface-container/50 animate-[fadeIn_0.2s_ease]">
        <h2 id="confirm-title" className="font-[var(--font-headline)] font-bold text-xl mb-2">{state.title}</h2>
        <p className="text-secondary text-sm leading-relaxed mb-8">{state.message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => handleClose(false)}
            className="flex-1 py-3 bg-surface-container-low rounded-xl font-bold text-sm text-secondary hover:bg-surface-container-high transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => handleClose(true)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
              state.danger
                ? "bg-error text-white hover:opacity-90"
                : "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:opacity-90"
            }`}
          >
            {state.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Prompt Modal ──────────────────────────────────────────────────────────

interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
}

interface PromptState extends PromptOptions {
  resolve: (value: string | null) => void;
}

let _setPrompt: ((state: PromptState | null) => void) | null = null;

export function prompt(opts: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    _setPrompt?.({ ...opts, resolve });
  });
}

export function PromptModal() {
  const [state, setState] = useState<PromptState | null>(null);
  const [value, setValue] = useState("");
  useEffect(() => {
    _setPrompt = (s) => { setState(s); setValue(s?.defaultValue ?? ""); };
  }, []);

  const handleClose = useCallback((submit: boolean) => {
    state?.resolve(submit && value.trim() ? value.trim() : null);
    setState(null);
    setValue("");
  }, [state, value]);

  if (!state) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => handleClose(false)} />
      <div role="dialog" aria-modal="true" aria-labelledby="prompt-title" className="relative bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border border-surface-container/50 animate-[fadeIn_0.2s_ease]">
        <h2 id="prompt-title" className="font-[var(--font-headline)] font-bold text-xl mb-2">{state.title}</h2>
        {state.message && <p className="text-secondary text-sm mb-4">{state.message}</p>}
        <input
          autoFocus
          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-6"
          value={value}
          placeholder={state.placeholder ?? ""}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleClose(true)}
        />
        <div className="flex gap-3">
          <button
            onClick={() => handleClose(false)}
            className="flex-1 py-3 bg-surface-container-low rounded-xl font-bold text-sm text-secondary hover:bg-surface-container-high transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => handleClose(true)}
            disabled={!value.trim()}
            className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {state.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
