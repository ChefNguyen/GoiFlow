"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getHistoryStorage,
  migrateGuestHistoryToLocalStorage,
  readPlayedGameSessionIds,
  rememberPlayedGameSession,
} from "@/features/game/history-storage";

type VocabularyHistoryDetails = {
  meaningsVi?: string[];
  amHanViet?: string[];
  onyomi?: string[];
  kunyomi?: string[];
  reading?: string;
  term?: string;
};

type HistoryEntry = {
  id: string;
  sessionId: string;
  roomCode?: string;
  roundId: string;
  roundNumber: number;
  promptText: string;
  promptType: string;
  rawAnswer: string;
  isCorrect: boolean;
  attemptCount: number;
  participantName: string;
  submittedAt: string;
  vocabularyEntryId: string | null;
  details?: VocabularyHistoryDetails;
};

type SessionsHistoryResponse = {
  history?: HistoryEntry[];
  limit?: number;
};

type VocabularyHistoryResponse = {
  vocabularyEntryId?: string;
  details?: VocabularyHistoryDetails;
};

const filters = ["All", "Correct", "Needs Review"] as const;
const MAX_HISTORY_ENTRIES = 50;

function formatReviewedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getReadingLabel(details?: VocabularyHistoryDetails) {
  if (!details) return "—";
  const list: string[] = [];
  if (details.reading) list.push(details.reading.trim());
  if (Array.isArray(details.kunyomi)) list.push(...details.kunyomi.map((k) => k.trim()));
  if (Array.isArray(details.onyomi)) list.push(...details.onyomi.map((o) => o.trim()));

  const unique = Array.from(new Set(list.filter(Boolean)));
  return unique.length > 0 ? unique.join(" / ") : "—";
}

function getMeaningLabel(details?: VocabularyHistoryDetails) {
  return details?.meaningsVi?.[0] || "—";
}

function getAmHanVietLabel(details?: VocabularyHistoryDetails) {
  const list = (details?.amHanViet || []).map((a) => a.trim()).filter(Boolean);
  const unique = Array.from(new Set(list));
  return unique.length > 0 ? unique.join(" / ").toUpperCase() : "—";
}

export default function HistoryPage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");
  const isAuthenticated = status === "authenticated";
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    queueMicrotask(() => {
      if (isAuthenticated) {
        migrateGuestHistoryToLocalStorage();
      }

      const storage = getHistoryStorage(isAuthenticated);
      const storedSessionIds = readPlayedGameSessionIds(storage);
      const activeIds = sessionParam ? rememberPlayedGameSession(sessionParam, storage) : storedSessionIds;
      setSessionIds(activeIds);
    });
  }, [isAuthenticated, sessionParam, status]);

  const hydrateVocabularyDetails = useCallback(async (entry: HistoryEntry): Promise<HistoryEntry> => {
    if (!entry.vocabularyEntryId) return entry;

    try {
      const response = await fetch(`/api/game/vocabulary/${entry.vocabularyEntryId}`);
      if (!response.ok) return entry;

      const data = (await response.json().catch(() => ({}))) as VocabularyHistoryResponse;
      return { ...entry, details: data.details ?? entry.details };
    } catch (err) {
      console.error("Failed to load vocabulary details for history", err);
      return entry;
    }
  }, []);

  useEffect(() => {
    if (sessionIds.length === 0) return;

    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/game/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionIds, limit: MAX_HISTORY_ENTRIES }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error ?? errData?.message ?? `Failed to load history (${response.status})`);
        }

        const data = (await response.json().catch(() => ({ history: [] }))) as SessionsHistoryResponse;

        const rawEntries = (data.history ?? []).slice(0, MAX_HISTORY_ENTRIES);
        const hydratedEntries = await Promise.all(
          rawEntries.map((entry) => (entry.details ? entry : hydrateVocabularyDetails(entry)))
        );

        if (!cancelled) {
          setEntries(hydratedEntries);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [hydrateVocabularyDetails, sessionIds]);

  const filteredEntries = useMemo(() => {
    let result = entries;

    if (activeFilter === "Correct") {
      result = result.filter((entry) => entry.isCorrect);
    } else if (activeFilter === "Needs Review") {
      result = result.filter((entry) => !entry.isCorrect);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((entry) => {
        const promptMatch = entry.promptText?.toLowerCase().includes(q);
        const rawAnswerMatch = entry.rawAnswer?.toLowerCase().includes(q);
        const roomCodeMatch = entry.roomCode?.toLowerCase().includes(q);
        const meaningMatch = entry.details?.meaningsVi?.some((m) => m.toLowerCase().includes(q));
        const amHanMatch = entry.details?.amHanViet?.some((a) => a.toLowerCase().includes(q));
        const readingMatch = entry.details?.reading?.toLowerCase().includes(q);
        return promptMatch || rawAnswerMatch || roomCodeMatch || meaningMatch || amHanMatch || readingMatch;
      });
    }

    return result;
  }, [activeFilter, entries, searchQuery]);

  const reviewedCount = entries.length;
  const correctCount = entries.filter((entry) => entry.isCorrect).length;
  const reviewCount = reviewedCount - correctCount;
  const accuracy = reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0;

  return (
    <div className="relative flex min-h-[calc(100vh-65px)] w-full overflow-hidden bg-[var(--color-surface)]">
      {/* Main Word History Panel (Full Width) */}
      <main className="flex-1 overflow-hidden px-4 py-8 md:px-12 max-w-7xl mx-auto w-full">
        <div className="scrollbar-subtle scrollbar-gutter-stable h-full overflow-y-auto pr-2">
          {/* Header & Stats Banner */}
          <header className="mb-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="mb-1 font-[family-name:var(--font-headline)] text-3xl font-bold tracking-tight text-[var(--color-primary)] md:text-4xl">
                  Word History
                </h1>
                <p className="font-[family-name:var(--font-body)] text-xs uppercase tracking-[0.15em] text-[var(--color-secondary)]">
                  {isAuthenticated ? "Synchronized Account" : "Current Session History"} • Last {reviewedCount} Prompts
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-5 py-3 text-center">
                  <div className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-[var(--color-secondary)]">
                    Reviewed
                  </div>
                  <div className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-primary)]">
                    {reviewedCount}
                  </div>
                </div>
                <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-5 py-3 text-center">
                  <div className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-[var(--color-secondary)]">
                    Correct
                  </div>
                  <div className="font-[family-name:var(--font-headline)] text-2xl font-bold text-emerald-600">
                    {correctCount}
                  </div>
                </div>
                <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-5 py-3 text-center">
                  <div className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-[var(--color-secondary)]">
                    Accuracy
                  </div>
                  <div className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-primary)]">
                    {accuracy}%
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="mt-8 flex flex-col gap-4 border-b border-[var(--color-outline-variant)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {filters.map((filter) => {
                  const isActive = activeFilter === filter;
                  const count =
                    filter === "All"
                      ? reviewedCount
                      : filter === "Correct"
                        ? correctCount
                        : reviewCount;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={
                        isActive
                          ? "border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider text-white"
                          : "border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-2 font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-wider text-[var(--color-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      }
                    >
                      {filter}
                      <span className={isActive ? "ml-2 text-white/80 font-normal" : "ml-2 text-[var(--color-secondary)]"}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Input
                  type="text"
                  placeholder="Search kanji, reading, meaning..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="font-[family-name:var(--font-body)] text-xs placeholder:text-[var(--color-secondary)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* History Items Table */}
          <section className="w-full border-t-2 border-[var(--color-primary)]">
            <div className="hidden items-center border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)] md:flex">
              <div className="w-32 shrink-0">Kanji / Term</div>
              <div className="w-56 shrink-0">Reading / Sino-Viet</div>
              <div className="flex-1">Meaning</div>
              <div className="w-40 shrink-0 text-right">Status</div>
            </div>

            <div className="flex flex-col">
              {loading && (
                <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-[var(--color-secondary)]">
                  <span className="material-symbols-outlined mb-2 animate-spin text-3xl">
                    progress_activity
                  </span>
                  Loading word history...
                </div>
              )}

              {!loading && sessionIds.length === 0 && (
                <div className="flex flex-col items-center justify-center border-b border-[var(--color-outline-variant)] p-16 text-center">
                  <span className="material-symbols-outlined mb-3 text-5xl text-[var(--color-secondary)]">
                    history_edu
                  </span>
                  <p className="mb-4 font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-primary)]">
                    No Review History Yet
                  </p>
                  <p className="mb-6 max-w-sm text-xs leading-relaxed text-[var(--color-secondary)]">
                    Complete a game session or practice vocabulary to archive your study records here.
                  </p>
                  <Link href="/game/setup">
                    <Button variant="primary" className="px-6 py-3 text-xs tracking-widest !text-white">
                      Play Now
                    </Button>
                  </Link>
                </div>
              )}

              {!loading && sessionIds.length > 0 && filteredEntries.length === 0 && (
                <div className="flex flex-col items-center justify-center border-b border-[var(--color-outline-variant)] p-12 text-center text-sm text-[var(--color-secondary)]">
                  <span className="material-symbols-outlined mb-2 text-3xl">search_off</span>
                  No vocabulary entries matched your filter.
                </div>
              )}

              {filteredEntries.map((entry) => {
                const readingText = getReadingLabel(entry.details);
                const amHanVietText = getAmHanVietLabel(entry.details);
                const meaningText = getMeaningLabel(entry.details);

                return (
                  <div
                    key={entry.id}
                    className="flex cursor-default flex-col border-b border-[var(--color-outline-variant)] px-4 py-4 text-left transition-all hover:bg-[var(--color-surface-container)] md:flex-row md:items-center"
                  >
                    {/* Prompt Kanji */}
                    <div className="w-32 shrink-0 font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)]">
                      {entry.promptText}
                    </div>

                    {/* Reading & Uppercase Sino-Vietnamese */}
                    <div className="w-56 shrink-0 font-[family-name:var(--font-body)] text-sm">
                      <div className="font-bold text-[var(--color-primary)]">
                        {readingText !== "—" ? readingText : amHanVietText}
                      </div>
                      {amHanVietText !== "—" && (
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                          {amHanVietText}
                        </div>
                      )}
                    </div>

                    {/* Meaning */}
                    <div className="flex-1 font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-on-surface)]">
                      {meaningText}
                    </div>

                    {/* Result Badge & Timestamp */}
                    <div className="mt-2 flex shrink-0 items-center justify-between gap-0.5 md:mt-0 md:w-40 md:flex-col md:items-end">
                      {entry.promptType === "SHIRITORI" ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                          <span className="material-symbols-outlined text-[16px]">link</span>
                          Shiritori
                        </span>
                      ) : entry.isCorrect ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider text-emerald-600">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider text-rose-600">
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          Incorrect
                        </span>
                      )}
                      <span className="whitespace-nowrap text-[11px] text-[var(--color-secondary)]">
                        {formatReviewedAt(entry.submittedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
