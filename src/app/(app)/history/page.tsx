import { Button } from "@/components/ui/button";

const filters = [
  { label: "All", active: true },
  { label: "Shiritori" },
  { label: "Kanji Game" },
];

const historyEntries = [
  { kanji: "猫", reading: "ねこ", meaning: "Cat", correct: true },
  { kanji: "桜", reading: "さくら", meaning: "Cherry Blossom", correct: true, active: true },
  { kanji: "犬", reading: "いぬ", meaning: "Dog", correct: true },
  { kanji: "鳥", reading: "とり", meaning: "Bird", correct: true },
  { kanji: "魚", reading: "さかな", meaning: "Fish", correct: false },
];

const exampleEntries = [
  { term: "桜吹雪", reading: "さくらふぶき", meaning: "falling cherry blossoms" },
  { term: "夜桜", reading: "よざくら", meaning: "cherry blossoms at night" },
];

export default function HistoryPage() {
  return (
    <div className="relative flex h-[calc(100vh-65px)] w-full overflow-hidden bg-[var(--color-surface)]">
      <main className="flex-1 overflow-hidden px-6 py-10 lg:pr-[404px] lg:pl-12">
        <div className="scrollbar-subtle scrollbar-gutter-stable h-full overflow-y-auto pr-2">
          <header className="mb-12">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="mb-2 font-[family-name:var(--font-headline)] text-4xl font-bold text-[var(--color-primary)]">
                Session Archive
              </h1>
              <p className="font-[family-name:var(--font-body)] text-sm uppercase tracking-[0.12em] text-[var(--color-secondary)]">
                October 24, 2023 — 42 Items Reviewed
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => (
                <Button
                  key={filter.label}
                  variant={filter.active ? "primary" : "secondary"}
                  className="px-4 py-2 text-xs tracking-widest"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </header>

          <section className="w-full border-t-2 border-[var(--color-primary)]">
            <div className="hidden items-center border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)] md:flex">
              <div className="w-32">Kanji</div>
              <div className="flex-1">Reading</div>
              <div className="flex-1">Meaning</div>
              <div className="w-24 text-right">Result</div>
            </div>

            <div className="flex flex-col">
              {historyEntries.map((entry) => (
                <div
                  key={entry.kanji}
                  className={entry.active
                    ? "relative flex cursor-pointer flex-col border-b border-[var(--color-outline-variant)] border-l-4 border-[var(--color-primary)] bg-[var(--color-surface-container-highest)] py-5 pl-3 pr-4 transition-none md:flex-row md:items-center"
                    : "flex cursor-pointer flex-col border-b border-[var(--color-outline-variant)] px-4 py-5 transition-none hover:bg-[var(--color-surface-container)] md:flex-row md:items-center"}
                >
                  {entry.active ? <div className="absolute bottom-0 left-0 top-0 w-1 bg-[var(--color-primary)]" /> : null}
                  <div className="w-32 shrink-0 pl-4 font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)] md:group-hover:pl-6">
                    {entry.kanji}
                  </div>
                  <div
                    className={entry.active
                      ? "flex-1 font-[family-name:var(--font-body)] text-lg font-medium text-[var(--color-primary)]"
                      : "flex-1 font-[family-name:var(--font-body)] text-lg text-[var(--color-secondary)]"}
                  >
                    {entry.reading}
                  </div>
                  <div
                    className={entry.active
                      ? "flex-1 font-[family-name:var(--font-body)] text-lg font-medium text-[var(--color-primary)]"
                      : "flex-1 font-[family-name:var(--font-body)] text-lg text-[var(--color-primary)]"}
                  >
                    {entry.meaning}
                  </div>
                  <div className="w-24 shrink-0 text-right md:pr-4">
                    <span
                      className={entry.correct
                        ? entry.active
                          ? "material-symbols-outlined text-[var(--color-primary)]"
                          : "material-symbols-outlined text-[var(--color-outline)]"
                        : "material-symbols-outlined text-[var(--color-primary)]"}
                      style={entry.active ? { fontVariationSettings: '"FILL" 1' } : undefined}
                    >
                      {entry.correct ? (entry.active ? "check_circle" : "check") : "close"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <aside className="hidden h-full w-[380px] shrink-0 border-l border-[var(--color-primary)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="scrollbar-subtle-strong scrollbar-gutter-stable flex h-full flex-col overflow-y-auto p-8">
          <header className="mb-12 shrink-0">
            <div className="mb-3 border-b-2 border-[var(--color-primary)] pb-3 font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-primary)]">
              語彙詳細
            </div>
            <div className="font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-secondary)]">
              Word Marginalia
            </div>
          </header>

          <div className="mb-16 shrink-0 flex flex-col items-center border-b border-[var(--color-outline-variant)] pb-12">
            <div className="mb-6 font-[family-name:var(--font-headline)] text-[8rem] font-bold leading-none text-[var(--color-primary)]">
              桜
            </div>
            <div className="mb-4 font-[family-name:var(--font-body)] text-2xl tracking-[0.3em] text-[var(--color-secondary)]">
              さくら
            </div>
            <div className="border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2 font-[family-name:var(--font-label)] text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">
              Cherry Blossom
            </div>
          </div>

          <div className="min-h-0 flex-1 pr-2">
            <div className="flex flex-col">
              <section className="mb-12">
                <h2 className="mb-6 flex items-center border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  <span className="material-symbols-outlined mr-2 text-[20px]">info</span>
                  Overview
                </h2>
                <div className="font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
                  <div className="mb-3 flex justify-between border-b border-[var(--color-outline-variant)] pb-2">
                    <span>Hán Việt</span>
                    <span className="text-[var(--color-outline)]">01</span>
                  </div>
                </div>
                <div className="font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)]">Anh</div>
              </section>

              <section className="mb-12">
                <h2 className="mb-6 flex items-center border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  <span className="material-symbols-outlined mr-2 text-[20px]">menu_book</span>
                  Meanings
                </h2>
                <ol className="list-inside list-decimal space-y-2 font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-primary)]">
                  <li>Cherry Blossom</li>
                  <li>Cherry Tree</li>
                </ol>
              </section>

              <section className="mb-12">
                <h2 className="mb-6 flex items-center border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  <span className="material-symbols-outlined mr-2 text-[20px]">category</span>
                  Radicals
                </h2>
                <div className="mb-3 flex justify-between border-b border-[var(--color-outline-variant)] pb-2 font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
                  <span>Main Radical</span>
                  <span className="text-[var(--color-outline)]">02</span>
                </div>
                <div className="mt-4 flex items-center space-x-6">
                  <div className="flex h-16 w-16 items-center justify-center border-2 border-[var(--color-primary)] bg-[var(--color-surface)] font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)]">
                    木
                  </div>
                  <div>
                    <div className="mb-1 font-[family-name:var(--font-body)] text-lg font-bold text-[var(--color-primary)]">Tree</div>
                    <div className="font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)]">Kihen (75)</div>
                  </div>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="mb-6 flex items-center border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  <span className="material-symbols-outlined mr-2 text-[20px]">draw</span>
                  Stroke Order
                </h2>
                <div className="mb-3 flex justify-between border-b border-[var(--color-outline-variant)] pb-2 font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
                  <span>Strokes</span>
                  <span className="text-[var(--color-outline)]">03</span>
                </div>
                <div className="font-[family-name:var(--font-headline)] text-4xl font-bold text-[var(--color-primary)]">10</div>
              </section>

              <section className="mb-12">
                <h2 className="mb-6 flex items-center border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  <span className="material-symbols-outlined mr-2 text-[20px]">format_list_bulleted</span>
                  Examples
                </h2>
                <div className="space-y-6">
                  {exampleEntries.map((example) => (
                    <div key={example.term} className="border-l-2 border-[var(--color-outline-variant)] pl-4">
                      <div className="mb-1 font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-primary)]">
                        {example.term}
                      </div>
                      <div className="mb-1 font-[family-name:var(--font-body)] text-sm tracking-[0.18em] text-[var(--color-secondary)]">
                        {example.reading}
                      </div>
                      <div className="font-[family-name:var(--font-body)] text-sm text-[var(--color-primary)]">
                        {example.meaning}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="mt-4 shrink-0 border-t-2 border-[var(--color-primary)] pt-6">
            <Button variant="primary" className="w-full py-4 text-sm tracking-widest">
              View Full Entry
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
