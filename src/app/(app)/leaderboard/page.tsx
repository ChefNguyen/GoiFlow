import { Button } from "@/components/ui/button";

const leaderboard = [
  { rank: 1, name: "Calligrapher", score: "12,420", streak: "18 wins", active: true },
  { rank: 2, name: "ZenMaster", score: "11,980", streak: "12 wins" },
  { rank: 3, name: "KanaPulse", score: "10,640", streak: "9 wins" },
  { rank: 4, name: "InkRunner", score: "9,880", streak: "6 wins" },
  { rank: 5, name: "SoraType", score: "9,210", streak: "5 wins" },
];

const summary = [
  { label: "Global rank", value: "#18", note: "Across all active Goi Furō players this month." },
  { label: "Best streak", value: "9 rooms", note: "Longest uninterrupted session win run." },
  { label: "Accuracy", value: "94%", note: "Average correctness across recent competitive rounds." },
];

export default function LeaderboardPage() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-8 lg:px-10 lg:py-10">
      <div className="space-y-10">
        <div className="space-y-4 border-b border-[var(--color-outline-variant)] pb-8">
          <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            Competitive / Leaderboard
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-5xl font-bold leading-none tracking-tight text-[var(--color-primary)] lg:text-6xl">
                Ranking board
              </h1>
              <p className="max-w-2xl text-sm leading-7 tracking-[0.02em] text-[var(--color-secondary)]">
                Compare active study performance, track recent streaks, and see where your current session rhythm places you.
              </p>
            </div>
            <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Monthly standings
            </div>
          </div>
        </div>

        <div className="grid gap-px border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)] xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="bg-[var(--color-surface-container-lowest)] p-6 lg:p-7">
            <div className="space-y-4">
              <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Top players
              </p>
              <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={entry.active
                      ? "flex flex-col gap-3 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                      : "flex flex-col gap-3 border-b border-[var(--color-outline-variant)] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"}
                  >
                    <div className="flex items-center gap-4">
                      <span className={entry.active ? "w-8 text-lg font-bold text-[var(--color-primary)]" : "w-8 text-lg font-bold text-[var(--color-secondary)]"}>
                        {entry.rank}
                      </span>
                      <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-[var(--color-primary)]">{entry.name}</h2>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">{entry.streak}</p>
                      </div>
                    </div>
                    <div className={entry.active ? "text-2xl font-semibold text-[var(--color-primary)]" : "text-2xl font-semibold text-[var(--color-secondary)]"}>
                      {entry.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[var(--color-surface-container-lowest)] p-6 lg:p-7">
            <div className="space-y-8">
              <div className="grid gap-px border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)]">
                {summary.map((item) => (
                  <article key={item.label} className="bg-[var(--color-surface-container-low)] p-5">
                    <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                      {item.label}
                    </p>
                    <p className="mt-4 text-3xl font-semibold text-[var(--color-primary)]">{item.value}</p>
                    <p className="mt-3 text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">{item.note}</p>
                  </article>
                ))}
              </div>

              <div className="space-y-3 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Next action
                </p>
                <Button variant="primary" className="w-full justify-between px-4 py-3">
                  <span>Start ranked session</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
