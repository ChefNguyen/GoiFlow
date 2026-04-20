"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ResultEntry = {
  rank: number;
  participantId: string;
  displayName: string;
  totalScore: number;
  correctCount: number;
  averageResponseMs?: number;
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const participantId = searchParams.get("participant");

  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetch(`/api/game/sessions/${sessionId}/results`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setResults(data);
        else setError(data.error ?? "Failed to load results");
      })
      .catch(() => setError("Failed to load results"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const top3 = results.slice(0, 3);
  // Podium display order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const podiumHeights = ["h-[140px]", "h-[200px]", "h-[100px]"];
  const podiumStyles = [
    "bg-[var(--color-surface-container-high)] border-[var(--color-primary)]",
    "bg-[var(--color-primary)] border-[var(--color-primary)]",
    "bg-[var(--color-surface)] border-[var(--color-outline-variant)]",
  ];

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <header className="mb-20 text-center">
          <h1 className="mb-4 font-[family-name:var(--font-headline)] text-5xl font-bold uppercase tracking-tight text-[var(--color-primary)] md:text-6xl">
            Results
          </h1>
          {sessionId && (
            <p className="font-[family-name:var(--font-body)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Session ended • {results.length} players
            </p>
          )}
        </header>

        {loading && (
          <p className="text-[var(--color-secondary)] mb-12">Loading results...</p>
        )}

        {error && (
          <div className="mb-12 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <>
            {/* Podium */}
            <section className="mb-24 flex h-64 w-full max-w-3xl items-end justify-center gap-2 md:gap-6">
              {podiumOrder.map((entry, i) => {
                if (!entry) return null;
                const isFirst = entry.rank === 1;
                return (
                  <div key={entry.participantId} className={`flex w-1/3 flex-col items-center max-w-[${isFirst ? "180px" : "160px"}]`}>
                    <div className="mb-4 text-center">
                      {isFirst && (
                        <span
                          className="material-symbols-outlined mb-1 text-[var(--color-primary)]"
                          style={{ fontVariationSettings: '"FILL" 1' }}
                        >
                          workspace_premium
                        </span>
                      )}
                      <span className={`block font-[family-name:var(--font-headline)] font-bold text-[var(--color-primary)] ${isFirst ? "text-3xl" : "text-2xl"} ${entry.participantId === participantId ? "underline" : ""}`}>
                        {entry.displayName}
                      </span>
                      <span className="block font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)]">
                        {entry.totalScore.toLocaleString()}
                      </span>
                    </div>
                    <div className={`flex w-full items-start justify-center border pt-4 ${podiumHeights[i]} ${podiumStyles[i]} ${isFirst ? "pt-6" : ""}`}>
                      <span className={`font-[family-name:var(--font-headline)] font-bold text-4xl ${isFirst ? "text-[var(--color-on-primary)] opacity-20 text-6xl" : "text-[var(--color-primary)] opacity-20"}`}>
                        {entry.rank}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Full leaderboard */}
            <section className="mb-16 w-full max-w-3xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-[var(--color-primary)]">
                      <th className="w-16 py-4 pl-4 pr-2 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">Rank</th>
                      <th className="px-4 py-4 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">Username</th>
                      <th className="px-4 py-4 text-right font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">Score</th>
                      <th className="px-4 py-4 text-right font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">Correct</th>
                    </tr>
                  </thead>
                  <tbody className="font-[family-name:var(--font-body)] text-sm">
                    {results.map((entry) => {
                      const isMe = entry.participantId === participantId;
                      return (
                        <tr
                          key={entry.participantId}
                          className={isMe
                            ? "border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]"
                            : "border-b border-[var(--color-outline-variant)]"}
                        >
                          <td className={`py-5 pl-4 pr-2 font-[family-name:var(--font-headline)] ${isMe ? "font-bold text-[var(--color-primary)]" : "text-[var(--color-secondary)]"}`}>
                            {String(entry.rank).padStart(2, "0")}
                          </td>
                          <td className={`px-4 py-5 ${isMe ? "font-bold text-[var(--color-primary)]" : "text-[var(--color-primary)]"}`}>
                            {entry.displayName} {isMe && <span className="text-xs text-[var(--color-secondary)]">(you)</span>}
                          </td>
                          <td className="px-4 py-5 text-right font-medium text-[var(--color-on-surface)]">
                            {entry.totalScore.toLocaleString()}
                          </td>
                          <td className="px-4 py-5 text-right text-[var(--color-secondary)]">
                            {entry.correctCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {!loading && !error && results.length === 0 && (
          <p className="text-[var(--color-secondary)] mb-12">No results yet. The game may still be in progress.</p>
        )}

        <section className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row">
          <Link href="/game/setup" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full px-10 py-4 text-sm tracking-widest !text-[var(--color-on-primary)] sm:w-auto">
              Play Again
            </Button>
          </Link>
          <Link href="/game/setup" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full px-10 py-4 text-sm tracking-widest sm:w-auto">
              New Room
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
