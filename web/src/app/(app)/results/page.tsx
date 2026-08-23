"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

type ResultEntry = {
  rank: number;
  participantId: string;
  displayName: string;
  avatarUrl?: string | null;
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
    avatarUrl?: string | null;
    role: string;
  }>;
  standings?: Array<{
    participantId: string;
    displayName: string;
    avatarUrl?: string | null;
    totalScore: number;
    correctCount: number;
    rank: number;
  }>;
};

function UserAvatarBox({
  avatarUrl,
  displayName,
  size = "md",
  className = "",
}: {
  avatarUrl?: string | null;
  displayName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initial = (displayName || "U").trim().charAt(0).toUpperCase();
  const sizeMap = {
    sm: "h-5 w-5 text-[9px]",
    md: "h-7 w-7 text-[10px]",
    lg: "h-10 w-10 text-xs",
    xl: "h-12 w-12 text-sm",
  };
  const sizeClass = sizeMap[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || "Player"}
        className={`${sizeClass} rounded-none object-cover border border-[var(--color-primary)] shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center border border-[var(--color-primary)] bg-[var(--color-primary)] font-bold text-[var(--color-on-primary)] rounded-none select-none ${className}`}
    >
      {initial}
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { data: authSession } = useSession();
  const currentUserAvatar = authSession?.user?.image ?? null;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const participantId = searchParams.get("participant");

  const [results, setResults] = useState<ResultEntry[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [restarting, setRestarting] = useState(false);
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
          const participants = Array.isArray(sessionData.participants) ? sessionData.participants : [];
          const standings = Array.isArray(sessionData.standings) ? sessionData.standings : [];
          const rawResults = Array.isArray(resultsData) ? resultsData : [];
          const mappedResults: ResultEntry[] = rawResults.map((entry: any) => {
            const p = participants.find((part: any) => part.id === entry.participantId);
            const s = standings.find((st: any) => st.participantId === entry.participantId);
            return {
              rank: entry.rank ?? 1,
              participantId: entry.participantId,
              displayName: entry.displayName || p?.displayName || "Player",
              avatarUrl: entry.avatarUrl || s?.avatarUrl || p?.avatarUrl || null,
              totalScore: entry.totalScore ?? 0,
              correctCount: entry.correctCount ?? 0,
              averageResponseMs: entry.averageResponseMs,
            };
          });
          setResults(mappedResults);
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

  let podiumOrder: ResultEntry[] = [];
  if (results.length === 1) {
    podiumOrder = [results[0]];
  } else if (results.length === 2) {
    podiumOrder = [results[1], results[0]];
  } else if (results.length >= 3) {
    podiumOrder = [results[1], results[0], results[2]];
  }

  const podiumSlotByRank: Record<number, { heightClassName: string; outerClassName: string; barClassName: string; rankClassName: string; nameClassName: string }> = {
    1: {
      heightClassName: "h-[200px]",
      outerClassName: "max-w-[180px]",
      barClassName: "bg-[var(--color-primary)] border-[var(--color-primary)]",
      rankClassName: "text-6xl text-[var(--color-on-primary)] opacity-20",
      nameClassName: "text-3xl",
    },
    2: {
      heightClassName: "h-[140px]",
      outerClassName: "max-w-[160px]",
      barClassName: "bg-[var(--color-surface-container-high)] border-[var(--color-primary)]",
      rankClassName: "text-4xl text-[var(--color-primary)] opacity-20",
      nameClassName: "text-2xl",
    },
    3: {
      heightClassName: "h-[100px]",
      outerClassName: "max-w-[160px]",
      barClassName: "bg-[var(--color-surface)] border-[var(--color-outline-variant)]",
      rankClassName: "text-4xl text-[var(--color-primary)] opacity-20",
      nameClassName: "text-2xl",
    },
  };

  const playerCount = session?.participants.length ?? results.length;
  const roundsPlayed = session?.currentRoundNumber || 1;
  const sessionSummary = session
    ? `Room: ${session.roomCode} • ${roundsPlayed} Rounds Played • ${playerCount} ${playerCount === 1 ? "Player" : "Players"}`
    : sessionId
      ? `Session ended • ${results.length} ${results.length === 1 ? "player" : "players"}`
      : null;

  async function handlePlayAgain() {
    if (!sessionId) {
      router.push("/game/setup");
      return;
    }

    setRestarting(true);
    try {
      await fetch(`/api/game/sessions/${sessionId}/restart`, { method: "POST" });
    } catch (err) {
      console.error("Failed to restart session", err);
    } finally {
      const pid =
        participantId ||
        (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null);
      router.push(`/game?session=${sessionId}${pid ? `&participant=${pid}` : ""}`);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <header className="mb-10 text-center">
          <h1 className="mb-2 font-[family-name:var(--font-headline)] text-4xl font-bold uppercase tracking-tight text-[var(--color-primary)] md:text-5xl">
            Results
          </h1>
          {sessionSummary && (
            <p className="font-[family-name:var(--font-body)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
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
            <section className="mb-16 flex w-full max-w-2xl items-end justify-center gap-6 md:gap-8 pt-6">
              {podiumOrder.map((entry) => {
                const slot = podiumSlotByRank[entry.rank] || podiumSlotByRank[3];
                const isCurrentParticipant = entry.participantId === participantId;
                const isFirst = entry.rank === 1;

                return (
                  <div
                    key={entry.participantId}
                    className={`flex flex-1 flex-col items-center ${slot.outerClassName}`}
                  >
                    {/* Header above podium block with generous, elegant breathing room */}
                    <div className="flex flex-col items-center justify-end pb-4 text-center w-full">
                      {/* Crown / Rank Indicator (Calligrapher Minimalist Ink Style) */}
                      {isFirst ? (
                        <div className="flex flex-col items-center mb-2">
                          <Crown
                            className="h-5 w-5 text-[var(--color-primary)] fill-[var(--color-primary)] transition-transform hover:scale-110"
                            strokeWidth={1.5}
                            aria-label="Champion Crown"
                          />
                        </div>
                      ) : (
                        <div className="h-5 mb-2 flex items-center justify-center">
                          <span className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-secondary)]">
                            NO. {entry.rank}
                          </span>
                        </div>
                      )}

                      {/* Avatar with Calligrapher seal border for 1st place */}
                      {isFirst ? (
                        <div className="p-0.5 border border-[var(--color-primary)] bg-[var(--color-surface)] shadow-sm">
                          <UserAvatarBox
                            avatarUrl={entry.avatarUrl || (isCurrentParticipant ? currentUserAvatar : null)}
                            displayName={entry.displayName}
                            size="xl"
                          />
                        </div>
                      ) : (
                        <UserAvatarBox
                          avatarUrl={entry.avatarUrl || (isCurrentParticipant ? currentUserAvatar : null)}
                          displayName={entry.displayName}
                          size="lg"
                          className="shadow-sm"
                        />
                      )}

                      {/* Name with clean typography */}
                      <div className="mt-2.5 flex items-center justify-center gap-1.5 max-w-full px-1">
                        <span
                          className={`block truncate font-[family-name:var(--font-headline)] font-bold text-[var(--color-primary)] ${slot.nameClassName}`}
                          title={entry.displayName}
                        >
                          {entry.displayName}
                        </span>
                      </div>

                      {/* Score */}
                      <span className="mt-0.5 block font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
                        {entry.totalScore.toLocaleString()} pts
                      </span>
                    </div>

                    {/* Podium block */}
                    <div
                      className={`flex w-full items-center justify-center border ${slot.heightClassName} ${slot.barClassName}`}
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
                          <td className="px-4 py-4 text-[var(--color-primary)]">
                            <div className="flex items-center gap-3">
                              <UserAvatarBox
                                avatarUrl={entry.avatarUrl || (isCurrentParticipant ? currentUserAvatar : null)}
                                displayName={entry.displayName}
                                size="md"
                              />
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${isCurrentParticipant ? "font-bold" : ""}`}>
                                  {entry.displayName}
                                </span>
                                {isCurrentParticipant && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
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
          <Button
            variant="primary"
            onClick={handlePlayAgain}
            disabled={restarting}
            className="w-full px-10 py-4 text-sm tracking-widest !text-[var(--color-on-primary)] sm:w-auto"
          >
            {restarting ? "Restarting..." : "Play Again"}
          </Button>
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
