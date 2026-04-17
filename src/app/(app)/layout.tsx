import { auth } from "@/auth";
import { AppShell } from "@/components/shared/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return <AppShell session={session}>{children}</AppShell>;
}
