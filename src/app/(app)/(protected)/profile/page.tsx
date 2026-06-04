import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getUserProfileStats,
  getUserRecentSessions,
} from "@/server/services/profile-service";
import AvatarUpload from "./avatar-upload";

const cellClassMap = {
  empty: "border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)]",
  light: "bg-[var(--color-surface-tint)] opacity-20",
  mid: "bg-[var(--color-surface-tint)] opacity-40",
  medium: "bg-[var(--color-primary)] opacity-60",
  strong: "bg-[var(--color-primary)] opacity-100",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [profileStats, recentSessions] = await Promise.all([
    getUserProfileStats(session.user.id),
    getUserRecentSessions(session.user.id, 5),
  ]);

  const stats = [
    {
      label: "Total Vocabulary Mastered",
      value: profileStats.totalVocabularyMastered.toLocaleString(),
      suffix: "",
      icon: "menu_book",
      filled: false,
    },
    {
      label: "Current Streak",
      value: String(profileStats.currentStreak),
      suffix: "Days",
      icon: "local_fire_department",
      filled: true,
    },
    {
      label: "Accuracy Rate",
      value: String(profileStats.accuracyRate),
      suffix: "%",
      icon: "done_all",
      filled: false,
    },
  ];

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-6 md:flex-row md:items-end">
          <AvatarUpload
            initialAvatarUrl={profileStats.avatarUrl}
            avatarInitial={profileStats.avatarInitial}
            displayName={profileStats.displayName}
          />

          <div className="flex flex-col gap-2">
            <h1 className="font-[family-name:var(--font-headline)] text-3xl font-bold tracking-tight text-[var(--color-primary)] md:text-5xl">
              {profileStats.displayName}
            </h1>
            <p className="font-[family-name:var(--font-label)] text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Level {profileStats.level} · {profileStats.rank}
            </p>
          </div>

          <div className="md:ml-auto md:mt-0 mt-4 flex gap-4">
            <button
              type="button"
              className="flex items-center gap-2 border border-[var(--color-primary)] bg-[var(--color-primary)] px-6 py-3 font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-on-primary)] transition-none hover:bg-[var(--color-primary-container)]"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Profile
            </button>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-6 font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)]">
            Current Standing
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className={
                  stat.filled
                    ? "relative flex flex-col border border-[var(--color-primary)] bg-[var(--color-surface-container-lowest)] p-8 transition-none hover:bg-[var(--color-surface-container)]"
                    : "relative flex flex-col border border-[var(--color-primary)] bg-[var(--color-surface-container-low)] p-8 transition-none hover:bg-[var(--color-surface-container)]"
                }
              >
                <span className="mb-4 font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  {stat.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-headline)] text-6xl font-bold text-[var(--color-primary)]">
                    {stat.value}
                  </span>
                  {stat.suffix ? (
                    <span
                      className={
                        stat.suffix === "%"
                          ? "font-[family-name:var(--font-headline)] text-xl text-[var(--color-secondary)]"
                          : "font-[family-name:var(--font-label)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]"
                      }
                    >
                      {stat.suffix}
                    </span>
                  ) : null}
                </div>
                <div className="absolute right-0 bottom-0 p-4 opacity-10">
                  <span className="material-symbols-outlined text-6xl">{stat.icon}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Heatmap ──────────────────────────────────────────────────── */}
        <section>
          <div className="mb-6 flex items-end justify-between border-b border-[var(--color-outline-variant)] pb-2">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)]">
              Study Consistency
            </h2>
            <span className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Last 12 Weeks
            </span>
          </div>

          <div className="overflow-x-auto border border-[var(--color-outline)] bg-[var(--color-surface-container-lowest)] p-6">
            <div className="flex min-w-[600px] gap-1">
              {profileStats.heatmapColumns.map((column, index) => (
                <div key={index} className="flex flex-col gap-1">
                  {column.map((cell, cellIndex) => (
                    <div
                      key={cellIndex}
                      className={`h-4 w-4 ${cellClassMap[cell as keyof typeof cellClassMap]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-[var(--color-secondary)]">
              <span>Less</span>
              <div className="h-3 w-3 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)]" />
              <div className="h-3 w-3 bg-[var(--color-surface-tint)] opacity-20" />
              <div className="h-3 w-3 bg-[var(--color-primary)] opacity-60" />
              <div className="h-3 w-3 bg-[var(--color-primary)] opacity-100" />
              <span>More</span>
            </div>
          </div>
        </section>

        {/* ── Recent Sessions ──────────────────────────────────────────── */}
        <section>
          <div className="mb-6 flex items-end justify-between border-b border-[var(--color-outline-variant)] pb-2">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)]">
              Recent Sessions
            </h2>
            <a
              href="/history"
              className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-primary)] underline-offset-4 hover:underline"
            >
              View All History
            </a>
          </div>

          <div className="flex w-full flex-col border-t border-[var(--color-primary)]">
            {recentSessions.length === 0 ? (
              <p className="py-8 text-center font-[family-name:var(--font-label)] text-sm text-[var(--color-secondary)]">
                No sessions yet. Play your first game to see your history here!
              </p>
            ) : (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col items-start border-b border-[var(--color-outline-variant)] px-4 py-4 transition-none hover:bg-[var(--color-surface-container)] md:flex-row md:items-center"
                >
                  <div className="w-24 shrink-0 font-[family-name:var(--font-label)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                    {session.date}
                  </div>
                  <div className="flex flex-grow items-center gap-4">
                    <span
                      className="material-symbols-outlined text-[var(--color-secondary)]"
                      style={{ fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' }}
                    >
                      {session.icon}
                    </span>
                    <div>
                      <p className="font-medium text-[var(--color-primary)]">{session.title}</p>
                      <p className="text-sm text-[var(--color-secondary)]">{session.subtitle}</p>
                    </div>
                  </div>
                  <div className="mt-2 shrink-0 text-right md:mt-0 md:w-32">
                    <span className="block font-medium text-[var(--color-primary)]">{session.score}</span>
                    <span className="text-xs text-[var(--color-secondary)]">{session.xp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
