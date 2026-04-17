import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { Button } from "@/components/ui/button";

const preferenceGroups = [
  {
    label: "Practice cadence",
    value: "Focused review",
    description: "Short, repeatable rounds centered on high-frequency recall and recognition.",
  },
  {
    label: "Primary level",
    value: "JLPT N4",
    description: "Current study emphasis for guided sessions and curated library sets.",
  },
  {
    label: "Input mode",
    value: "Kana first",
    description: "Answer flow favors hiragana before broader mixed-input review sessions.",
  },
];

const sessionControls = [
  {
    label: "Room privacy",
    value: "Invite only",
    description: "New sessions default to controlled entry before broader multiplayer practice.",
  },
  {
    label: "Timer profile",
    value: "15 seconds",
    description: "Standard response window used across active kanji rounds.",
  },
  {
    label: "History visibility",
    value: "Expanded",
    description: "Completed prompts remain visible for quick review between turns.",
  },
];

export default async function SettingsPage() {
  const session = await auth();
  const displayName = session?.user?.name ?? "Guest session";
  const email = session?.user?.email ?? "Preferences save locally until you sign in.";

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-8 lg:px-10 lg:py-10">
      <div className="space-y-10">
        <div className="space-y-4 border-b border-[var(--color-outline-variant)] pb-8">
          <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            Session / Settings
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-5xl font-bold leading-none tracking-tight text-[var(--color-primary)] lg:text-6xl">
                Study settings
              </h1>
              <p className="max-w-2xl text-sm leading-7 tracking-[0.02em] text-[var(--color-secondary)]">
                Review practice defaults, keep your current session preferences visible, and optionally sign in to save them to your profile.
              </p>
            </div>
            <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Guest-ready settings
            </div>
          </div>
        </div>

        <div className="grid gap-px border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)] xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="bg-[var(--color-surface-container-lowest)] p-6 lg:p-7">
            <div className="space-y-8">
              <div className="space-y-5 border-b border-[var(--color-outline-variant)] pb-6">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Profile overview
                </p>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex h-20 w-20 items-center justify-center border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] font-[family-name:var(--font-headline)] text-3xl text-[var(--color-primary)]">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-semibold text-[var(--color-primary)]">
                        {displayName}
                      </h2>
                      <p className="text-sm text-[var(--color-secondary)]">{email}</p>
                    </div>
                  </div>
                  <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                    Current session
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Study preferences
                </p>
                <div className="space-y-3">
                  {preferenceGroups.map((item) => (
                    <div
                      key={item.label}
                      className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                          {item.label}
                        </h3>
                        <span className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                          {item.value}
                        </span>
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[var(--color-surface-container-lowest)] p-6 lg:p-7">
            <div className="space-y-8">
              <div className="space-y-4 border-b border-[var(--color-outline-variant)] pb-6">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Session defaults
                </p>
                <div className="space-y-3">
                  {sessionControls.map((item) => (
                    <div key={item.label} className="space-y-2 border-b border-[var(--color-outline-variant)] pb-4 last:border-b-0 last:pb-0">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                          {item.label}
                        </h3>
                        <span className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                          {item.value}
                        </span>
                      </div>
                      <p className="text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-b border-[var(--color-outline-variant)] pb-6">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Account options
                </p>
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full justify-between px-4 py-3">
                    <span>Connect a sign-in method</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Button>
                  <Button variant="secondary" className="w-full justify-between px-4 py-3">
                    <span>Review saved session history</span>
                    <span className="material-symbols-outlined text-[20px]">history</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Session action
                </p>
                <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
                  <p className="mb-4 text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">
                    {session?.user
                      ? "Sign out and return to the guest flow at any time."
                      : "You are browsing settings as a guest. Sign in when you want to save these preferences to a profile."}
                  </p>
                  {session?.user ? (
                    <SignOutButton />
                  ) : (
                    <Link href="/sign-in">
                      <Button variant="secondary" className="w-full px-4 py-3">
                        Sign in to save preferences
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
