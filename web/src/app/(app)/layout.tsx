import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/shared/app-shell";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/game/setup");
  }

  const avatarUrl: string | null = session.user.image ?? null;
  const displayName = session.user.name ?? session.user.email ?? "Learner";

  return (
    <AppShell
      session={session}
      avatarUrl={avatarUrl}
      displayName={displayName}
    >
      {children}
    </AppShell>
  );
}
