import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-neutral-600">
          Continue with Google or get a magic link by email.
        </p>
      </header>

      <SignInForm />

      <p className="text-xs text-neutral-500">
        By continuing, you agree to our terms and acknowledge our privacy policy.
      </p>
    </main>
  );
}
