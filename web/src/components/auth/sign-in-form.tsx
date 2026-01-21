"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = useMemo(() => email.trim(), [email]);

  async function onGoogle() {
    setError(null);
    setBusy("google");
    await signIn("google", { callbackUrl: "/" });
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy("email");
    await signIn("email", { email: trimmedEmail, callbackUrl: "/" });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onGoogle}
        disabled={busy !== null}
        className="w-full rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
      >
        {busy === "google" ? "Connecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-500">or</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={onEmail} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-neutral-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy !== null}
            placeholder="you@example.com"
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={busy !== null}
          className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {busy === "email" ? "Sending…" : "Email me a sign-in link"}
        </button>

        <p className="text-xs text-neutral-500">
          We’ll email you a one-time sign-in link.
        </p>
      </form>
    </div>
  );
}
