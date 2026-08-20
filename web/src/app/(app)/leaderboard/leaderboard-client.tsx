"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  totalScore: number;
  totalGames: number;
}

type Props = {
  initialEntries: LeaderboardEntry[];
};

export default function LeaderboardClient({ initialEntries }: Props) {
  const top3 = initialEntries.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];

  const podiumSlots = [
    {
      heightClassName: "h-[140px]",
      outerClassName: "max-w-[160px]",
      barClassName: "bg-[var(--color-surface-container-high)] border-[var(--color-primary)]",
      rankClassName: "text-4xl text-[var(--color-primary)] opacity-20",
      nameClassName: "text-2xl",
    },
    {
      heightClassName: "h-[200px]",
      outerClassName: "max-w-[180px]",
      barClassName: "bg-[var(--color-primary)] border-[var(--color-primary)]",
      rankClassName: "text-6xl text-[var(--color-on-primary)] opacity-20",
      nameClassName: "text-3xl",
    },
    {
      heightClassName: "h-[100px]",
      outerClassName: "max-w-[160px]",
      barClassName: "bg-[var(--color-surface)] border-[var(--color-outline-variant)]",
      rankClassName: "text-4xl text-[var(--color-primary)] opacity-20",
      nameClassName: "text-2xl",
    },
  ];

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <header className="mb-20 text-center">
          <h1 className="mb-4 font-[family-name:var(--font-headline)] text-5xl font-bold uppercase tracking-tight text-[var(--color-primary)] md:text-6xl">
            Global Leaderboard
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            Top Vocabulary Players · {initialEntries.length} players ranked
          </p>
        </header>

        {initialEntries.length === 0 ? (
          <p className="mb-12 text-[var(--color-secondary)]">
            No ranked players yet. Play a game to appear on the leaderboard!
          </p>
        ) : (
          <>
            <section className="mb-24 flex h-64 w-full max-w-3xl items-end justify-center gap-2 md:gap-6">
              {podiumOrder.map((entry, index) => {
                const slot = podiumSlots[index]!;
                return (
                  <div
                    key={entry.rank}
                    className={`flex w-1/3 flex-col items-center ${slot.outerClassName}`}
                  >
                    <div className="mb-4 text-center">
                      {entry.rank === 1 && (
                        <span
                          className="material-symbols-outlined mb-1 text-[var(--color-primary)]"
                          style={{ fontVariationSettings: '"FILL" 1' }}
                        >
                          workspace_premium
                        </span>
                      )}
                      <span
                        className={`block font-[family-name:var(--font-headline)] font-bold text-[var(--color-primary)] ${slot.nameClassName}`}
                      >
                        {entry.displayName}
                      </span>
                      <span className="block font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)]">
                        {entry.totalScore.toLocaleString()} pts
                      </span>
                    </div>
                    <div
                      className={`flex w-full items-start justify-center border pt-4 ${slot.heightClassName} ${slot.barClassName} ${entry.rank === 1 ? "pt-6" : ""}`}
                    >
                      <span
                        className={`font-[family-name:var(--font-headline)] font-bold ${slot.rankClassName}`}
                      >
                        {entry.rank}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mb-16 w-full max-w-3xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-[var(--color-primary)]">
                      <th className="w-16 py-4 pl-4 pr-2 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
                        Rank
                      </th>
                      <th className="px-4 py-4 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
                        Username
                      </th>
                      <th className="px-4 py-4 text-right font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
                        Score
                      </th>
                      <th className="px-4 py-4 text-right font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
                        Games
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-[family-name:var(--font-body)] text-sm">
                    {initialEntries.map((entry) => (
                      <tr
                        key={entry.rank}
                        className="border-b border-[var(--color-outline-variant)]"
                      >
                        <td className="py-5 pl-4 pr-2 font-[family-name:var(--font-headline)] text-[var(--color-secondary)]">
                          {String(entry.rank).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-5 text-[var(--color-primary)]">
                          {entry.displayName}
                        </td>
                        <td className="px-4 py-5 text-right font-medium text-[var(--color-on-surface)]">
                          {entry.totalScore.toLocaleString()}
                        </td>
                        <td className="px-4 py-5 text-right text-[var(--color-secondary)]">
                          {entry.totalGames}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <section className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row">
          <Link href="/game/setup" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full px-10 py-4 text-sm tracking-widest !text-[var(--color-on-primary)] sm:w-auto">
              Play Vocabulary Game
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
