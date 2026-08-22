"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  getHistoryStorage,
  migrateGuestHistoryToLocalStorage,
  rememberPlayedGameSession,
} from "@/features/game/history-storage";

type RoundState = {
  roundId: string;
  roundNumber: number;
  promptText: string;
  promptType: string;
  startedAt: string;
  vocabularyEntryId?: string | null;
};

type LeaderboardEntry = {
  participantId: string;
  displayName: string;
  totalScore: number;
  correctCount: number;
  rank: number;
  active: boolean;
};

type VocabularyHistoryDetails = {
  meaningsVi?: string[];
  amHanViet?: string[];
  onyomi?: string[];
  kunyomi?: string[];
  reading?: string;
  term?: string;
};

type HistoryItem = {
  promptText: string;
  rawAnswer: string;
  isCorrect: boolean;
  vocabularyEntryId?: string | null;
  details?: VocabularyHistoryDetails;
};

type VocabularyHistoryResponse = {
  vocabularyEntryId?: string;
  details?: VocabularyHistoryDetails;
};

type SessionResponse = {
  id?: string;
  roomCode?: string;
  status?: "WAITING" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
  currentRoundNumber?: number;
  currentParticipantId?: string;
  hostParticipantId?: string;
  isHost?: boolean;
  timePerPromptSeconds?: number;
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

type RoundResponse = Partial<RoundState> & {
  activeRound?: null | RoundState;
  status?: "WAITING" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
  currentRoundNumber?: number;
  maxRounds?: number;
  error?: string;
};

function isRoundState(value: RoundResponse): value is RoundState {
  return Boolean(value.roundId && value.roundNumber && value.promptText && value.promptType && value.startedAt);
}

export default function ActiveGamePage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session");
  const [participantId, setParticipantId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return searchParams.get("participant") || sessionStorage.getItem("participantId") || null;
    }
    return searchParams.get("participant") || null;
  });
  const [hydratedSessionId, setHydratedSessionId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const paramPid = searchParams.get("participant");
    if (paramPid) {
      setParticipantId(paramPid);
      if (typeof window !== "undefined") sessionStorage.setItem("participantId", paramPid);
    } else if (!participantId && typeof window !== "undefined") {
      const stored = sessionStorage.getItem("participantId");
      if (stored) setParticipantId(stored);
    }
  }, [searchParams, participantId]);

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<"submit" | "skip" | null>(null);
  const [round, setRound] = useState<RoundState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentParticipantName, setCurrentParticipantName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxRounds, setMaxRounds] = useState(10);
  const [timePerPrompt, setTimePerPrompt] = useState<number>(15);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isLeavingGame, setIsLeavingGame] = useState(false);
  const [attempts, setAttempts] = useState<number>(0);

  // Splitters for left and right panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(288);
  const [rightPanelWidth, setRightPanelWidth] = useState(288);
  const isDraggingLeftRef = useRef(false);
  const isDraggingRightRef = useRef(false);

  const handleMouseDownLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeftRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingLeftRef.current) return;
      const newWidth = event.clientX;
      setLeftPanelWidth(Math.max(200, Math.min(480, newWidth)));
    };

    const handleMouseUp = () => {
      isDraggingLeftRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseDownRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRightRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRightRef.current) return;
      const newWidth = window.innerWidth - event.clientX;
      setRightPanelWidth(Math.max(200, Math.min(480, newWidth)));
    };

    const handleMouseUp = () => {
      isDraggingRightRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const fetchingRound = useRef(false);
  const pollingRound = useRef(false);
  const pollingSession = useRef(false);
  const redirectingToResults = useRef(false);
  const leavingGameRef = useRef(false);
  const roundRef = useRef<RoundState | null>(null);
  const loadingRef = useRef(false);
  const pendingActionRef = useRef<"submit" | "skip" | null>(null);
  const advancingRoundRef = useRef(false);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

  useEffect(() => {
    if (status === "loading" || !sessionId) return;

    if (isAuthenticated) {
      migrateGuestHistoryToLocalStorage();
    }

    rememberPlayedGameSession(sessionId, getHistoryStorage(isAuthenticated));
  }, [isAuthenticated, sessionId, status]);

  // Only marks session FINISHED if the caller is the host.
  // Participants just redirect to their own results without ending the session.
  const finishAndRedirect = useCallback(async (callerIsHost?: boolean) => {
    if (!sessionId || !participantId || redirectingToResults.current) return;

    redirectingToResults.current = true;
    if (callerIsHost) {
      await fetch(`/api/game/sessions/${sessionId}/results`, { method: "POST" });
    }
    router.push(`/results?session=${sessionId}&participant=${participantId}`);
  }, [participantId, router, sessionId]);

  const fetchVocabularyHistoryDetails = useCallback(
    async (
      vocabularyEntryId: string | null | undefined,
      fallback?: VocabularyHistoryDetails
    ): Promise<VocabularyHistoryDetails | undefined> => {
      if (!vocabularyEntryId) return fallback;

      try {
        const response = await fetch(`/api/game/vocabulary/${vocabularyEntryId}`);
        if (!response.ok) return fallback;

        const data = (await response.json()) as VocabularyHistoryResponse;
        return data.details ?? fallback;
      } catch (err) {
        console.error("Failed to load vocabulary history details", err);
        return fallback;
      }
    },
    []
  );

  const applySessionResponse = useCallback((data: SessionResponse & { hostParticipantId?: string }, pidOverride?: string | null) => {
    const pid = pidOverride || data.currentParticipantId || participantId || (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null);
    if (pid) setParticipantId(pid);
    if (data.roomCode) setRoomCode(data.roomCode);
    if (data.maxRounds) setMaxRounds(data.maxRounds);
    if (data.timePerPromptSeconds) setTimePerPrompt(data.timePerPromptSeconds);
    
    const isHostVal = typeof data.isHost === "boolean"
      ? data.isHost
      : Boolean(data.hostParticipantId && pid && data.hostParticipantId === pid);
    setIsHost(isHostVal);

    const participants = Array.isArray(data.participants) ? data.participants : [];
    const standings = Array.isArray(data.standings) ? data.standings : [];

    const currentParticipant = participants.find((participant) => participant.id === pid);
    setCurrentParticipantName(currentParticipant?.displayName ?? "");

    if (standings.length > 0) {
      setLeaderboard(
        standings.map((entry) => ({
          ...entry,
          active: entry.participantId === pid,
        })),
      );
      return;
    }

    setLeaderboard((prevLeaderboard) =>
      participants.map((participant, index) => {
        const existing = prevLeaderboard.find((p) => p.participantId === participant.id);
        return {
          participantId: participant.id,
          displayName: participant.displayName,
          totalScore: existing?.totalScore ?? 0,
          correctCount: existing?.correctCount ?? 0,
          rank: index + 1,
          active: participant.id === pid,
        };
      })
    );
  }, [participantId]);

  const hydrateSession = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const response = await fetch(`/api/game/sessions/${sessionId}`);
      const data = (await response.json()) as SessionResponse & { hostParticipantId?: string };

      if (!response.ok) {
        throw new Error("Failed to load session");
      }

      const currentPid =
        data.currentParticipantId ||
        searchParams.get("participant") ||
        (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null) ||
        participantId;

      if (currentPid) {
        setParticipantId(currentPid);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("participantId", currentPid);
        }
      }

      const isHostVal = typeof data.isHost === "boolean"
        ? data.isHost
        : Boolean(data.hostParticipantId && currentPid && data.hostParticipantId === currentPid);
      setIsHost(isHostVal);

      applySessionResponse({ ...data, isHost: isHostVal }, currentPid);
      return { ...data, isHost: isHostVal };
    } finally {
      setHydratedSessionId(sessionId);
    }
  }, [applySessionResponse, participantId, searchParams, sessionId]);

  const leaveGameAndGoToLeaderboard = useCallback(async () => {
    if (!sessionId || leavingGameRef.current) return;

    leavingGameRef.current = true;
    redirectingToResults.current = true;
    setIsLeavingGame(true);
    setError(null);

    try {
      if (isHost) {
        // Host leaving: finish session for everyone, then redirect
        const response = await fetch(`/api/game/sessions/${sessionId}/results`, { method: "POST" });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to finish session");
        }
      }
      // Participant leaving: session continues, only this player is redirected to their own results
      const pid = participantId || (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null);
      router.push(`/results?session=${sessionId}${pid ? `&participant=${pid}` : ""}`);
    } catch (err) {
      leavingGameRef.current = false;
      redirectingToResults.current = false;
      setError(err instanceof Error ? err.message : "Failed to leave game");
      setIsLeaveDialogOpen(false);
    } finally {
      setIsLeavingGame(false);
    }
  }, [isHost, participantId, router, sessionId]);

  useEffect(() => {
    function interceptInternalNavigation(event: globalThis.MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !roundRef.current ||
        leavingGameRef.current
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target || target.target === "_blank" || target.hasAttribute("download")) return;

      const destination = new URL(target.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname && destination.search === window.location.search)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setIsLeaveDialogOpen(true);
    }

    document.addEventListener("click", interceptInternalNavigation, true);
    return () => document.removeEventListener("click", interceptInternalNavigation, true);
  }, []);

  const refreshRoundFromServer = useCallback(async () => {
    if (!sessionId) return null;

    const response = await fetch(`/api/game/sessions/${sessionId}/rounds`);
    const data = (await response.json()) as RoundResponse;

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to refresh round");
    }

    if (data.status === "FINISHED") {
      await finishAndRedirect();
      return null;
    }

    if (isRoundState(data)) {
      setError(null);
      const currentRound = roundRef.current;
      if (!currentRound || data.roundId !== currentRound.roundId) {
        setRound(data);
        setAnswer("");
      }
      return data;
    }

    return null;
  }, [finishAndRedirect, sessionId]);

  // Redirect if no session/participant
  useEffect(() => {
    const effectivePid =
      participantId ||
      searchParams.get("participant") ||
      (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null);

    if (!sessionId || (hydratedSessionId === sessionId && !effectivePid)) {
      router.replace("/game/setup");
    }
  }, [hydratedSessionId, sessionId, participantId, searchParams, router]);

  // Advance to next round directly (randomizes new word on server)
  const advanceToNextRound = useCallback(async () => {
    if (!sessionId || advancingRoundRef.current) return null;
    advancingRoundRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const postRes = await fetch(`/api/game/sessions/${sessionId}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      const data = (await postRes.json()) as RoundResponse;
      if (!postRes.ok) {
        throw new Error(data.error ?? "Failed to advance round");
      }

      if (data.status === "FINISHED") {
        await finishAndRedirect();
        return null;
      }

      setRound(data as RoundState);
      setAnswer("");
      setAttempts(0);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load next round");
      return null;
    } finally {
      setLoading(false);
      advancingRoundRef.current = false;
    }
  }, [finishAndRedirect, sessionId]);

  // Load or create first round
  const loadOrCreateRound = useCallback(async () => {
    if (!sessionId || fetchingRound.current) return;
    fetchingRound.current = true;
    setLoading(true);
    setError(null);
    try {
      const sessionData = await hydrateSession();
      if (sessionData?.status === "WAITING") {
        try {
          await fetch(`/api/game/sessions/${sessionId}/start`, {
            method: "POST",
          });
        } catch {
          // ignore error and proceed to load round
        }
      }

      // Try to get active round first
      const getRes = await fetch(`/api/game/sessions/${sessionId}/rounds`);
      const getData = (await getRes.json()) as RoundResponse;

      if (getRes.ok && getData.status === "FINISHED") {
        await finishAndRedirect();
        return;
      }

      if (getRes.ok && isRoundState(getData)) {
        setRound(getData);
        setAnswer("");
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
        await finishAndRedirect();
        return;
      }

      setRound(data);
      setAnswer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load round");
    } finally {
      setLoading(false);
      fetchingRound.current = false;
    }
  }, [finishAndRedirect, hydrateSession, sessionId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadOrCreateRound();
    });
  }, [loadOrCreateRound]);

  useEffect(() => {
    if (!sessionId || !participantId) return;

    const intervalId = window.setInterval(() => {
      if (pollingRound.current || loadingRef.current || pendingActionRef.current || advancingRoundRef.current) return;

      pollingRound.current = true;
      void refreshRoundFromServer()
        .then((serverRound) => {
          if (!serverRound) return;

          const currentRound = roundRef.current;
          if (!currentRound || serverRound.roundNumber !== currentRound.roundNumber) {
            void hydrateSession().catch(console.error);
          }
        })
        .catch((err) => console.error("Failed to poll round state", err))
        .finally(() => {
          pollingRound.current = false;
        });
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [hydrateSession, participantId, refreshRoundFromServer, sessionId]);

  useEffect(() => {
    if (!sessionId || !participantId) return;

    const intervalId = window.setInterval(() => {
      if (pollingSession.current || loadingRef.current || pendingActionRef.current || advancingRoundRef.current) return;

      pollingSession.current = true;
      void hydrateSession()
        .then((data) => {
          if (!data) return;
          if (data.status === "FINISHED") {
            void finishAndRedirect();
            return;
          }

          const currentRound = roundRef.current;
          if (!currentRound) {
            void loadOrCreateRound();
          } else if (
            data.status === "IN_PROGRESS" &&
            typeof data.currentRoundNumber === "number" &&
            data.currentRoundNumber !== currentRound.roundNumber
          ) {
            void refreshRoundFromServer().catch(console.error);
          }
        })
        .catch((err) => console.error("Failed to poll session state", err))
        .finally(() => {
          pollingSession.current = false;
        });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [finishAndRedirect, hydrateSession, participantId, refreshRoundFromServer, sessionId]);

  async function handleSubmit() {
    if (!sessionId || !participantId || !round) return;
    if (!answer.trim()) {
      await handleSkip();
      return;
    }
    setLoading(true);
    setPendingAction("submit");
    setError(null);

    try {
      const currentAttemptNumber = attempts + 1;
      const res = await fetch(`/api/game/sessions/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawAnswer: answer,
          participantId,
          attemptCount: currentAttemptNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");

      if (data.isCorrect) {
        setAttempts(0);
        // Award 1 point to current player on right panel
        setLeaderboard((prev) =>
          prev.map((entry) =>
            entry.participantId === participantId
              ? {
                  ...entry,
                  totalScore: entry.totalScore + 1,
                  correctCount: entry.correctCount + 1,
                }
              : entry
          )
        );

        const vocabularyEntryId = data.vocabularyEntryId ?? round.vocabularyEntryId;
        const details = await fetchVocabularyHistoryDetails(vocabularyEntryId, data.details ?? undefined);

        setHistory((prev) => [
          {
            promptText: round.promptText,
            rawAnswer: answer,
            isCorrect: true,
            vocabularyEntryId,
            details,
          },
          ...prev.slice(0, 19),
        ]);

        setAnswer("");
        if (data.shouldAdvance) {
          await advanceToNextRound();
        }
        await hydrateSession();
      } else {
        // Incorrect answer
        if (currentAttemptNumber < 3) {
          setAttempts(currentAttemptNumber);

          // Record incorrect attempt to Word History (without revealing details yet)
          setHistory((prev) => [
            {
              promptText: round.promptText,
              rawAnswer: answer,
              isCorrect: false,
              vocabularyEntryId: round.vocabularyEntryId,
              details: undefined,
            },
            ...prev.slice(0, 19),
          ]);

          setAnswer("");
        } else {
          // 3rd incorrect attempt -> reveal details, add to history, advance round
          setAttempts(0);
          const vocabularyEntryId = data.vocabularyEntryId ?? round.vocabularyEntryId;
          const details = await fetchVocabularyHistoryDetails(vocabularyEntryId, data.details ?? undefined);

          setHistory((prev) => [
            {
              promptText: round.promptText,
              rawAnswer: answer,
              isCorrect: false,
              vocabularyEntryId,
              details,
            },
            ...prev.slice(0, 19),
          ]);

          setAnswer("");
          if (data.shouldAdvance) {
            await advanceToNextRound();
          }
          await hydrateSession();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  async function handleFinish(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!sessionId || !participantId) return;

    setLoading(true);
    setError(null);

    try {
      await finishAndRedirect(isHost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish session");
      setLoading(false);
    }
  }

  const advanceRoundWithReason = useCallback(
    async (reasonLabel: string) => {
      if (
        !sessionId ||
        !participantId ||
        !roundRef.current ||
        loadingRef.current ||
        pendingActionRef.current ||
        advancingRoundRef.current
      ) {
        return;
      }

      advancingRoundRef.current = true;
      setLoading(true);
      setPendingAction("skip");
      setError(null);
      setAttempts(0);

      try {
        const currentRound = roundRef.current;
        const response = await fetch(`/api/game/sessions/${sessionId}/rounds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "skip" }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? `Failed to advance round (${reasonLabel})`);
        }

        if (data.skippedRoundDetails) {
          const vocabularyEntryId = data.skippedRoundDetails.vocabularyEntryId ?? currentRound.vocabularyEntryId;
          const details = await fetchVocabularyHistoryDetails(
            vocabularyEntryId,
            data.skippedRoundDetails.details
          );

          setHistory((prev) => [
            {
              promptText: data.skippedRoundDetails.promptText,
              rawAnswer: reasonLabel,
              isCorrect: false,
              vocabularyEntryId,
              details,
            },
            ...prev.slice(0, 19),
          ]);
        }

        if (data.status === "FINISHED") {
          await finishAndRedirect();
          return;
        }

        setRound(data);
        setAnswer("");
        await hydrateSession();
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to skip round (${reasonLabel})`);
      } finally {
        setLoading(false);
        setPendingAction(null);
        advancingRoundRef.current = false;
      }
    },
    [fetchVocabularyHistoryDetails, finishAndRedirect, hydrateSession, participantId, sessionId]
  );

  async function handleSkip() {
    await advanceRoundWithReason("Skipped");
  }

  const handleTimeout = useCallback(async () => {
    await advanceRoundWithReason("Hết giờ (Time out)");
  }, [advanceRoundWithReason]);

  // Reset timer on new round
  useEffect(() => {
    if (round?.roundId) {
      setTimeLeft(timePerPrompt);
    }
  }, [round?.roundId, timePerPrompt]);

  // Active countdown timer
  useEffect(() => {
    if (!round || loading || pendingAction) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [round, loading, pendingAction, handleTimeout]);

  const progressValue = round ? (round.roundNumber / maxRounds) * 100 : 0;
  const promptLength = round?.promptText.length ?? 0;
  const promptSizeClass =
    promptLength >= 4
      ? "text-[4.5rem] md:text-[5.5rem]"
      : promptLength >= 2
        ? "text-[5.5rem] md:text-[7.5rem]"
        : "text-[7rem] md:text-[9.5rem]";

  if (!sessionId) return null;

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col lg:h-[calc(100vh-65px)] lg:flex-row">
      {/* Left Sidebar: Word history */}
      <aside
        className="hidden shrink-0 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col"
        style={{ width: `${leftPanelWidth}px` }}
      >
        <div className="border-b border-[var(--color-outline-variant)] p-4">
          <h2 className="mb-0.5 font-[family-name:var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.05em] text-[var(--color-secondary)]">
            Session Data
          </h2>
          <h3 className="font-[family-name:var(--font-headline)] text-base font-bold text-[var(--color-primary)]">
            Word History
          </h3>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto scrollbar-subtle">
          {history.length === 0 && (
            <p className="border-b border-[var(--color-outline-variant)] p-4 text-xs text-[var(--color-secondary)]">
              No history yet.
            </p>
          )}
          {history.map((item, index) => {
            const readings = item.details
              ? [
                  ...(Array.isArray(item.details.kunyomi) ? item.details.kunyomi : []),
                  ...(Array.isArray(item.details.onyomi) ? item.details.onyomi : []),
                  ...(item.details.reading ? [item.details.reading] : []),
                ].filter(Boolean)
              : [];
            const readingLabel = readings.length > 0 ? readings.join(" / ") : item.rawAnswer;
            const secondaryLabel =
              item.details?.amHanViet?.[0] ||
              readingLabel ||
              item.details?.meaningsVi?.[0] ||
              item.rawAnswer ||
              "—";
            const tertiaryLabel = item.details?.meaningsVi?.[0] || item.rawAnswer || "—";

            return (
              <div
                key={`${item.promptText}-${index}`}
                className="border-b border-[var(--color-outline-variant)] p-3.5 transition-none hover:bg-[var(--color-surface-container)]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-[family-name:var(--font-headline)] text-2xl font-bold leading-none text-[var(--color-primary)]">
                    {item.promptText}
                  </span>
                  <div
                    className={item.isCorrect
                      ? "flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--color-primary)]"
                      : "flex h-5 w-5 shrink-0 items-center justify-center border-2 border-[var(--color-primary)] bg-transparent"}
                    aria-label={item.isCorrect ? "Correct answer" : "Incorrect or skipped answer"}
                  >
                    {item.isCorrect ? (
                      <span className="material-symbols-outlined text-[12px] font-bold text-[var(--color-on-primary)]">
                        check
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[12px] font-bold text-[var(--color-primary)]">
                        close
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  {secondaryLabel}
                </span>
                {item.details && (
                  <>
                    <span className="mt-0.5 block text-xs text-[var(--color-secondary)]">{readingLabel}</span>
                    <span className="mt-0.5 block text-xs text-[var(--color-secondary)] line-clamp-1">{tertiaryLabel}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Splitter 1: Between Word History & Main (Discreet, visible on hover - Gray) */}
      <div
        onMouseDown={handleMouseDownLeft}
        className="group relative hidden lg:flex w-2 -mr-[4px] z-30 cursor-col-resize items-center justify-center bg-transparent hover:bg-neutral-200/40 transition-colors"
        title="Drag to resize Word History panel"
      >
        <div className="h-full w-[2px] bg-neutral-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150" />
        <div className="absolute h-8 w-1 rounded-full bg-neutral-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150" />
      </div>

      {/* Main: Prompt + Answer */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
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
              <h1 className={`select-none whitespace-nowrap text-center font-[family-name:var(--font-headline)] font-bold leading-none text-[var(--color-primary)] transition-all ${promptSizeClass}`}>
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
              className={`text-xl font-medium text-[var(--color-primary)] placeholder:text-[var(--color-outline-variant)] ${
                attempts > 0 ? "border-red-400 focus-visible:ring-red-400" : ""
              }`}
            />
            <Button
              variant="primary"
              className="mt-4 w-full py-3"
              onClick={handleSubmit}
              disabled={loading || !round}
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

      {/* Splitter 2: Between Main & Study_Session (Discreet, visible on hover - Gray) */}
      <div
        onMouseDown={handleMouseDownRight}
        className="group relative hidden lg:flex w-2 -ml-[4px] z-30 cursor-col-resize items-center justify-center bg-transparent hover:bg-neutral-200/40 transition-colors"
        title="Drag to resize Study Session panel"
      >
        <div className="h-full w-[2px] bg-neutral-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150" />
        <div className="absolute h-8 w-1 rounded-full bg-neutral-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150" />
      </div>

      {/* Right sidebar: Leaderboard / Room Code */}
      <aside
        className="hidden shrink-0 border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col"
        style={{ width: `${rightPanelWidth}px` }}
      >
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

        <div className="flex flex-1 flex-col overflow-y-auto scrollbar-subtle">
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

      {isLeaveDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-game-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLeavingGame) {
              setIsLeaveDialogOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-md border-2 border-[var(--color-primary)] bg-[var(--color-surface)] p-8 shadow-2xl">
            {/* Top decorative left accent line */}
            <div className="absolute top-0 left-0 bottom-0 w-2 bg-[var(--color-primary)]" />

            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-xl">
                logout
              </span>
              <p className="font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Active Match
              </p>
            </div>

            <h2 id="leave-game-title" className="font-[family-name:var(--font-headline)] text-2xl font-bold tracking-tight text-[var(--color-primary)] md:text-3xl">
              Leave this game?
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-[var(--color-secondary)]">
              {isHost
                ? "Leaving now will conclude the active session for all participants and redirect to the final match results."
                : "You will leave this game session and navigate to the standings. The host and other players will continue."}
            </p>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                className="px-6 py-3 text-xs uppercase tracking-wider font-semibold"
                onClick={() => setIsLeaveDialogOpen(false)}
                disabled={isLeavingGame}
              >
                Stay in Match
              </Button>
              <Button 
                variant="primary" 
                className="px-6 py-3 text-xs uppercase tracking-wider font-semibold !text-white"
                onClick={leaveGameAndGoToLeaderboard} 
                disabled={isLeavingGame}
              >
                {isLeavingGame ? "Leaving..." : "Leave Match"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
