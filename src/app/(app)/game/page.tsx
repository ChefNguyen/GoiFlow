"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  score: number;
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

export default function ActiveGamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session");
  const participantId = searchParams.get("participant");

  const [answer, setAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState<RoundState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [maxRounds, setMaxRounds] = useState(10);
  const [submitResult, setSubmitResult] = useState<{ isCorrect: boolean; scoreAwarded: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no session/participant
  useEffect(() => {
    if (!sessionId || !participantId) {
      router.replace("/game/setup");
    }
  }, [sessionId, participantId, router]);

  // Load session info (room code, maxRounds)
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/game/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.roomCode) setRoomCode(data.roomCode);
        if (data.maxRounds) setMaxRounds(data.maxRounds);
      })
      .catch(console.error);
  }, [sessionId]);

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
        setIsSubmitted(false);
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
      setIsSubmitted(false);
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
    loadOrCreateRound();
  }, [loadOrCreateRound]);

  async function handleSubmit() {
    if (!answer.trim() || !sessionId || !participantId || !round) return;
    setLoading(true);
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
          details: data.details
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  const progressValue = round ? (round.roundNumber / maxRounds) * 100 : 0;

  if (!sessionId || !participantId) return null;

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col lg:h-[calc(100vh-65px)] lg:flex-row">
      {/* Left Sidebar: Word history */}
      <aside className="hidden w-72 shrink-0 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="border-b border-[var(--color-outline-variant)] p-6">
          <h2 className="mt-1 text-lg font-bold text-[var(--color-primary)]">Word history</h2>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          {history.length === 0 && (
            <p className="p-4 text-sm text-[var(--color-secondary)]">No history yet</p>
          )}
          {history.map((item, i) => (
            <div
              key={i}
              className="border-b border-[var(--color-outline-variant)] p-4 transition-none hover:bg-[var(--color-surface-container)]"
            >
              <div className="mb-1 flex items-baseline justify-between gap-4">
                <span className="text-2xl font-bold text-[var(--color-primary)]">{item.promptText}</span>
                <span className={`text-xs font-medium uppercase tracking-[0.15em] ${item.isCorrect ? "text-green-600" : "text-red-500"}`}>
                  {item.isCorrect ? "✓" : "✗"}
                </span>
              </div>
              <div className="text-sm text-[var(--color-secondary)] mb-2">
                Your answer: <span className="font-medium text-[var(--color-primary)]">{item.rawAnswer}</span>
              </div>
              {item.details && (
                <div className="text-xs text-[var(--color-secondary)] space-y-1 bg-[var(--color-surface-container-lowest)] p-2">
                  <p><strong>Nghĩa:</strong> {item.details.meaningsVi.join(", ")}</p>
                  <p><strong>Hán Việt:</strong> {item.details.amHanViet.join(", ")}</p>
                  <p><strong>Onyomi:</strong> {item.details.onyomi.join(", ")}</p>
                  <p><strong>Kunyomi:</strong> {item.details.kunyomi.join(", ")}</p>
                </div>
              )}
            </div>
          ))}
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
            {!loading && round && submitResult && !submitResult.isCorrect && (
              <div className="absolute top-1/4 right-0 rotate-12 bg-red-100 text-red-700 px-4 py-2 font-bold uppercase tracking-widest text-sm border-2 border-red-700 rounded-lg opacity-80 pointer-events-none">
                Incorrect
              </div>
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
              placeholder="Hiragana or Romaji"
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
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </main>

      {/* Right sidebar: Leaderboard / Room Code */}
      <aside className="hidden w-72 shrink-0 border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="flex items-start justify-between border-b border-[var(--color-outline-variant)] p-6">
          <div>
            <h2 className="mt-1 text-lg font-bold text-[var(--color-primary)]">
              ROOM: {roomCode || "..."}
            </h2>
          </div>
          <button className="p-1 transition-none hover:bg-[var(--color-surface-container)]" aria-label="Show room QR code">
            <span className="material-symbols-outlined text-[var(--color-primary)]">qr_code</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col">
          {leaderboard.length === 0 && (
            <p className="p-4 text-sm text-[var(--color-secondary)]">Leaderboard updates after each round</p>
          )}
          {leaderboard.map((entry) => (
            <div
              key={entry.participantId}
              className={entry.active
                ? "flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] p-4"
                : "flex items-center justify-between border-b border-[var(--color-outline-variant)] p-4"}
            >
              <span className={entry.active ? "font-medium text-[var(--color-primary)]" : "font-medium text-[var(--color-secondary)]"}>
                {entry.displayName}
              </span>
              <span className={entry.active ? "font-bold text-[var(--color-primary)]" : "font-bold text-[var(--color-secondary)]"}>
                {entry.score}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-2 border-t border-[var(--color-outline-variant)] p-4">
          <Link href={`/results?session=${sessionId}&participant=${participantId}`} className="block">
            <Button variant="primary" className="w-full py-3">View results</Button>
          </Link>
          <Link href="/game/setup" className="block">
            <Button variant="secondary" className="w-full py-3">Leave</Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}
