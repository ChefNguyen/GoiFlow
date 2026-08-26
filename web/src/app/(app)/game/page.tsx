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
  avatarUrl?: string | null;
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
  id?: string;
  promptText: string;
  rawAnswer: string;
  isCorrect: boolean;
  attemptCount?: number;
  submittedAt?: string;
  participantId?: string | null;
  participantName?: string | null;
  participantAvatarUrl?: string | null;
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
  participants?: Array<{ id: string; displayName: string; avatarUrl?: string | null; role?: string }>;
  standings?: Array<{
    participantId: string;
    displayName: string;
    avatarUrl?: string | null;
    totalScore: number;
    correctCount: number;
    rank: number;
  }>;
  history?: HistoryItem[];
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

function UserAvatarBox({
  avatarUrl,
  displayName,
  size = "md",
}: {
  avatarUrl?: string | null;
  displayName?: string | null;
  size?: "sm" | "md";
}) {
  const initial = (displayName || "U").trim().charAt(0).toUpperCase();
  const sizeClass = size === "sm" ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[10px]";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || "Player"}
        className={`${sizeClass} rounded-none object-cover border border-[var(--color-primary)] shrink-0`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center border border-[var(--color-primary)] bg-[var(--color-primary)] font-bold text-[var(--color-on-primary)] rounded-none select-none`}
    >
      {initial}
    </div>
  );
}

export default function ActiveGamePage() {
  const { data: authSession, status } = useSession();
  const currentUserAvatar = authSession?.user?.image ?? null;
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
  // Participants notify the server that they left and redirect to their own results.
  const finishAndRedirect = useCallback(async (callerIsHost?: boolean) => {
    if (!sessionId || !participantId || redirectingToResults.current) return;

    redirectingToResults.current = true;
    try {
      if (callerIsHost) {
        await fetch(`/api/game/sessions/${sessionId}/results`, { method: "POST" });
      } else {
        await fetch(`/api/game/sessions/${sessionId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId }),
        });
      }
    } catch (err) {
      console.warn("Failed to notify leave/finish:", err);
    }
    router.push(`/results?session=${sessionId}&participant=${participantId}`);
  }, [participantId, router, sessionId]);

  const fetchVocabularyHistoryDetails = useCallback(
    async (
      vocabularyEntryId: string | null | undefined,
      fallback?: VocabularyHistoryDetails
    ): Promise<VocabularyHistoryDetails | undefined> => {
      // If details were already provided by the backend response, use them directly with 0 network calls!
      if (fallback) return fallback;
      if (!vocabularyEntryId) return undefined;

      try {
        const response = await fetch(`/api/game/vocabulary/${vocabularyEntryId}`);
        if (!response.ok) return undefined;

        const data = (await response.json()) as VocabularyHistoryResponse;
        return data.details;
      } catch (err) {
        console.error("Failed to load vocabulary history details", err);
        return undefined;
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
          avatarUrl: entry.avatarUrl ?? null,
          active: entry.participantId === pid,
        })),
      );
    } else {
      setLeaderboard((prevLeaderboard) =>
        participants.map((participant, index) => {
          const existing = prevLeaderboard.find((p) => p.participantId === participant.id);
          return {
            participantId: participant.id,
            displayName: participant.displayName,
            avatarUrl: participant.avatarUrl ?? null,
            totalScore: existing?.totalScore ?? 0,
            correctCount: existing?.correctCount ?? 0,
            rank: index + 1,
            active: participant.id === pid,
          };
        })
      );
    }

    // Synchronize global Word History from server across all participants.
    // Smart merge: enrich server history items with avatar URLs from participants/standings,
    // and keep recent local real-time items without duplicates.
    if (Array.isArray(data.history)) {
      const avatarByPid: Record<string, string | null> = {};
      for (const p of participants) {
        if (p.avatarUrl) avatarByPid[p.id] = p.avatarUrl;
      }
      for (const s of standings) {
        if (s.avatarUrl) avatarByPid[s.participantId] = s.avatarUrl;
      }

      // Map server items from PostgreSQL (authoritative source of truth for all N participants).
      const serverItems: HistoryItem[] = (data.history as HistoryItem[])
        .map((item) => {
          const attemptCount = item.attemptCount ?? 1;
          const isUnsubmittedRound = item.participantId == null && item.rawAnswer === "—";
          // Show vocabulary details if all participants had attempt=0 (unsubmitted round),
          // or if the answer was correct, or reached 3 attempts / skipped
          const shouldShowDetails = isUnsubmittedRound || item.isCorrect || attemptCount >= 3;
          return {
            ...item,
            details: shouldShowDetails ? item.details : undefined,
            participantAvatarUrl: item.participantAvatarUrl ?? (item.participantId ? avatarByPid[item.participantId] ?? null : null),
          };
        });

      // If a word has at least one real participant submission, drop any 0-attempt fallback for that word
      const promptsWithRealSubmissions = new Set(
        serverItems
          .filter((i) => i.participantId != null)
          .map((i) => i.promptText)
      );
      const filteredServerItems = serverItems.filter(
        (i) => !(i.participantId == null && i.rawAnswer === "—" && promptsWithRealSubmissions.has(i.promptText))
      );

      setHistory((prevHistory) => {
        const seenKeys = new Set<string>();
        const merged: HistoryItem[] = [];

        // 1. Add all authoritative server items from PostgreSQL
        for (const item of filteredServerItems) {
          const attemptKey = `${item.promptText}_${item.participantId ?? ""}_${item.attemptCount ?? item.rawAnswer}`;
          if (!seenKeys.has(attemptKey)) {
            seenKeys.add(attemptKey);
            merged.push(item);
          }
        }

        // 2. Local optimistic cache: strictly scoped to CURRENT user only,
        // and only when the server has not yet returned any submission for this user on this word.
        // For all other participants, data is 100% driven by PostgreSQL to ensure seamless N-player sync.
        const serverUserPrompts = new Set(
          filteredServerItems
            .filter((s) => s.participantId === pid)
            .map((s) => s.promptText)
        );
        for (const local of prevHistory) {
          if (!pid || local.participantId !== pid) continue;
          if (!serverUserPrompts.has(local.promptText)) {
            const localKey = `${local.promptText}_${local.participantId}_${local.attemptCount ?? local.rawAnswer}`;
            if (!seenKeys.has(localKey)) {
              seenKeys.add(localKey);
              merged.push(local);
            }
          }
        }

        // 3. Sort newest-first by submittedAt (parsed to ms for correct Java/JS format handling),
        // with attemptCount and id as tiebreakers for fully deterministic order across all clients.
        const parseTs = (s: string | undefined): number =>
          s ? (new Date(s).getTime() || 0) : 0;
        merged.sort((a, b) => {
          const cmp1 = parseTs(b.submittedAt) - parseTs(a.submittedAt);
          if (cmp1 !== 0) return cmp1;
          const cmp2 = (b.attemptCount ?? 0) - (a.attemptCount ?? 0);
          if (cmp2 !== 0) return cmp2;
          // Final tiebreak: sort by id so ALL clients see identical ordering
          return (b.id ?? "").localeCompare(a.id ?? "");
        });

        return merged.slice(0, 50);
      });
    }
  }, [participantId]);

  const hydrateSession = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const pidParam =
        participantId ||
        searchParams.get("participant") ||
        (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null);
      const queryStr = pidParam ? `?participantId=${encodeURIComponent(pidParam)}` : "";
      const response = await fetch(`/api/game/sessions/${sessionId}${queryStr}`);

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error ?? `Failed to load session (HTTP ${response.status})`);
      }

      const data = (await response.json().catch(() => null)) as (SessionResponse & { hostParticipantId?: string }) | null;
      if (!data) return null;

      const currentPid =
        data.currentParticipantId ||
        pidParam;

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
    } catch (err) {
      console.warn("Hydrate session error:", err instanceof Error ? err.message : err);
      return null;
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

    const pid = participantId || (typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null);

    try {
      if (isHost) {
        // Host leaving: finish session for everyone, then redirect
        const response = await fetch(`/api/game/sessions/${sessionId}/results`, { method: "POST" });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to finish session");
        }
      } else if (pid) {
        // Non-host guest leaving: notify server to immediately remove this participant from study_session
        await fetch(`/api/game/sessions/${sessionId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: pid }),
        });
      }
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
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !sessionId ||
        leavingGameRef.current ||
        redirectingToResults.current
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target || target.target === "_blank" || target.hasAttribute("download")) return;

      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      // Do not intercept if clicking inside the leave dialog itself or the finish button on the side
      if (target.closest('[role="dialog"]')) return;

      try {
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
      } catch {
        // invalid URL, ignore
      }
    }

    // Intercept in capture phase before Next.js Link or React bubbling handlers
    document.addEventListener("click", interceptInternalNavigation, true);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionId && !leavingGameRef.current && !redirectingToResults.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    const handlePopState = () => {
      if (sessionId && !leavingGameRef.current && !redirectingToResults.current) {
        window.history.pushState(null, "", window.location.href);
        setIsLeaveDialogOpen(true);
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", interceptInternalNavigation, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [sessionId]);

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
        body: JSON.stringify({ action: "advance", participantId }),
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
      if (pollingSession.current || redirectingToResults.current || leavingGameRef.current) return;

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
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [finishAndRedirect, hydrateSession, loadOrCreateRound, participantId, refreshRoundFromServer, sessionId]);

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
        const currentAvatar = leaderboard.find((e) => e.participantId === participantId)?.avatarUrl ?? null;

        const newEntry: HistoryItem = {
          id: `${data.submissionId}_att${currentAttemptNumber}`,
          promptText: round.promptText,
          rawAnswer: answer,
          isCorrect: true,
          attemptCount: currentAttemptNumber,
          submittedAt: new Date().toISOString(),
          participantId,
          participantName: currentParticipantName || authSession?.user?.name || "Player",
          participantAvatarUrl: currentAvatar,
          vocabularyEntryId,
          details,
        };

        setHistory((prev) => [
          newEntry,
          ...prev.filter(
            (i) =>
              !(
                i.promptText === round.promptText &&
                i.participantId === participantId &&
                i.attemptCount === currentAttemptNumber
              )
          ),
        ].slice(0, 30));

        setAnswer("");
        if (data.shouldAdvance) {
          await advanceToNextRound();
        }
        await hydrateSession();
      } else {
        // Incorrect answer
        const currentAvatar = leaderboard.find((e) => e.participantId === participantId)?.avatarUrl ?? null;
        if (currentAttemptNumber < 3) {
          setAttempts(currentAttemptNumber);

          const newEntry: HistoryItem = {
            id: `${data.submissionId}_att${currentAttemptNumber}`,
            promptText: round.promptText,
            rawAnswer: answer,
            isCorrect: false,
            attemptCount: currentAttemptNumber,
            submittedAt: new Date().toISOString(),
            participantId,
            participantName: currentParticipantName || authSession?.user?.name || "Player",
            participantAvatarUrl: currentAvatar,
            vocabularyEntryId: round.vocabularyEntryId,
            details: undefined,
          };

          setHistory((prev) => [
            newEntry,
            ...prev.filter(
              (i) =>
                !(
                  i.promptText === round.promptText &&
                  i.participantId === participantId &&
                  i.attemptCount === currentAttemptNumber
                )
            ),
          ].slice(0, 30));

          setAnswer("");
        } else {
          // 3rd incorrect attempt -> reveal details, add to history, advance round
          setAttempts(0);
          const vocabularyEntryId = data.vocabularyEntryId ?? round.vocabularyEntryId;
          const details = await fetchVocabularyHistoryDetails(vocabularyEntryId, data.details ?? undefined);

          const newEntry: HistoryItem = {
            id: `${data.submissionId}_att3`,
            promptText: round.promptText,
            rawAnswer: answer,
            isCorrect: false,
            attemptCount: 3,
            submittedAt: new Date().toISOString(),
            participantId,
            participantName: currentParticipantName || authSession?.user?.name || "Player",
            participantAvatarUrl: currentAvatar,
            vocabularyEntryId,
            details,
          };

          setHistory((prev) => [
            newEntry,
            ...prev.filter(
              (i) =>
                !(
                  i.promptText === round.promptText &&
                  i.participantId === participantId &&
                  i.attemptCount === 3
                )
            ),
          ].slice(0, 30));

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
          body: JSON.stringify({ action: reasonLabel || "skip", participantId }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? `Failed to advance round (${reasonLabel})`);
        }

        const isUserSkip = reasonLabel === "Skipped" || reasonLabel === "skip";
        if (data.skippedRoundDetails && isUserSkip) {
          const vocabularyEntryId = data.skippedRoundDetails.vocabularyEntryId ?? currentRound.vocabularyEntryId;
          const details = await fetchVocabularyHistoryDetails(
            vocabularyEntryId,
            data.skippedRoundDetails.details
          );
          const currentAvatar = leaderboard.find((e) => e.participantId === participantId)?.avatarUrl ?? null;

          setHistory((prev) => [
            {
              promptText: data.skippedRoundDetails.promptText,
              rawAnswer: reasonLabel,
              isCorrect: false,
              // Stamp submittedAt so this entry sorts correctly (newest-first) after hydrateSession re-merge.
              // Without submittedAt, the entry gets "" timestamp and sorts to the BOTTOM of Word History.
              submittedAt: new Date().toISOString(),
              attemptCount: 3,         // Skip counts as final attempt for sort purposes
              participantId,
              participantName: currentParticipantName || authSession?.user?.name || "Player",
              participantAvatarUrl: currentAvatar,
              vocabularyEntryId,
              details,
            },
            ...prev.slice(0, 29),
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
    // Prevent duplicate timeout trigger if another action is already advancing the round
    if (advancingRoundRef.current || loadingRef.current || pendingActionRef.current) return;
    await advanceRoundWithReason("timeout");
  }, [advanceRoundWithReason]);

  // Reset timer on new round
  useEffect(() => {
    if (round?.roundId) {
      setTimeLeft(timePerPrompt > 0 ? timePerPrompt : 15);
    }
  }, [round?.roundId, timePerPrompt]);

  // Active countdown timer
  useEffect(() => {
    const roundId = round?.roundId;
    if (!roundId || loading || pendingAction || timePerPrompt <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          // Only the host (or single player) triggers the round advance on timeout to prevent duplicate spam
          if (isHost) {
            void handleTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [round?.roundId, loading, pendingAction, timePerPrompt, isHost, handleTimeout]);

  const progressValue = round ? Math.min(100, (round.roundNumber / Math.max(maxRounds, round.roundNumber)) * 100) : 0;
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
          {/* Ghost entries (participantId=null, rawAnswer="—") for skipped/unsubmitted rounds now carry
               vocabulary details and are intentionally shown so all participants see the vocab reveal.
               The merge logic already suppresses ghost entries when real submissions exist for that word. */}
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
            const isUserSelf = Boolean(participantId && item.participantId === participantId);
            const leaderboardEntry = item.participantId ? leaderboard.find((e) => e.participantId === item.participantId) : null;
            const rawName = item.participantName || leaderboardEntry?.displayName;
            const isGenericName = !rawName || rawName.toLowerCase() === "you" || rawName === "Player";
            const displayNameToShow = isGenericName
              ? (isUserSelf ? (currentParticipantName || authSession?.user?.name || "Player") : (leaderboardEntry?.displayName || "Player"))
              : rawName;
            const avatarUrlToShow = item.participantAvatarUrl || leaderboardEntry?.avatarUrl || (isUserSelf ? currentUserAvatar : null);

            const rawAmHanViet = item.details?.amHanViet?.[0];
            const amHanVietLabel = rawAmHanViet && rawAmHanViet !== "—" && rawAmHanViet !== "-" ? rawAmHanViet : null;
            const meaningViLabel = item.details?.meaningsVi?.[0] || null;
            const showReading = Boolean(readingLabel && readingLabel.trim() !== item.promptText.trim());

            return (
              <div
                key={`${item.promptText}_${item.participantId ?? "p"}_${item.attemptCount ?? 1}_${item.rawAnswer}_${item.id || index}_${index}`}
                className="border-b border-[var(--color-outline-variant)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-container-lowest)]"
              >
                <div className="flex items-center gap-3">

                  {/* Zone 1: Status Icon Stamp — snug bold vector SVG in 14x14px box */}
                  <div
                    className={`shrink-0 flex items-center justify-center w-[14px] h-[14px] ${
                      item.isCorrect
                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm"
                        : "border border-[var(--color-outline)] bg-[var(--color-surface-container-low)] text-[var(--color-secondary)]"
                    }`}
                    aria-label={item.isCorrect ? "Correct answer" : "Incorrect or skipped answer"}
                  >
                    {item.isCorrect ? (
                      <svg
                        className="w-[10px] h-[10px]"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.0"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      >
                        <path d="M3 8.5L6.5 12L13 4" />
                      </svg>
                    ) : (
                      <svg
                        className="w-[8.5px] h-[8.5px]"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="square"
                      >
                        <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" />
                      </svg>
                    )}
                  </div>

                  {/* Zone 2: Vocabulary block */}
                  <div className="flex flex-col min-w-0 flex-1">
                    {/* Âm Hán Việt (only if present) */}
                    {amHanVietLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary)] truncate leading-normal mb-0.5">
                        {amHanVietLabel}
                      </span>
                    )}

                    {/* Kanji + Hiragana with Sharp Square Bullet separator - Vertically Centered */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-[family-name:var(--font-headline)] text-2xl font-bold leading-tight text-[var(--color-primary)]">
                        {item.promptText}
                      </span>
                      {showReading && (
                        <span className="inline-flex items-center gap-2 text-[15px] font-medium tracking-wide text-[var(--color-primary)]/85 shrink-0">
                          <span className="inline-block w-[3.5px] h-[3.5px] bg-[var(--color-outline)] shrink-0" />
                          <span>{readingLabel}</span>
                        </span>
                      )}
                    </div>

                    {/* Nghĩa tiếng Việt (chỉ hiển thị khi có dữ liệu nghĩa tiếng Việt thực tế) */}
                    {meaningViLabel && (
                      <span className="text-xs text-[var(--color-secondary)] mt-0.5 truncate" title={meaningViLabel}>
                        {meaningViLabel}
                      </span>
                    )}
                  </div>

                  {/* Zone 3: Avatar only (no name), right-aligned */}
                  <div className="shrink-0 self-center">
                    <UserAvatarBox
                      avatarUrl={avatarUrlToShow}
                      displayName={displayNameToShow}
                      size="sm"
                    />
                  </div>

                </div>
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
              <div className="flex items-center gap-3">
                <UserAvatarBox
                  avatarUrl={currentUserAvatar}
                  displayName={currentParticipantName || authSession?.user?.name || "You"}
                  size="md"
                />
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-headline)] text-base font-bold text-[var(--color-primary)]">
                    {currentParticipantName || "You"}
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary)]">
                    Rank #1
                  </span>
                </div>
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
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatarBox
                    avatarUrl={entry.avatarUrl || (entry.active ? currentUserAvatar : null)}
                    displayName={entry.displayName}
                    size="md"
                  />

                  <div className="flex flex-col min-w-0">
                    <span className="font-[family-name:var(--font-headline)] text-base font-bold text-[var(--color-primary)] truncate">
                      {entry.displayName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary)]">
                        Rank #{entry.rank}
                      </span>
                      {entry.active && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
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
