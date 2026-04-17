import Link from "next/link";
import { Button } from "@/components/ui/button";

const summaryCards = [
  {
    label: "Final score",
    value: "4,250",
    note: "Top result across the active room after the last kanji resolved.",
  },
  {
    label: "Correct answers",
    value: "34 / 40",
    note: "Strong consistency through the closing rounds with only a few late misses.",
  },
  {
    label: "Average speed",
    value: "11.2s",
    note: "Response timing stayed inside the standard 15-second profile.",
  },
];

const ranking = [
  { rank: 1, name: "Guest player", score: "4,250", status: "Top room score", active: true },
  { rank: 2, name: "Alex M.", score: "3,900", status: "+350 behind" },
  { rank: 3, name: "Sara K.", score: "3,120", status: "+1,130 behind" },
  { rank: 4, name: "Kenji T.", score: "2,840", status: "+1,410 behind" },
];

const roundBreakdown = [
  {
    label: "Best streak",
    value: "9 rounds",
    description: "Longest uninterrupted run of correct readings before the final scoreboard lock.",
  },
  {
    label: "Fastest answer",
    value: "4.1 seconds",
    description: "Quickest completed prompt during the middle phase of the session.",
  },
  {
    label: "Review queue",
    value: "6 kanji",
    description: "Prompts worth revisiting before the next competitive room begins.",
  },
];

export default function ResultsPage() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-8 lg:px-10 lg:py-10">
      <div className="space-y-10">
        <div className="space-y-4 border-b border-[var(--color-outline-variant)] pb-8">
          <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            Session / Results
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-5xl font-bold leading-none tracking-tight text-[var(--color-primary)] lg:text-6xl">
                Final results
              </h1>
              <p className="max-w-2xl text-sm leading-7 tracking-[0.02em] text-[var(--color-secondary)]">
                Review the final scoreboard, inspect standout moments from the last session, and choose the next practice route.
              </p>
            </div>
            <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Room BK22 complete
            </div>
          </div>
        </div>

        <div className="grid gap-px border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)] xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className="bg-[var(--color-surface-container-lowest)] p-6 lg:p-7">
            <div className="space-y-8">
              <div className="space-y-5 border-b border-[var(--color-outline-variant)] pb-6">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Winner summary
                </p>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex h-24 w-24 items-center justify-center border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] font-[family-name:var(--font-headline)] text-4xl text-[var(--color-primary)]">
                      1
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-semibold text-[var(--color-primary)]">
                        Top room finish
                      </h2>
                      <p className="text-sm text-[var(--color-secondary)]">
                        Highest score in the room after 40 timed prompts.
                      </p>
                    </div>
                  </div>
                  <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                    Highest score this round
                  </div>
                </div>
              </div>

              <div className="grid gap-px border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)] md:grid-cols-3">
                {summaryCards.map((item) => (
                  <article
                    key={item.label}
                    className="bg-[var(--color-surface-container-low)] p-5"
                  >
                    <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                      {item.label}
                    </p>
                    <p className="mt-4 text-3xl font-semibold text-[var(--color-primary)]">
                      {item.value}
                    </p>
                    <p className="mt-3 text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">
                      {item.note}
                    </p>
                  </article>
                ))}
              </div>

              <div className="space-y-4">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Final ranking
                </p>
                <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                  {ranking.map((entry) => (
                    <div
                      key={entry.rank}
                      className={entry.active
                        ? "flex flex-col gap-3 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                        : "flex flex-col gap-3 border-b border-[var(--color-outline-variant)] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"}
                    >
                      <div className="flex items-center gap-4">
                        <span className={entry.active
                          ? "w-6 text-lg font-bold text-[var(--color-primary)]"
                          : "w-6 text-lg font-bold text-[var(--color-secondary)]"}
                        >
                          {entry.rank}
                        </span>
                        <div className="space-y-1">
                          <h3 className={entry.active
                            ? "text-lg font-semibold text-[var(--color-primary)]"
                            : "text-lg font-semibold text-[var(--color-primary)]"}
                          >
                            {entry.name}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                            {entry.status}
                          </p>
                        </div>
                      </div>
                      <div className={entry.active
                        ? "text-2xl font-semibold text-[var(--color-primary)]"
                        : "text-2xl font-semibold text-[var(--color-secondary)]"}
                      >
                        {entry.score}
                      </div>
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
                  Round breakdown
                </p>
                <div className="space-y-3">
                  {roundBreakdown.map((item) => (
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
                  Next actions
                </p>
                <div className="space-y-3">
                  <Link href="/game/setup" className="block">
                    <Button variant="primary" className="w-full justify-between px-4 py-3">
                      <span>Start another room</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </Button>
                  </Link>
                  <Link href="/library" className="block">
                    <Button variant="secondary" className="w-full justify-between px-4 py-3">
                      <span>Review weak kanji in library</span>
                      <span className="material-symbols-outlined text-[20px]">menu_book</span>
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Exit path
                </p>
                <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
                  <p className="mb-4 text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">
                    Return to game setup and launch the next session when you are ready.
                  </p>
                  <Link href="/game/setup" className="block">
                    <Button variant="secondary" className="w-full px-4 py-3">
                      Back to game setup
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
