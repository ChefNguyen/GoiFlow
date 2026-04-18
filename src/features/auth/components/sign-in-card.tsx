"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface AuthProviderOption {
  id: string;
  label: string;
}

export function SignInCard({ providers }: { providers: AuthProviderOption[] }) {
  const [showPassword, setShowPassword] = useState(false);

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

        <div className="space-y-8">
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
            >
              Username or Email
            </label>
            <Input
              id="identifier"
              type="text"
              placeholder="Enter your credentials"
              className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
            />
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label
                htmlFor="password"
                className="block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="font-[family-name:var(--font-body)] text-xs text-[var(--color-primary)] underline transition-none hover:text-[var(--color-secondary)]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
            />
          </div>

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
            <Button variant="primary" className="w-full py-4 text-sm tracking-widest !text-[var(--color-on-primary)]">
              Login
            </Button>
          </div>
        </div>

        <div className="my-8 flex items-center">
          <div className="flex-grow border-t border-[var(--color-outline-variant)]" />
          <span className="mx-4 flex-shrink-0 font-[family-name:var(--font-body)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
            Or
          </span>
          <div className="flex-grow border-t border-[var(--color-outline-variant)]" />
        </div>

        <div className="space-y-4">
          {providers.length > 0 ? (
            providers.map((provider) => (
              <Button
                key={provider.id}
                className="w-full py-4"
                variant="secondary"
                onClick={() => signIn(provider.id, { callbackUrl: "/game/setup" })}
              >
                Continue with {provider.label}
              </Button>
            ))
          ) : (
            <p className="text-sm leading-6 text-[var(--color-secondary)]">
              No OAuth provider is enabled yet. Add provider credentials to `.env`
              before using interactive sign-in.
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
