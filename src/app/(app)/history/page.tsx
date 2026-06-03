"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getHistoryStorage,
  migrateGuestHistoryToLocalStorage,
  readPlayedGameSessionIds,
  rememberPlayedGameSession,
} from "@/features/game/history-storage";

type VocabularyHistoryDetails = {
  meaningsVi: string[];
  amHanViet: string[];
  onyomi: string[];
  kunyomi: string[];
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
const MAX_HISTORY_ENTRIES = 100;

function formatReviewedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getReadingLabel(details?: VocabularyHistoryDetails) {
  if (!details) return "—";
  return [...details.kunyomi, ...details.onyomi].filter(Boolean).join(" / ") || "—";
}

function getMeaningLabel(details?: VocabularyHistoryDetails) {
  return details?.meaningsVi[0] || "—";
}

function getAmHanVietLabel(details?: VocabularyHistoryDetails) {
  return details?.amHanViet.join(" / ") || "—";
}

export default function HistoryPage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");
  const isAuthenticated = status === "authenticated";
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
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
      setSessionIds(sessionParam ? rememberPlayedGameSession(sessionParam, storage) : storedSessionIds);
    });
  }, [isAuthenticated, sessionParam, status]);

  const hydrateVocabularyDetails = useCallback(async (entry: HistoryEntry): Promise<HistoryEntry> => {
    if (!entry.vocabularyEntryId) return entry;

    try {
      const response = await fetch(`/api/game/vocabulary/${entry.vocabularyEntryId}`);
      if (!response.ok) return entry;

      const data = (await response.json()) as VocabularyHistoryResponse;
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
        const data = (await response.json()) as SessionsHistoryResponse;

        if (!response.ok) {
          throw new Error("Failed to load history");
        }

        const entries = (data.history ?? []).slice(0, MAX_HISTORY_ENTRIES);
        const hydratedEntries = await Promise.all(
          entries.map((entry) => entry.details ? entry : hydrateVocabularyDetails(entry))
        );

        if (!cancelled) {
          setEntries(hydratedEntries);
          setSelectedEntryId(hydratedEntries[0]?.id ?? null);
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
    if (activeFilter === "Correct") return entries.filter((entry) => entry.isCorrect);
    if (activeFilter === "Needs Review") return entries.filter((entry) => !entry.isCorrect);
    return entries;
  }, [activeFilter, entries]);

  const selectedEntry = filteredEntries.find((entry) => entry.id === selectedEntryId) ?? filteredEntries[0];
  const reviewedCount = entries.length;
  const correctCount = entries.filter((entry) => entry.isCorrect).length;
  const accuracy = reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0;
  const sessionCount = new Set(entries.map((entry) => entry.sessionId)).size || sessionIds.length;

  return (
    <div className="relative flex h-[calc(100vh-65px)] w-full overflow-hidden bg-[var(--color-surface)]">
      <main className="flex-1 overflow-hidden px-6 py-10 lg:pl-12 lg:pr-[404px]">
        <div className="scrollbar-subtle scrollbar-gutter-stable h-full overflow-y-auto pr-2">
          <header className="mb-12">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="mb-2 font-[family-name:var(--font-headline)] text-4xl font-bold text-[var(--color-primary)]">
                  Session Archive
                </h1>
                <p className="font-[family-name:var(--font-body)] text-sm uppercase tracking-[0.12em] text-[var(--color-secondary)]">
                  {sessionIds.length > 0
                    ? `${reviewedCount} / ${MAX_HISTORY_ENTRIES} Items Reviewed · ${sessionCount} Sessions · ${accuracy}% Correct · ${isAuthenticated ? "Saved History" : "This Tab"}`
                    : isAuthenticated
                      ? "Play a game session to build saved history"
                      : "Play a game session to review history for this tab"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {filters.map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "primary" : "secondary"}
                    className="px-4 py-2 text-xs tracking-widest"
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="w-full border-t-2 border-[var(--color-primary)]">
            <div className="hidden items-center border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)] md:flex">
              <div className="w-32">Vocabulary</div>
              <div className="flex-1">Reading</div>
              <div className="flex-1">Meaning</div>
              <div className="w-32 text-right">Result</div>
            </div>

            <div className="flex flex-col">
              {loading && (
                <p className="border-b border-[var(--color-outline-variant)] p-6 text-sm text-[var(--color-secondary)]">
                  Loading history...
                </p>
              )}

              {!loading && sessionIds.length === 0 && (
                <p className="border-b border-[var(--color-outline-variant)] p-6 text-sm text-[var(--color-secondary)]">
                  No played sessions found. Finish a round from the Game tab, then return here.
                </p>
              )}

              {!loading && sessionIds.length > 0 && filteredEntries.length === 0 && (
                <p className="border-b border-[var(--color-outline-variant)] p-6 text-sm text-[var(--color-secondary)]">
                  No matching history entries across your played sessions yet.
                </p>
              )}

              {filteredEntries.map((entry) => {
                const isActive = entry.id === selectedEntry?.id;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={isActive
                      ? "relative flex cursor-pointer flex-col border-b border-[var(--color-outline-variant)] border-l-4 border-[var(--color-primary)] bg-[var(--color-surface-container-highest)] py-5 pl-3 pr-4 text-left transition-none md:flex-row md:items-center"
                      : "flex cursor-pointer flex-col border-b border-[var(--color-outline-variant)] px-4 py-5 text-left transition-none hover:bg-[var(--color-surface-container)] md:flex-row md:items-center"}
                  >
                    {isActive ? <div className="absolute bottom-0 left-0 top-0 w-1 bg-[var(--color-primary)]" /> : null}
                    <div className="w-32 shrink-0 pl-4 font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)]">
                      {entry.promptText}
                    </div>
                    <div className={isActive
                      ? "flex-1 font-[family-name:var(--font-body)] text-lg font-medium text-[var(--color-primary)]"
                      : "flex-1 font-[family-name:var(--font-body)] text-lg text-[var(--color-secondary)]"}
                    >
                      {getReadingLabel(entry.details)}
                    </div>
                    <div className={isActive
                      ? "flex-1 font-[family-name:var(--font-body)] text-lg font-medium text-[var(--color-primary)]"
                      : "flex-1 font-[family-name:var(--font-body)] text-lg text-[var(--color-primary)]"}
                    >
                      {getMeaningLabel(entry.details)}
                    </div>
                    <div className="mt-3 flex shrink-0 flex-col items-start md:mt-0 md:w-32 md:items-end md:pr-4">
                      <span className={entry.isCorrect
                        ? "font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-widest text-[var(--color-secondary)]"
                        : "font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]"}
                      >
                        {entry.isCorrect ? "Correct" : "Review"}
                      </span>
                      <span className="mt-1 text-xs text-[var(--color-secondary)]">
                        {formatReviewedAt(entry.submittedAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <aside className="hidden h-full w-[380px] shrink-0 border-l border-[var(--color-primary)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="scrollbar-subtle-strong scrollbar-gutter-stable flex h-full flex-col overflow-y-auto p-8">
          <header className="mb-12 shrink-0">
            <div className="mb-3 border-b-2 border-[var(--color-primary)] pb-3 font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-primary)]">
              語彙詳細
            </div>
            <div className="font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-secondary)]">
              Word Marginalia
            </div>
          </header>

          {selectedEntry ? (
            <>
              <div className="mb-16 flex shrink-0 flex-col items-center border-b border-[var(--color-outline-variant)] pb-12">
                <div className="mb-6 max-w-full break-words text-center font-[family-name:var(--font-headline)] text-[6rem] font-bold leading-none text-[var(--color-primary)]">
                  {selectedEntry.promptText}
                </div>
                <div className="mb-4 text-center font-[family-name:var(--font-body)] text-2xl tracking-[0.18em] text-[var(--color-secondary)]">
                  {getReadingLabel(selectedEntry.details)}
                </div>
                <div className="border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2 text-center font-[family-name:var(--font-label)] text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">
                  {getMeaningLabel(selectedEntry.details)}
                </div>
              </div>

              <div className="min-h-0 flex-1 pr-2">
                <div className="flex flex-col">
                  <section className="mb-12">
                    <h2 className="mb-6 flex items-center border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                      <span className="material-symbols-outlined mr-2 text-[20px]">info</span>
                      Overview
                    </h2>
                    <div className="font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
                      <div className="mb-3 flex justify-between border-b border-[var(--color-outline-variant)] pb-2">
                        <span>Hán Việt</span>
                        <span className="text-[var(--color-outline)]">01</span>
                      </div>
                    </div>
                    <div className="font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)]">
                      {getAmHanVietLabel(selectedEntry.details)}
                    </div>
                  </section>

                  <section className="mb-12">
                    <h2 className="mb-6 flex items-center border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                      <span className="material-symbols-outlined mr-2 text-[20px]">menu_book</span>
                      Meanings
                    </h2>
                    <ol className="list-inside list-decimal space-y-2 font-[family-name:var(--font-body)] text-sm font-medium text-[var(--color-primary)]">
                      {(selectedEntry.details?.meaningsVi.length ? selectedEntry.details.meaningsVi : ["—"]).map((meaning) => (
                        <li key={meaning}>{meaning}</li>
                      ))}
                    </ol>
                  </section>

                  <section className="mb-12">
                    <h2 className="mb-6 flex items-center border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                      <span className="material-symbols-outlined mr-2 text-[20px]">edit_note</span>
                      Your Answer
                    </h2>
                    <div className="mb-3 flex justify-between border-b border-[var(--color-outline-variant)] pb-2 font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
                      <span>{selectedEntry.participantName}</span>
                      <span className="text-[var(--color-outline)]">Attempt {selectedEntry.attemptCount}</span>
                    </div>
                    {selectedEntry.roomCode && (
                      <div className="mb-3 flex justify-between border-b border-[var(--color-outline-variant)] pb-2 font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
                        <span>Room</span>
                        <span className="text-[var(--color-outline)]">{selectedEntry.roomCode}</span>
                      </div>
                    )}
                    <div className="font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)]">
                      {selectedEntry.rawAnswer}
                    </div>
                  </section>

                  <section className="mb-12">
                    <h2 className="mb-6 flex items-center border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                      <span className="material-symbols-outlined mr-2 text-[20px]">fact_check</span>
                      Result
                    </h2>
                    <div className="font-[family-name:var(--font-headline)] text-4xl font-bold text-[var(--color-primary)]">
                      {selectedEntry.isCorrect ? "Correct" : "Needs Review"}
                    </div>
                    <div className="mt-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)]">
                      Reviewed {formatReviewedAt(selectedEntry.submittedAt)}
                    </div>
                  </section>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-[var(--color-secondary)]">
              Select a history item to view vocabulary details.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
