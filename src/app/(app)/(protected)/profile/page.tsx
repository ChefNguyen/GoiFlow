const statCards = [
  { label: "Rooms played", value: "128", note: "Completed across quiz and head-to-head practice." },
  { label: "Words mastered", value: "1,240", note: "Stable recall across saved study groups and live sessions." },
  { label: "Current focus", value: "JLPT N3", note: "Main study band used for recent competitive rounds." },
];

const activity = [
  { label: "Accuracy trend", value: "+6%", description: "Improved over the last ten rooms after shorter review cycles." },
  { label: "Fastest response", value: "3.8s", description: "Best recorded answer speed in active kanji sessions." },
  { label: "Saved sets", value: "14", description: "Pinned collections used as the primary review queue." },
];

export default function ProfilePage() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-8 lg:px-10 lg:py-10">
      <div className="space-y-10">
        <div className="space-y-4 border-b border-[var(--color-outline-variant)] pb-8">
          <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            Profile / Stats
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-5xl font-bold leading-none tracking-tight text-[var(--color-primary)] lg:text-6xl">
                Study profile
              </h1>
              <p className="max-w-2xl text-sm leading-7 tracking-[0.02em] text-[var(--color-secondary)]">
                Review long-form progress, recent study signals, and the metrics shaping your next focused practice cycle.
              </p>
            </div>
            <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Active learner profile
            </div>
          </div>
        </div>

        <div className="grid gap-px border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)] xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className="bg-[var(--color-surface-container-lowest)] p-6 lg:p-7">
            <div className="space-y-8">
              <div className="space-y-5 border-b border-[var(--color-outline-variant)] pb-6">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Profile overview
                </p>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex h-20 w-20 items-center justify-center border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] font-[family-name:var(--font-headline)] text-3xl text-[var(--color-primary)]">
                      C
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-semibold text-[var(--color-primary)]">Calligrapher</h2>
                      <p className="text-sm text-[var(--color-secondary)]">Competitive vocabulary learner</p>
                    </div>
                  </div>
                  <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                    Ranked profile
                  </div>
                </div>
              </div>

              <div className="grid gap-px border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)] md:grid-cols-3">
                {statCards.map((card) => (
                  <article key={card.label} className="bg-[var(--color-surface-container-low)] p-5">
                    <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">{card.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-[var(--color-primary)]">{card.value}</p>
                    <p className="mt-3 text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">{card.note}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[var(--color-surface-container-lowest)] p-6 lg:p-7">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Activity signals
                </p>
                <div className="space-y-3">
                  {activity.map((item) => (
                    <div key={item.label} className="space-y-2 border-b border-[var(--color-outline-variant)] pb-4 last:border-b-0 last:pb-0">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold text-[var(--color-primary)]">{item.label}</h3>
                        <span className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">{item.value}</span>
                      </div>
                      <p className="text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
