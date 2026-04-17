"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface AuthProviderOption {
  id: string;
  label: string;
}

export function SignInCard({ providers }: { providers: AuthProviderOption[] }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to save your profile, preferences, and study history. You can start playing without logging in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {providers.length > 0 ? (
          providers.map((provider) => (
            <Button
              key={provider.id}
              className="w-full"
              variant="secondary"
              onClick={() => signIn(provider.id, { callbackUrl: "/game/setup" })}
            >
              Continue with {provider.label}
            </Button>
          ))
        ) : (
          <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
            No OAuth provider is enabled yet. Add provider credentials to `.env`
            before using interactive sign-in.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
