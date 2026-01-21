import Link from "next/link";

import { auth } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-dvh bg-white text-neutral-950">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-6">
        <div className="text-sm font-semibold tracking-tight">GALAXY</div>

        {session?.user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/feed"
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            >
              Feed
            </Link>
            <div className="text-xs text-neutral-600">
              {session.user.email ?? session.user.name ?? "Signed in"}
            </div>
            <SignOutButton />
          </div>
        ) : (
          <Link
            href="/signin"
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Sign in
          </Link>
        )}
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Photography-first.</h1>
        <p className="mt-3 max-w-prose text-sm leading-6 text-neutral-600">
          High-quality photos, chronological feed, and genre-based exploration.
        </p>

        {!session?.user ? (
          <div className="mt-8">
            <Link
              href="/signin"
              className="inline-flex rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            >
              Get started
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
