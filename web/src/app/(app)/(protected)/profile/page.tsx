import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

  let profileStats = {
    displayName: session.user.name || session.user.email || "Learner",
    avatarUrl: session.user.image || null,
    avatarInitial: (session.user.name || session.user.email || "L").charAt(0).toUpperCase(),
    level: 1,
    rank: "Bronze",
    totalVocabularyMastered: 0,
    currentStreak: 1,
    accuracyRate: 100,
    heatmapColumns: Array.from({ length: 12 }, () => Array.from({ length: 7 }, () => "empty")),
  };

  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${backendUrl}/user/profile`, {
      headers: { "Authorization": `Bearer ${session.user.id}` },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      profileStats = {
        ...profileStats,
        displayName: data.name || profileStats.displayName,
        avatarUrl: data.avatarUrl || profileStats.avatarUrl,
        level: data.level || 1,
        rank: data.rank || "Bronze",
        currentStreak: data.streakDays || 1,
      };
    }
  } catch {
    // fallback to defaults
  }

  const recentSessions: any[] = [];

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
        </section>

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
                    <span className="font-[family-name:var(--font-label)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]">
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
          </div>
        </section>
      </div>
    </main>
  );
}
