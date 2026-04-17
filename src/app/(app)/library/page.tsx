"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const collections = [
  {
    title: "Foundational radicals",
    subtitle: "N5 · 24 entries",
    description:
      "Core shape families and recurring building blocks for early recognition drills.",
    accent: "氵",
  },
  {
    title: "Daily motion verbs",
    subtitle: "N4 · 18 entries",
    description:
      "Common movement and routine vocabulary grouped for fast recall during live rounds.",
    accent: "動",
  },
  {
    title: "Weather and seasons",
    subtitle: "N4 · 16 entries",
    description:
      "Review forecasts, seasonal terms, and temperature words before timed practice.",
    accent: "季",
  },
  {
    title: "Business essentials",
    subtitle: "N3 · 20 entries",
    description:
      "Office language, scheduling terms, and meeting vocabulary for intermediate sets.",
    accent: "会",
  },
  {
    title: "Travel phrases",
    subtitle: "N3 · 14 entries",
    description:
      "Transit, booking, and wayfinding vocabulary prepared as a compact review deck.",
    accent: "旅",
  },
  {
    title: "Abstract modifiers",
    subtitle: "N2 · 12 entries",
    description:
      "Precision adjectives and adverbs that often decide leaderboard speed in advanced rounds.",
    accent: "整",
  },
];

const jlptFilters = ["N5", "N4", "N3", "N2", "N1"];
const categoryFilters = ["Radicals", "Frequency", "Saved"];

export default function LibraryPage() {
  const [selectedCollection, setSelectedCollection] = useState(collections[0]);

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)]">
      <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="hidden border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-6 lg:block">
          <div className="space-y-8 lg:sticky lg:top-6">
            <div className="space-y-2 border-b border-[var(--color-outline-variant)] pb-6">
              <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Reference controls
              </p>
              <h2 className="font-[family-name:var(--font-headline)] text-3xl leading-none text-[var(--color-primary)]">
                Filters
              </h2>
            </div>

            <section className="space-y-4">
              <h3 className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                JLPT level
              </h3>
              <div className="space-y-2">
                {jlptFilters.map((level, index) => (
                  <label
                    key={level}
                    className={index === 1
                      ? "flex cursor-pointer items-center gap-3 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] px-3 py-3 text-[var(--color-primary)]"
                      : "flex cursor-pointer items-center gap-3 border border-transparent px-3 py-3 text-[var(--color-secondary)] transition-none hover:border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]"}
                  >
                    <Checkbox defaultChecked={index === 1} />
                    <span className="flex-1 text-base font-medium">{level}</span>
                    <span className="text-xs uppercase tracking-[0.2em]">
                      {index === 1 ? "Active" : "Set"}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Collection type
              </h3>
              <div className="space-y-2">
                {categoryFilters.map((category, index) => (
                  <button
                    key={category}
                    type="button"
                    className={index === 0
                      ? "flex w-full items-center gap-3 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] px-3 py-3 text-left text-[var(--color-primary)]"
                      : "flex w-full items-center gap-3 border border-transparent px-3 py-3 text-left text-[var(--color-secondary)] transition-none hover:border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]"}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {index === 0 ? "category" : index === 1 ? "sort" : "favorite"}
                    </span>
                    <span className="flex-1 text-base font-medium">{category}</span>
                  </button>
                ))}
              </div>
            </section>

            <Button variant="primary" className="w-full py-3">
              Apply filters
            </Button>
          </div>
        </aside>

        <section className="px-6 py-8 lg:px-10 lg:py-10">
          <div className="space-y-10">
            <div className="space-y-4 border-b border-[var(--color-outline-variant)] pb-8">
              <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Reference / Library
              </p>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <h1 className="text-5xl font-bold leading-none tracking-tight text-[var(--color-primary)] lg:text-6xl">
                    Study library
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 tracking-[0.02em] text-[var(--color-secondary)]">
                    Browse curated kanji and vocabulary sets, keep your saved groups close, and jump back into focused review.
                  </p>
                </div>
                <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  48 results
                </div>
              </div>
            </div>

            <div className="grid gap-px border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)] md:grid-cols-2 xl:grid-cols-3">
              {collections.map((collection) => (
                <article
                  key={collection.title}
                  className="flex min-h-[19rem] flex-col justify-between bg-[var(--color-surface-container-lowest)] p-6 lg:p-7"
                >
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-5">
                      <div className="space-y-3">
                        <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                          {collection.subtitle}
                        </p>
                        <h2 className="text-2xl font-semibold leading-tight text-[var(--color-primary)]">
                          {collection.title}
                        </h2>
                      </div>
                      <span className="font-[family-name:var(--font-headline)] text-6xl leading-none text-[var(--color-primary)]/75">
                        {collection.accent}
                      </span>
                    </div>
                    <p className="max-w-xs text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">
                      {collection.description}
                    </p>
                  </div>

                  <div className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--color-outline-variant)] pt-4">
                    <span className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                      Ready for review
                    </span>
                    <Button variant="secondary" className="px-4 py-2" onClick={() => setSelectedCollection(collection)}>
                      Open set
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-[var(--color-outline-variant)] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Page 1 of 4
              </div>
              <div className="flex items-center border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] text-sm text-[var(--color-secondary)]">
                <button
                  type="button"
                  className="border-r border-[var(--color-outline-variant)] px-4 py-3 transition-none hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]"
                >
                  Previous
                </button>
                <span className="border-r border-[var(--color-outline-variant)] px-4 py-3 text-[var(--color-primary)]">
                  1
                </span>
                <button
                  type="button"
                  className="px-4 py-3 transition-none hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-6 lg:block">
          <div className="lg:sticky lg:top-6 space-y-8">
            <div className="space-y-2 border-b border-[var(--color-outline-variant)] pb-6">
              <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Kanji detail
              </p>
              <h2 className="font-[family-name:var(--font-headline)] text-3xl leading-none text-[var(--color-primary)]">
                {selectedCollection.accent}
              </h2>
              <p className="text-sm text-[var(--color-secondary)]">{selectedCollection.subtitle}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[var(--color-primary)]">
                {selectedCollection.title}
              </h3>
              <p className="text-sm leading-6 tracking-[0.02em] text-[var(--color-secondary)]">
                {selectedCollection.description}
              </p>
            </div>

            <div className="space-y-3 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-4">
              <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Readings
              </p>
              <p className="text-lg font-semibold text-[var(--color-primary)]">オン: コレクション</p>
              <p className="text-lg font-semibold text-[var(--color-primary)]">くん: しゅうごう</p>
              <p className="text-sm text-[var(--color-secondary)]">
                Meaning cluster tailored for focused competitive review.
              </p>
            </div>

            <div className="grid gap-3">
              <Button variant="primary" className="w-full py-3">
                Start review
              </Button>
              <Button variant="secondary" className="w-full py-3">
                Save to profile
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
