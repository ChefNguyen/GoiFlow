import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set up first access</CardTitle>
        <CardDescription>
          Use this surface later for invite acceptance, org bootstrap, or
          self-serve onboarding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-[var(--color-ink-soft)]">
        <p>
          The starter keeps sign-up intentionally light. Product onboarding flow
          belongs in docs/product before it turns into business logic.
        </p>
        <Link href="/sign-in" className={buttonStyles("secondary", "w-full")}>
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
