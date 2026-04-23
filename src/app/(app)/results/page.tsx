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

type SessionState = {
  id: string;
  roomCode: string;
  gameMode: string;
  status: string;
  jlptLevel: string;
  timePerPromptSeconds: number;
  maxRounds: number;
  currentRoundNumber: number;
  participants: Array<{
    id: string;
    displayName: string;
    role: string;
  }>;
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const participantId = searchParams.get("participant");

  const [results, setResults] = useState<ResultEntry[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let cancelled = false;

    async function loadResultsPage() {
      setLoading(true);
      setError(null);

      try {
        const [resultsResponse, sessionResponse] = await Promise.all([
          fetch(`/api/game/sessions/${sessionId}/results`),
          fetch(`/api/game/sessions/${sessionId}`),
        ]);

        const [resultsData, sessionData] = await Promise.all([
          resultsResponse.json(),
          sessionResponse.json(),
        ]);

        if (!resultsResponse.ok) {
          throw new Error(resultsData.error ?? "Failed to load results");
        }

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error ?? "Failed to load session");
        }

        if (!cancelled) {
          setResults(Array.isArray(resultsData) ? resultsData : []);
          setSession(sessionData);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load results"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadResultsPage();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const displayError = error ?? (!sessionId ? "Missing session id" : null);

  const top3 = results.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as ResultEntry[];

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

  const playerCount = session?.participants.length ?? results.length;
  const sessionSummary = session
    ? `Room: ${session.roomCode} • ${session.maxRounds} Rounds • ${playerCount} Players`
    : sessionId
      ? `Session ended • ${results.length} players`
      : null;

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <header className="mb-20 text-center">
          <h1 className="mb-4 font-[family-name:var(--font-headline)] text-5xl font-bold uppercase tracking-tight text-[var(--color-primary)] md:text-6xl">
            Results
          </h1>
          {sessionSummary && (
            <p className="font-[family-name:var(--font-body)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              {sessionSummary}
            </p>
          )}
        </header>

        {loading && (
          <p className="mb-12 text-[var(--color-secondary)]">Loading results...</p>
        )}

        {displayError && (
          <div className="mb-12 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {displayError}
          </div>
        )}

        {!loading && !displayError && results.length > 0 && (
          <>
            <section className="mb-24 flex h-64 w-full max-w-3xl items-end justify-center gap-2 md:gap-6">
              {podiumOrder.map((entry, index) => {
                const slot = podiumSlots[index];
                const isCurrentParticipant = entry.participantId === participantId;
                const isFirst = entry.rank === 1;

                return (
                  <div
                    key={entry.participantId}
                    className={`flex w-1/3 flex-col items-center ${slot.outerClassName}`}
                  >
                    <div className="mb-4 text-center">
                      {isFirst && (
                        <span
                          className="material-symbols-outlined mb-1 text-[var(--color-primary)]"
                          style={{ fontVariationSettings: '"FILL" 1' }}
                        >
                          workspace_premium
                        </span>
                      )}
                      <span
                        className={`block font-[family-name:var(--font-headline)] font-bold text-[var(--color-primary)] ${slot.nameClassName} ${isCurrentParticipant ? "underline" : ""}`}
                      >
                        {entry.displayName}
                      </span>
                      <span className="block font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)]">
                        {entry.totalScore.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className={`flex w-full items-start justify-center border pt-4 ${slot.heightClassName} ${slot.barClassName} ${isFirst ? "pt-6" : ""}`}
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
                        Correct
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-[family-name:var(--font-body)] text-sm">
                    {results.map((entry) => {
                      const isCurrentParticipant = entry.participantId === participantId;

                      return (
                        <tr
                          key={entry.participantId}
                          className={
                            isCurrentParticipant
                              ? "border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]"
                              : "border-b border-[var(--color-outline-variant)]"
                          }
                        >
                          <td
                            className={`py-5 pl-4 pr-2 font-[family-name:var(--font-headline)] ${isCurrentParticipant ? "font-bold text-[var(--color-primary)]" : "text-[var(--color-secondary)]"}`}
                          >
                            {String(entry.rank).padStart(2, "0")}
                          </td>
                          <td
                            className={`px-4 py-5 ${isCurrentParticipant ? "font-bold text-[var(--color-primary)]" : "text-[var(--color-primary)]"}`}
                          >
                            {entry.displayName}{" "}
                            {isCurrentParticipant && (
                              <span className="text-xs text-[var(--color-secondary)]">
                                (you)
                              </span>
                            )}
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

        {!loading && !displayError && results.length === 0 && (
          <p className="mb-12 text-[var(--color-secondary)]">
            No results yet. This session may still be resolving.
          </p>
        )}

        <section className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row">
          <Link href="/game/setup" className="w-full sm:w-auto">
            <Button
              variant="primary"
              className="w-full px-10 py-4 text-sm tracking-widest !text-[var(--color-on-primary)] sm:w-auto"
            >
              Play Again
            </Button>
          </Link>
          <Link href="/game/setup" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full px-10 py-4 text-sm tracking-widest sm:w-auto"
            >
              New Room
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
