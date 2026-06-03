"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getSafeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/game/setup";
  return value;
}

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        // Account created but auto-login failed — redirect to sign-in page
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
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
            Create Account
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            語彙フロー
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="name"
              className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
            >
              Display Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
            />
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
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

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
            >
              Confirm Password
            </label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
            />
          </div>

          {error && (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-4 text-sm tracking-widest !text-[var(--color-on-primary)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </div>
        </form>

        <div className="mt-10 text-center">
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)]">
            Already have an account?{" "}
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-[var(--color-primary)] underline transition-none hover:text-[var(--color-secondary)]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
