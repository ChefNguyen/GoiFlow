import { auth } from "@/auth";
import { AppShell } from "@/components/shared/app-shell";
import { prisma } from "@/server/db/client";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let avatarUrl: string | null = null;
  let displayName = "Learner";

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, name: true, email: true },
    });
    if (dbUser) {
      avatarUrl = dbUser.image;
      displayName = dbUser.name ?? dbUser.email ?? "Learner";
    }
  }

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
