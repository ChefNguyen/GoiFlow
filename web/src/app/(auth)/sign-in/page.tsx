import { Suspense } from "react";
import { SignInCard, AuthProviderOption } from "@/features/auth/components/sign-in-card";

function SignInFallback() {
  return (
    <main className="flex min-h-screen flex-grow items-center justify-center bg-[var(--color-surface)] p-6">
      <div className="relative w-full max-w-[480px] bg-[var(--color-surface-container-lowest)] p-12 text-center text-[var(--color-secondary)]">
        Loading...
      </div>
    </main>
  );
}

export default function SignInPage() {
  const providers: AuthProviderOption[] = [
    { id: "credentials", label: "Email / OTP", type: "credentials" },
    { id: "google", label: "Google", type: "oauth" },
    { id: "facebook", label: "Facebook", type: "oauth" },
  ];

  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInCard providers={providers} />
    </Suspense>
  );
}
