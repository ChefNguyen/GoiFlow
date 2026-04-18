"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const jlptFilters = [
  { label: "N5 (Beginner)", checked: false },
  { label: "N4 (Basic)", checked: true },
  { label: "N3 (Intermediate)", checked: false },
  { label: "N2 (Pre-Advanced)", checked: false },
  { label: "N1 (Advanced)", checked: false },
];

const categoryFilters = [
  { label: "Radicals", icon: "category", active: true },
  { label: "Frequency", icon: "sort", active: false },
  { label: "Saved", icon: "favorite", active: false },
];

const entries = [
  { level: "N4", kanji: "心", reading: "kokoro", meaning: "heart, mind, spirit" },
  { level: "N4", kanji: "水", reading: "mizu", meaning: "water" },
  { level: "N4", kanji: "木", reading: "ki", meaning: "tree, wood" },
  { level: "N4", kanji: "火", reading: "hi", meaning: "fire" },
  { level: "N4", kanji: "土", reading: "tsuchi", meaning: "earth, soil" },
  { level: "N4", kanji: "金", reading: "kane", meaning: "gold, money" },
  { level: "N4", kanji: "日", reading: "hi", meaning: "sun, day" },
  { level: "N4", kanji: "月", reading: "tsuki", meaning: "moon, month" },
  { level: "N4", kanji: "門", reading: "mon", meaning: "gates" },
  { level: "N4", kanji: "雨", reading: "ame", meaning: "rain" },
];

export default function LibraryPage() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)]">
      <div className="flex min-h-[calc(100vh-65px)] flex-col md:flex-row">
        <aside className="hidden w-full shrink-0 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-6 md:flex md:w-[320px] md:flex-col md:overflow-y-auto">
          <h2 className="mb-8 font-[family-name:var(--font-headline)] text-3xl text-[var(--color-primary)] tracking-[0.02em]">
            Filters
          </h2>

          <div className="mb-8">
            <h3 className="mb-4 font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              JLPT Level
            </h3>
            <div className="flex flex-col gap-2">
              {jlptFilters.map((filter) => (
                <label
                  key={filter.label}
                  className="flex cursor-pointer items-center gap-3 border border-transparent p-2 transition-none hover:border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)]"
                >
                  <Checkbox defaultChecked={filter.checked} />
                  <span className={filter.checked ? "text-base font-medium text-[var(--color-primary)]" : "text-base text-[var(--color-on-surface)]"}>
                    {filter.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-4 font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Category
            </h3>
            <div className="flex flex-col gap-2">
              {categoryFilters.map((filter) => (
                <label
                  key={filter.label}
                  className={filter.active
                    ? "flex cursor-pointer items-center gap-3 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] p-2 transition-none"
                    : "flex cursor-pointer items-center gap-3 border border-transparent p-2 transition-none hover:border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)]"}
                >
                  <span className="material-symbols-outlined text-[20px]">{filter.icon}</span>
                  <span className={filter.active ? "text-base font-medium text-[var(--color-primary)]" : "text-base text-[var(--color-on-surface)]"}>
                    {filter.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button variant="primary" className="mt-auto px-4 py-3">
            Apply Filters
          </Button>
        </aside>

        <section className="flex-1 overflow-y-auto bg-[var(--color-surface)] p-6 md:p-8">
          <header className="mb-12 flex flex-col gap-6 border-b-2 border-[var(--color-primary)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 font-[family-name:var(--font-headline)] text-4xl font-bold text-[var(--color-primary)]">
                Kanji Library
              </h1>
              <p className="text-base tracking-[0.02em] text-[var(--color-secondary)]">
                Showing results for N4 Radicals
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-primary)]">
                142
              </span>
              <span className="ml-0 block font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)] sm:ml-2 sm:inline">
                Entries Found
              </span>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {entries.map((entry) => (
              <article
                key={entry.kanji}
                className="group relative flex cursor-pointer flex-col border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-6 transition-none hover:bg-[var(--color-surface-container-low)]"
              >
                <div className="absolute top-3 right-3 border border-[var(--color-primary)] px-2 py-1">
                  <span className="text-[0.65rem] font-bold text-[var(--color-primary)]">{entry.level}</span>
                </div>
                <div className="flex flex-1 items-center justify-center py-8">
                  <span className="font-[family-name:var(--font-headline)] text-[4rem] font-bold text-[var(--color-primary)] transition-transform duration-75 group-hover:scale-105">
                    {entry.kanji}
                  </span>
                </div>
                <div className="mt-auto border-t border-[var(--color-outline-variant)] pt-4">
                  <h2 className="mb-1 text-base font-medium text-[var(--color-primary)]">{entry.reading}</h2>
                  <p className="text-sm text-[var(--color-secondary)]">{entry.meaning}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              className="border border-[var(--color-outline-variant)] bg-transparent px-4 py-2 text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
            >
              <span className="material-symbols-outlined mr-1 align-middle text-[20px]">chevron_left</span>
              <span className="align-middle font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em]">Prev</span>
            </button>
            <div className="flex gap-2 font-[family-name:var(--font-headline)]">
              <button type="button" className="flex h-10 w-10 items-center justify-center border border-transparent hover:bg-[var(--color-surface-container)]">1</button>
              <button type="button" className="flex h-10 w-10 items-center justify-center border border-[var(--color-primary)] bg-[var(--color-primary)] font-bold text-[var(--color-on-primary)]">2</button>
              <button type="button" className="flex h-10 w-10 items-center justify-center border border-transparent hover:bg-[var(--color-surface-container)]">3</button>
              <span className="flex h-10 w-10 items-center justify-center text-[var(--color-secondary)]">...</span>
              <button type="button" className="flex h-10 w-10 items-center justify-center border border-transparent hover:bg-[var(--color-surface-container)]">15</button>
            </div>
            <button
              type="button"
              className="border border-[var(--color-outline-variant)] bg-transparent px-4 py-2 text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
            >
              <span className="align-middle font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em]">Next</span>
              <span className="material-symbols-outlined ml-1 align-middle text-[20px]">chevron_right</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
