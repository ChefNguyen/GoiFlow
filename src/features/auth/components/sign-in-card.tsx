"use client";

import { useMemo, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface AuthProviderOption {
  id: string;
  label: string;
  type: "credentials" | "oauth";
}

function getSafeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/game/setup";
  return value;
}

export function SignInCard({ providers }: { providers: AuthProviderOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => getSafeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams],
  );
  const credentialsProvider = providers.find((provider) => provider.type === "credentials");
  const oauthProviders = providers.filter((provider) => provider.type === "oauth");
  // Credentials provider is always enabled — this guard only fires if somehow misconfigured
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!credentialsProvider) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signIn(credentialsProvider.id, {
        identifier,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-grow items-center justify-center bg-[var(--color-surface)] p-6">
      <div className="relative w-full max-w-[480px] bg-[var(--color-surface-container-lowest)] p-12">
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-[var(--color-primary)]" />

        <header className="mb-12 text-center">
          <h1 className="mb-2 font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)]">
            Login
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            語彙フロー
          </p>
        </header>

        {credentialsProvider ? (
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
              >
                Username or Email
              </label>
              <Input
                id="identifier"
                name="identifier"
                type="email"
                autoComplete="email"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="you@example.com"
                className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 pr-10 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-primary)] transition-none hover:text-[var(--color-secondary)]"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <label htmlFor="remember-me" className="flex cursor-pointer items-center space-x-3">
                <Checkbox id="remember-me" />
                <span className="font-[family-name:var(--font-body)] text-sm text-[var(--color-primary)]">Remember Me</span>
              </label>
              <Link
                href="/sign-in"
                className="font-[family-name:var(--font-body)] text-sm text-[var(--color-primary)] underline transition-none hover:text-[var(--color-secondary)]"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-4 text-sm tracking-widest !text-[var(--color-on-primary)]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm leading-6 text-[var(--color-secondary)]">
            Password sign-in is not available. Use an OAuth provider below.
          </p>
        )}

        <div className="my-8 flex items-center">
          <div className="flex-grow border-t border-[var(--color-outline-variant)]" />
          <span className="mx-4 flex-shrink-0 font-[family-name:var(--font-body)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
            Or
          </span>
          <div className="flex-grow border-t border-[var(--color-outline-variant)]" />
        </div>

        <div className="space-y-4">
          {oauthProviders.length > 0 ? (
            oauthProviders.map((provider) => (
              <Button
                key={provider.id}
                className="w-full py-4"
                variant="secondary"
                onClick={() => signIn(provider.id, { callbackUrl })}
              >
                Continue with {provider.label}
              </Button>
            ))
          ) : (
            <p className="text-sm leading-6 text-[var(--color-secondary)]">
              No OAuth provider is enabled yet. Add provider credentials to `.env`
              before using interactive OAuth sign-in.
            </p>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)]">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-[var(--color-primary)] underline transition-none hover:text-[var(--color-secondary)]">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
