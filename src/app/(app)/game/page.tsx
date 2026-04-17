"use client";

import Link from "next/link";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const historyItems = [
  { kanji: "水", vi: "Thủy", meaning: "Water", reading: "みず (mizu)" },
  { kanji: "火", vi: "Hỏa", meaning: "Fire", reading: "ひ (hi)" },
  { kanji: "木", vi: "Mộc", meaning: "Tree", reading: "き (ki)" },
];

const leaderboard = [
  { rank: 1, name: "Guest player", score: "4,250", active: true },
  { rank: 2, name: "Alex M.", score: "3,900" },
  { rank: 3, name: "Sara K.", score: "3,120" },
];

export default function ActiveGamePage() {
  const [answer, setAnswer] = useState("");
  const [showReveal, setShowReveal] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col lg:h-[calc(100vh-65px)] lg:flex-row">
      <aside className="hidden w-72 shrink-0 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="border-b border-[var(--color-outline-variant)] p-6">
          <p className="font-[family-name:var(--font-label)] text-[0.75rem] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            Session data
          </p>
          <h2 className="mt-1 text-lg font-bold text-[var(--color-primary)]">
            Word history
          </h2>
        </div>
        <div className="flex flex-1 flex-col">
          {historyItems.map((item) => (
            <div
              key={item.kanji}
              className="border-b border-[var(--color-outline-variant)] p-4 transition-none hover:bg-[var(--color-surface-container)]"
            >
              <div className="mb-1 flex items-baseline justify-between gap-4">
                <span className="text-2xl font-bold text-[var(--color-primary)]">
                  {item.kanji}
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-secondary)]">
                  {item.vi}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-[var(--color-primary)]">
                  {item.meaning}
                </span>
                <span className="text-[var(--color-secondary)]">{item.reading}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
        <Progress value={65} className="absolute left-0 top-0 h-1 bg-[var(--color-surface-container-high)]" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 lg:px-10">
          <div className="flex w-full max-w-2xl flex-1 items-center justify-center">
            {showReveal ? (
              <div className="w-full max-w-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-8 text-center">
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  Answer reveal
                </p>
                <h2 className="mt-4 text-6xl font-bold leading-none text-[var(--color-primary)]">流</h2>
                <p className="mt-4 text-2xl font-semibold text-[var(--color-primary)]">ながれ · nagare</p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-secondary)]">
                  Correct reading submitted. The room is pausing briefly before the next timed kanji.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Button variant="secondary" className="w-full py-3" onClick={() => setShowReveal(false)}>
                    Back to prompt
                  </Button>
                  <Link href="/results" className="block">
                    <Button variant="primary" className="w-full py-3">
                      View results
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <h1 className="select-none text-[8rem] font-bold leading-none text-[var(--color-primary)] md:text-[12rem]">
                流
              </h1>
            )}
          </div>

          {!showReveal && (
            <div className="w-full max-w-md pb-8">
              <label
                htmlFor="kanji-input"
                className="mb-2 block font-[family-name:var(--font-label)] text-[0.75rem] font-medium uppercase tracking-[0.15em] text-[var(--color-secondary)]"
              >
                Enter reading...
              </label>
              <Input
                id="kanji-input"
                autoFocus
                autoComplete="off"
                placeholder="Hiragana or Romaji"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                className="text-xl font-medium text-[var(--color-primary)] placeholder:text-[var(--color-outline-variant)]"
              />
              <Button variant="secondary" className="mt-4 w-full py-3" onClick={() => setShowReveal(true)}>
                Reveal answer
              </Button>
            </div>
          )}
        </div>
      </main>

      <aside className="hidden w-72 shrink-0 border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="flex items-start justify-between border-b border-[var(--color-outline-variant)] p-6">
          <div>
            <p className="font-[family-name:var(--font-label)] text-[0.75rem] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Study session
            </p>
            <h2 className="mt-1 text-lg font-bold text-[var(--color-primary)]">
              ROOM_CODE: BK22
            </h2>
          </div>
          <button className="p-1 transition-none hover:bg-[var(--color-surface-container)]" aria-label="Show room QR code">
            <span className="material-symbols-outlined text-[var(--color-primary)]">qr_code</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={entry.active
                ? "flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] p-4"
                : "flex items-center justify-between border-b border-[var(--color-outline-variant)] p-4 transition-none hover:bg-[var(--color-surface-container)]"
              }
            >
              <div className="flex items-center gap-3">
                <span className={entry.active ? "w-4 font-bold text-[var(--color-primary)]" : "w-4 font-bold text-[var(--color-secondary)]"}>
                  {entry.rank}
                </span>
                <span className={entry.active ? "font-medium text-[var(--color-primary)]" : "font-medium text-[var(--color-secondary)]"}>
                  {entry.name}
                </span>
              </div>
              <span className={entry.active ? "font-bold text-[var(--color-primary)]" : "font-bold text-[var(--color-secondary)]"}>
                {entry.score}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-2 border-t border-[var(--color-outline-variant)] p-4">
          <Link href="/results" className="block">
            <Button variant="primary" className="w-full py-3">
              View results
            </Button>
          </Link>
          <Button variant="secondary" className="w-full py-3">
            Leave session
          </Button>
        </div>
      </aside>
    </div>
  );
}
