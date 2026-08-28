"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getHistoryStorage,
  migrateGuestHistoryToLocalStorage,
  rememberPlayedGameSession,
} from "@/features/game/history-storage";

interface ShiritoriWordItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  participantId?: string | null;
  participantName: string;
  participantAvatarUrl?: string | null;
  isBot?: boolean;
  submittedAt?: string;
}

interface ShiritoriParticipant {
  id: string;
  displayName: string;
  userId?: string | null;
  avatarUrl?: string | null;
  isBot?: boolean;
  isEliminated?: boolean;
  wordsCount: number;
  totalScore: number;
  rank: number;
}

interface ShiritoriStateResponse {
  sessionId: string;
  roomCode: string;
  timePerTurn: number;
  status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  currentWord: string;
  currentReading: string;
  currentMeaning: string;
  lastKana: string;
  chainLength: number;
  turnParticipantId: string;
  turnRemainingSeconds: number;
  isYourTurn: boolean;
  winnerParticipantId?: string | null;
  winnerName?: string | null;
  participants: ShiritoriParticipant[];
  chainHistory: ShiritoriWordItem[];
}

function UserAvatar({
  avatarUrl,
  displayName,
  isBot,
  className = "",
}: {
  avatarUrl?: string | null;
  displayName?: string | null;
  isBot?: boolean;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = (displayName || "P").trim().charAt(0).toUpperCase();

  if (avatarUrl && !imgError && !isBot) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || "Player"}
        onError={() => setImgError(true)}
        className={cn("h-7 w-7 rounded-none object-cover border border-[var(--color-primary)] shrink-0", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center border font-bold text-xs rounded-none select-none",
        isBot
          ? "border-[var(--color-secondary)] bg-[var(--color-surface-container-high)] text-[var(--color-secondary)]"
          : "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]",
        className
      )}
    >
      {isBot ? "AI" : initial}
    </div>
  );
}

export default function ShiritoriPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const participantParam = searchParams.get("participant");
  const { data: authSession } = useSession();

  const [gameState, setGameState] = useState<ShiritoriStateResponse | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(participantParam);
  const [inputWord, setInputWord] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!participantId && typeof window !== "undefined") {
      const stored = sessionStorage.getItem("participantId");
      if (stored) setParticipantId(stored);
    }
  }, [participantId]);

  useEffect(() => {
    if (!sessionId) return;
    const isAuthenticated = authSession?.user != null;
    if (isAuthenticated) {
      migrateGuestHistoryToLocalStorage();
    }
    rememberPlayedGameSession(sessionId, getHistoryStorage(isAuthenticated));
  }, [authSession?.user, sessionId]);

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const pid = participantId || (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null);
      const queryStr = pid ? `?participantId=${encodeURIComponent(pid)}` : "";
      const res = await fetch(`/api/game/shiritori/${sessionId}${queryStr}`);
      if (!res.ok) return;
      const data = (await res.json()) as ShiritoriStateResponse;
      setGameState(data);
      setLoading(false);
    } catch (err) {
      console.warn("Failed to fetch Shiritori state", err);
    }
  }, [participantId, sessionId]);

  // Initial load and polling
  useEffect(() => {
    if (!sessionId) {
      router.push("/shiritori/setup");
      return;
    }

    void fetchState();

    const interval = setInterval(() => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      void fetchState().finally(() => {
        pollingRef.current = false;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchState, router, sessionId]);

  // Auto focus input on user turn
  useEffect(() => {
    if (gameState?.isYourTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState?.isYourTurn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !inputWord.trim() || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const pid = participantId || (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null);
      const res = await fetch(`/api/game/shiritori/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: pid,
          word: inputWord.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Invalid word");
      }

      if (data.eliminated) {
        setSubmitError(data.message || "Word ended in 'ん' — You have been eliminated!");
      }

      setInputWord("");
      void fetchState();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit word");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = async () => {
    if (!sessionId || restarting) return;
    setRestarting(true);
    try {
      const pid = participantId || (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null);
      await fetch(`/api/game/shiritori/${sessionId}/restart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: pid }),
      });
      void fetchState();
    } catch (err) {
      console.error("Failed to restart Shiritori session", err);
    } finally {
      setRestarting(false);
    }
  };

  const copyRoomCode = () => {
    if (!gameState?.roomCode) return;
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !gameState) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-[var(--color-surface)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin border-2 border-[var(--color-primary)] border-t-transparent"></div>
          <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
            Loading Shiritori Room...
          </p>
        </div>
      </div>
    );
  }

  const turnProgress = Math.max(0, Math.min(100, (gameState.turnRemainingSeconds / gameState.timePerTurn) * 100));
  const activeParticipant = gameState.participants.find((p) => p.id === gameState.turnParticipantId);
  const currentParticipant = gameState.participants.find((p) => p.id === participantId);
  const isFinished = gameState.status === "FINISHED";

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col lg:h-[calc(100vh-65px)] lg:flex-row bg-[var(--color-surface)] select-none">
      {/* Left Sidebar: Chain History */}
      <aside className="w-full lg:w-80 shrink-0 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex flex-col h-64 lg:h-auto overflow-hidden">
        <div className="border-b border-[var(--color-outline-variant)] p-4 md:p-6 flex items-center justify-between">
          <div>
            <span className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)] block">
              History
            </span>
            <h2 className="text-base font-bold text-[var(--color-primary)]">
              Chain History
            </h2>
          </div>
          <span className="px-2.5 py-0.5 border border-[var(--color-outline-variant)] bg-[var(--color-surface)] font-[family-name:var(--font-headline)] text-xs font-bold text-[var(--color-primary)]">
            {gameState.chainLength} {gameState.chainLength === 1 ? "word" : "words"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-outline-variant)] p-2">
          {gameState.chainHistory.map((item, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={item.id}
                className={cn(
                  "p-3.5 transition-colors",
                  isFirst
                    ? "bg-[var(--color-surface-container-highest)] border-l-4 border-l-[var(--color-primary)]"
                    : "hover:bg-[var(--color-surface-container)]"
                )}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-primary)]">
                    {item.word}
                  </span>
                  <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-[var(--color-secondary)] truncate max-w-[110px]">
                    {item.participantName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--color-secondary)]">
                  <span className="font-[family-name:var(--font-body)] italic truncate">
                    {item.reading}
                  </span>
                  {item.meaning && (
                    <span className="truncate max-w-[140px] text-[11px] text-[var(--color-primary)] font-medium">
                      {item.meaning}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Center Area: Active Word & Turn Input */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
        {/* Top Progress bar for turn timer */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--color-surface-container-high)]">
          <div
            className={cn(
              "h-full transition-all duration-300",
              gameState.turnRemainingSeconds <= 3 ? "bg-red-600" : "bg-[var(--color-primary)]"
            )}
            style={{ width: `${turnProgress}%` }}
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
          {/* Active Word Display */}
          <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
            <span className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)] mb-4">
              Current Word • Chain #{gameState.chainLength}
            </span>

            {/* Giant Japanese Word Display with Highlighted Last Kana */}
            <h1 className="font-[family-name:var(--font-headline)] text-6xl md:text-8xl lg:text-9xl font-bold leading-none text-[var(--color-primary)] tracking-tight">
              {gameState.currentWord.slice(0, -1)}
              <span className="text-[var(--color-primary)] underline decoration-[var(--color-primary)] decoration-4 underline-offset-8">
                {gameState.currentWord.slice(-1)}
              </span>
            </h1>

            {/* Reading and Meaning */}
            <p className="mt-6 font-[family-name:var(--font-body)] text-lg md:text-xl text-[var(--color-secondary)] tracking-wide">
              {gameState.currentReading}
              {gameState.currentMeaning && (
                <span className="ml-2 font-medium text-[var(--color-primary)]">
                  ({gameState.currentMeaning})
                </span>
              )}
            </p>

            {/* Target Kana Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 border border-[var(--color-primary)] bg-[var(--color-surface-container-lowest)] shadow-sm">
              <span className="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
                Next word must start with:
              </span>
              <span className="font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-primary)] px-1">
                {gameState.lastKana}
              </span>
            </div>
          </div>

          {/* Turn Input Area */}
          <div className="w-full max-w-lg pb-4">
            <div className="mb-2 flex items-center justify-between font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-[0.15em]">
              <span className={gameState.isYourTurn ? "text-[var(--color-primary)] font-bold" : "text-[var(--color-secondary)]"}>
                {gameState.isYourTurn
                  ? "Your Turn — Enter Japanese Word"
                  : `Waiting for ${activeParticipant?.displayName || "Player"}...`}
              </span>
              <span className={cn("font-bold text-sm", gameState.turnRemainingSeconds <= 5 ? "text-red-600 animate-pulse" : "text-[var(--color-primary)]")}>
                00:{String(gameState.turnRemainingSeconds).padStart(2, "0")}
              </span>
            </div>

            {submitError && (
              <div className="mb-3 border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex items-center">
              {/* Fixed starting kana anchor prefix */}
              <span className="absolute left-4 font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)] opacity-80 pointer-events-none select-none">
                {gameState.lastKana}
              </span>

              <Input
                ref={inputRef}
                type="text"
                value={inputWord}
                onChange={(e) => {
                  setInputWord(e.target.value);
                  setSubmitError(null);
                }}
                disabled={!gameState.isYourTurn || submitting || isFinished}
                placeholder="Enter word in Kanji/Kana..."
                className="h-16 pl-14 pr-24 border-2 border-[var(--color-primary)] bg-[var(--color-surface-container-lowest)] font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-primary)] placeholder:text-[var(--color-outline-variant)] rounded-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20 shadow-sm"
              />

              <Button
                type="submit"
                variant="primary"
                disabled={!gameState.isYourTurn || !inputWord.trim() || submitting || isFinished}
                className="absolute right-2 h-12 px-5 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest !text-white"
              >
                {submitting ? "..." : "Chain"}
              </Button>
            </form>

            <p className="mt-2 text-center font-[family-name:var(--font-body)] text-[11px] text-[var(--color-secondary)]">
              {gameState.isYourTurn
                ? "Press Enter to submit. Words ending in 'ん' will eliminate you!"
                : `AI Bot or opponent is thinking...`}
            </p>
          </div>
        </div>
      </main>

      {/* Right Sidebar: Room Panel & Standings */}
      <aside className="w-full lg:w-80 shrink-0 border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex flex-col justify-between overflow-hidden">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--color-outline-variant)] p-4 md:p-6">
            <div>
              <p className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Shiritori Room
              </p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-lg font-bold text-[var(--color-primary)] font-[family-name:var(--font-headline)]">
                  {gameState.roomCode}
                </h2>
                <button
                  onClick={copyRoomCode}
                  className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors p-1"
                  title="Copy room code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Chain
              </p>
              <p className="text-2xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-headline)]">
                {gameState.chainLength}
              </p>
            </div>
          </div>

          {/* Standings List */}
          <div className="divide-y divide-[var(--color-outline-variant)]">
            {gameState.participants.map((player) => {
              const isCurrent = player.id === participantId;
              const isTurn = player.id === gameState.turnParticipantId;

              return (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between p-3.5 transition-colors",
                    player.isEliminated
                      ? "opacity-40 bg-[var(--color-surface-container-lowest)]"
                      : isTurn
                        ? "bg-[var(--color-surface-container-highest)] border-l-4 border-l-[var(--color-primary)]"
                        : "hover:bg-[var(--color-surface-container)]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-headline)] font-bold text-xs text-[var(--color-secondary)] w-4 text-center">
                      #{player.rank}
                    </span>
                    <UserAvatar
                      avatarUrl={player.avatarUrl}
                      displayName={player.displayName}
                      isBot={player.isBot}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-medium text-xs text-[var(--color-primary)] truncate max-w-[110px]", isCurrent && "font-bold")}>
                          {player.displayName}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase px-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded">
                            You
                          </span>
                        )}
                      </div>
                      {player.isEliminated && (
                        <span className="text-[10px] font-semibold uppercase text-red-600 tracking-wider">
                          Eliminated
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-[var(--color-primary)] font-[family-name:var(--font-headline)] block">
                      {player.wordsCount} {player.wordsCount === 1 ? "word" : "words"}
                    </span>
                    <span className="text-[10px] text-[var(--color-secondary)] font-medium">
                      {player.totalScore} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="grid gap-2 border-t border-[var(--color-outline-variant)] p-4 bg-[var(--color-surface-container-lowest)]">
          <Button
            variant="secondary"
            className="w-full py-3 text-xs uppercase tracking-wider font-semibold"
            onClick={handleRestart}
            disabled={restarting}
          >
            {restarting ? "Resetting..." : "Play Again / Reset"}
          </Button>
          <Link href="/shiritori/setup" className="block">
            <Button variant="tertiary" className="w-full py-2.5 text-xs uppercase tracking-wider font-semibold text-[var(--color-secondary)]">
              Exit to Setup
            </Button>
          </Link>
        </div>
      </aside>

      {/* Game Over / Winner Dialog Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border-2 border-[var(--color-primary)] bg-[var(--color-surface)] p-8 shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 border border-[var(--color-primary)] bg-[var(--color-surface-container-low)]">
                <Crown className="w-8 h-8 text-[var(--color-primary)] fill-[var(--color-primary)]" />
              </div>
            </div>

            <h2 className="font-[family-name:var(--font-headline)] text-3xl font-bold uppercase tracking-tight text-[var(--color-primary)] mb-2">
              Shiritori Match Concluded!
            </h2>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)] mb-6">
              Final Chain Length: <strong className="text-[var(--color-primary)] font-bold">{gameState.chainLength} Words</strong>
            </p>

            {gameState.winnerName && (
              <div className="mb-6 p-4 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-[var(--color-secondary)] block mb-1">
                  Champion
                </span>
                <p className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-primary)]">
                  {gameState.winnerName}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                className="w-full py-3 text-xs uppercase tracking-wider font-semibold !text-white"
                onClick={handleRestart}
                disabled={restarting}
              >
                {restarting ? "Restarting..." : "Play Again"}
              </Button>
              <Link href="/shiritori/setup" className="block">
                <Button variant="secondary" className="w-full py-3 text-xs uppercase tracking-wider font-semibold">
                  New Room
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
