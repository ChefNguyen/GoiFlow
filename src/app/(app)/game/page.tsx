"use client";

import { useEffect, useState, useCallback, useRef, type MouseEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type RoundState = {
  roundId: string;
  roundNumber: number;
  promptText: string;
  promptType: string;
  startedAt: string;
};

type LeaderboardEntry = {
  participantId: string;
  displayName: string;
  totalScore: number;
  correctCount: number;
  rank: number;
  active: boolean;
};

type HistoryItem = {
  promptText: string;
  rawAnswer: string;
  isCorrect: boolean;
  details?: {
    meaningsVi: string[];
    amHanViet: string[];
    onyomi: string[];
    kunyomi: string[];
  };
};

type SessionResponse = {
  roomCode?: string;
  maxRounds?: number;
  participants?: Array<{ id: string; displayName: string }>;
  standings?: Array<{
    participantId: string;
    displayName: string;
    totalScore: number;
    correctCount: number;
    rank: number;
  }>;
};

export default function ActiveGamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session");
  const participantId = searchParams.get("participant");

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<"submit" | "skip" | null>(null);
  const [round, setRound] = useState<RoundState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentParticipantName, setCurrentParticipantName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxRounds, setMaxRounds] = useState(10);
  const [submitResult, setSubmitResult] = useState<{ isCorrect: boolean; scoreAwarded: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hydrateSession = useCallback(async () => {
    if (!sessionId || !participantId) return;

    const response = await fetch(`/api/game/sessions/${sessionId}`);
    const data = (await response.json()) as SessionResponse;

    if (!response.ok) {
      throw new Error("Failed to load session");
    }

    if (data.roomCode) setRoomCode(data.roomCode);
    if (data.maxRounds) setMaxRounds(data.maxRounds);

    const participants = Array.isArray(data.participants) ? data.participants : [];
    const standings = Array.isArray(data.standings) ? data.standings : [];

    const currentParticipant = participants.find((participant) => participant.id === participantId);
    setCurrentParticipantName(currentParticipant?.displayName ?? "");

    if (standings.length > 0) {
      setLeaderboard(
        standings.map((entry) => ({
          ...entry,
          active: entry.participantId === participantId,
        })),
      );
      return;
    }

    setLeaderboard(
      participants.map((participant, index) => ({
        participantId: participant.id,
        displayName: participant.displayName,
        totalScore: 0,
        correctCount: 0,
        rank: index + 1,
        active: participant.id === participantId,
      })),
    );
  }, [participantId, sessionId]);

  // Redirect if no session/participant
  useEffect(() => {
    if (!sessionId || !participantId) {
      router.replace("/game/setup");
    }
  }, [sessionId, participantId, router]);

  // Load session info (room code, maxRounds, standings)
  useEffect(() => {
    void hydrateSession().catch(console.error);
  }, [hydrateSession]);

  // Load or create first round
  const fetchingRound = useRef(false);
  const loadOrCreateRound = useCallback(async () => {
    if (!sessionId || fetchingRound.current) return;
    fetchingRound.current = true;
    setLoading(true);
    setError(null);
    try {
      // Try to get active round first
      const getRes = await fetch(`/api/game/sessions/${sessionId}/rounds`);
      const getData = await getRes.json();
      
      if (getRes.ok && !getData.activeRound && getData.roundId) {
        setRound(getData);
        setAnswer("");
        setSubmitResult(null);
        return;
      }

      // No active round — create next one
      const postRes = await fetch(`/api/game/sessions/${sessionId}/rounds`, {
        method: "POST",
      });
      const data = await postRes.json();
      if (!postRes.ok) {
        throw new Error(data.error ?? "Failed to load round");
      }
      
      if (data.status === "FINISHED") {
        // All rounds done — go to results
        await fetch(`/api/game/sessions/${sessionId}/results`, { method: "POST" });
        router.push(`/results?session=${sessionId}&participant=${participantId}`);
        return;
      }

      setRound(data);
      setAnswer("");
      setSubmitResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load round");
    } finally {
      setLoading(false);
      fetchingRound.current = false;
    }
  }, [sessionId, participantId, router]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadOrCreateRound();
    });
  }, [loadOrCreateRound]);

  async function handleSubmit() {
    if (!answer.trim() || !sessionId || !participantId || !round) return;
    setLoading(true);
    setPendingAction("submit");
    try {
      const res = await fetch(`/api/game/sessions/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, rawAnswer: answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");

      setHistory((prev) => [
        {
          promptText: round.promptText,
          rawAnswer: answer,
          isCorrect: data.isCorrect,
          details: data.details,
        },
        ...prev.slice(0, 19),
      ]);
      setAnswer("");
      if (data.shouldAdvance) {
        setSubmitResult(null);
        await loadOrCreateRound();
      } else {
        setSubmitResult({ isCorrect: data.isCorrect, scoreAwarded: data.scoreAwarded });
      }
      await hydrateSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  async function handleFinish(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!sessionId || !participantId) return;

    setLoading(true);
    setError(null);

    try {
      await fetch(`/api/game/sessions/${sessionId}/results`, { method: "POST" });
      router.push(`/results?session=${sessionId}&participant=${participantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish session");
      setLoading(false);
    }
  }

  async function handleSkip() {
    if (!sessionId || !participantId || !round) return;

    setLoading(true);
    setPendingAction("skip");
    setError(null);

    try {
      const response = await fetch(`/api/game/sessions/${sessionId}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to skip round");
      }

      if (data.skippedRoundDetails) {
        setHistory((prev) => [
          {
            promptText: data.skippedRoundDetails.promptText,
            rawAnswer: "Skipped",
            isCorrect: false,
            details: data.skippedRoundDetails.details,
          },
          ...prev.slice(0, 19),
        ]);
      }

      if (data.status === "FINISHED") {
        await fetch(`/api/game/sessions/${sessionId}/results`, { method: "POST" });
        router.push(`/results?session=${sessionId}&participant=${participantId}`);
        return;
      }

      setRound(data);
      setAnswer("");
      setSubmitResult(null);
      await hydrateSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip round");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  const progressValue = round ? (round.roundNumber / maxRounds) * 100 : 0;

  if (!sessionId || !participantId) return null;

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col lg:h-[calc(100vh-65px)] lg:flex-row">
      {/* Left Sidebar: Word history */}
      <aside className="hidden w-72 shrink-0 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="border-b border-[var(--color-outline-variant)] p-6">
          <h2 className="mb-1 font-[family-name:var(--font-label)] text-[0.75rem] font-bold uppercase tracking-[0.02em] text-[var(--color-secondary)]">
            Session Data
          </h2>
          <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-primary)]">
            Word History
          </h3>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          {history.length === 0 && (
            <p className="border-b border-[var(--color-outline-variant)] p-4 text-sm text-[var(--color-secondary)]">
              No history yet.
            </p>
          )}
          {history.map((item, index) => {
            const secondaryLabel = item.details?.amHanViet[0] ?? item.rawAnswer;
            const readingLabel = item.details
              ? [...item.details.kunyomi, ...item.details.onyomi].filter(Boolean).join(" / ")
              : item.rawAnswer;
            const tertiaryLabel = item.details?.meaningsVi[0] ?? item.rawAnswer;

            return (
              <div
                key={`${item.promptText}-${index}`}
                className="flex items-start justify-between gap-4 border-b border-[var(--color-outline-variant)] p-4 transition-none hover:bg-[var(--color-surface-container)]"
              >
                <div className="flex min-w-0 flex-col">
                  <div className="mb-1 flex items-end gap-3">
                    <span className="font-[family-name:var(--font-headline)] text-5xl font-bold leading-none text-[var(--color-primary)]">
                      {item.promptText}
                    </span>
                    <div
                      className={item.isCorrect
                        ? "flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--color-primary)]"
                        : "flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[var(--color-primary)] bg-transparent"}
                      aria-label={item.isCorrect ? "Correct answer" : "Incorrect or skipped answer"}
                    >
                      {item.isCorrect ? (
                        <span className="material-symbols-outlined text-[14px] font-bold text-[var(--color-on-primary)]">
                          check
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[14px] font-bold text-[var(--color-primary)]">
                          close
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                    {secondaryLabel}
                  </span>
                </div>
                {item.details && (
                  <div className="min-w-0 shrink-0 text-right">
                    <span className="mt-1 block text-xs text-[var(--color-secondary)]">{readingLabel}</span>
                    <span className="mt-0.5 block text-xs text-[var(--color-secondary)]">{tertiaryLabel}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main: Prompt + Answer */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
        <Progress value={progressValue} className="absolute left-0 top-0 h-1 bg-[var(--color-surface-container-high)]" />

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 lg:px-10">
          <div className="flex w-full max-w-2xl flex-1 items-center justify-center relative">
            {loading && !round ? (
              <p className="text-[var(--color-secondary)]">Loading round...</p>
            ) : (
              <h1 className="select-none text-[8rem] font-bold leading-none text-[var(--color-primary)] md:text-[12rem] transition-all">
                {round?.promptText ?? "..."}
              </h1>
            )}
          </div>

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
              placeholder="Hiragana only"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              className="text-xl font-medium text-[var(--color-primary)] placeholder:text-[var(--color-outline-variant)]"
            />
            <Button
              variant="primary"
              className="mt-4 w-full py-3"
              onClick={handleSubmit}
              disabled={loading || !answer.trim()}
            >
              {pendingAction === "submit" ? "Submitting..." : "Submit"}
            </Button>
            <Button
              variant="secondary"
              className="mt-3 w-full py-3"
              onClick={handleSkip}
              disabled={loading || !round}
            >
              Skip
            </Button>
          </div>
        </div>
      </main>

      {/* Right sidebar: Leaderboard / Room Code */}
      <aside className="hidden w-72 shrink-0 border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="flex items-start justify-between border-b border-[var(--color-outline-variant)] p-6">
          <div>
            <h2 className="mb-1 font-[family-name:var(--font-label)] text-[0.75rem] font-bold uppercase tracking-[0.02em] text-[var(--color-secondary)]">
              Study_Session
            </h2>
            <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-primary)]">
              ROOM_CODE: {roomCode || "..."}
            </h3>
          </div>
          <button className="p-1 transition-none hover:bg-[var(--color-surface-container)]" aria-label="Show room QR code">
            <span className="material-symbols-outlined text-[var(--color-primary)]">qr_code</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {leaderboard.length === 0 ? (
            <div className="border-b border-[var(--color-outline-variant)] p-4">
              <div className="flex flex-col">
                <span className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-primary)]">
                  {currentParticipantName || "You"}
                </span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary)]">
                  Rank #1
                </span>
              </div>
            </div>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.participantId}
                className={entry.active
                  ? "flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] p-4"
                  : "flex items-center justify-between border-b border-[var(--color-outline-variant)] p-4 transition-none hover:bg-[var(--color-surface-container)]"}
              >
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-primary)]">
                    {entry.displayName}
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary)]">
                    Rank #{entry.rank}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-[var(--color-primary)]">
                    {entry.totalScore}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-[var(--color-secondary)]">
                    Points
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[var(--color-outline-variant)] p-4">
          <Link href="/results" className="block" onClick={handleFinish}>
            <Button variant="secondary" className="w-full py-3 uppercase tracking-[0.02em] text-xs">FINISH</Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}
