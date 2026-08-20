"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KanjiStrokeAnimator } from "@/components/shared/kanji-stroke-animator";
import type { LibraryEntry } from "./page";

const JLPT_LEVELS = [
  { level: "N5", label: "N5 (Beginner)" },
  { level: "N4", label: "N4 (Basic)" },
  { level: "N3", label: "N3 (Intermediate)" },
  { level: "N2", label: "N2 (Pre-Advanced)" },
  { level: "N1", label: "N1 (Advanced)" },
] as const;

const CATEGORIES = [
  { id: "Radicals", label: "Radicals", icon: "category" },
  { id: "Frequency", label: "Frequency", icon: "equalizer" },
  { id: "Saved", label: "Saved", icon: "favorite" },
] as const;

type VocabularyDetailData = {
  kunyomi?: string[];
  onyomi?: string[];
  reading?: string;
  amHanViet?: string[];
  meaningsVi?: string[];
};

type LibraryClientProps = {
  initialEntries: LibraryEntry[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
  initialLevels: string[];
  initialSearch?: string;
  initialCategory?: string;
};

export function LibraryClient({
  initialEntries,
  initialTotal,
  initialPage,
  totalPages,
  initialLevels,
  initialSearch = "",
  initialCategory = "Radicals",
}: LibraryClientProps) {
  const router = useRouter();
  const [selectedLevels, setSelectedLevels] = useState<string[]>(initialLevels.length > 0 ? initialLevels : ["N2"]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [fullDetailData, setFullDetailData] = useState<VocabularyDetailData | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "strokes">("overview");

  // Splitter: Details Panel Width
  const [detailsPanelWidth, setDetailsPanelWidth] = useState(380);
  const isDraggingDetailsRef = useRef(false);

  // Sync state when props change
  useEffect(() => {
    setSelectedLevels(initialLevels.length > 0 ? initialLevels : ["N2"]);
    setSelectedCategory(initialCategory);
  }, [initialLevels, initialCategory]);

  // Fetch full details when an entry is selected
  useEffect(() => {
    if (!selectedEntry) {
      setFullDetailData(null);
      return;
    }

    let cancelled = false;

    async function fetchFullDetail() {
      try {
        const res = await fetch(`/api/game/vocabulary/${selectedEntry?.id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.details) {
            setFullDetailData(data.details);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch vocabulary full details", err);
      }

      if (!cancelled) {
        setFullDetailData({
          reading: selectedEntry?.reading,
          amHanViet: selectedEntry?.amHanViet,
          meaningsVi: selectedEntry?.meaningsVi,
        });
      }
    }

    void fetchFullDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedEntry]);

  const handleMouseDownDetails = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDetailsRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingDetailsRef.current) return;
      const newWidth = window.innerWidth - event.clientX;
      setDetailsPanelWidth(Math.max(320, Math.min(650, newWidth)));
    };

    const handleMouseUp = () => {
      isDraggingDetailsRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const updateFilters = useCallback(
    (newLevels: string[], newCategory: string, page = 1) => {
      const params = new URLSearchParams();
      if (newLevels.length > 0) {
        params.set("levels", newLevels.join(","));
      } else {
        params.set("levels", "N2"); // fallback to N2 if empty
      }
      if (newCategory) {
        params.set("category", newCategory);
      }
      if (initialSearch.trim()) {
        params.set("search", initialSearch.trim());
      }
      params.set("page", String(page));
      router.push(`/library?${params.toString()}`);
    },
    [initialSearch, router]
  );

  // Instant filter on clicking level checkbox / row
  const toggleLevel = (level: string) => {
    const updated = selectedLevels.includes(level)
      ? selectedLevels.filter((l) => l !== level)
      : [...selectedLevels, level];
    const finalLevels = updated.length > 0 ? updated : [level]; // keep at least one level active
    setSelectedLevels(finalLevels);
    updateFilters(finalLevels, selectedCategory, 1);
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    updateFilters(selectedLevels, catId, 1);
  };

  const handlePageChange = (page: number) => {
    updateFilters(selectedLevels, selectedCategory, page);
  };

  const playAudio = useCallback((text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard || !text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1800);
  }, []);

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      if (initialPage > 3) {
        items.push("...");
      }
      const start = Math.max(2, initialPage - 1);
      const end = Math.min(totalPages - 1, initialPage + 1);
      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) {
          items.push(i);
        }
      }
      if (initialPage < totalPages - 2) {
        items.push("...");
      }
      items.push(totalPages);
    }

    return items;
  };

  const levelSummary = selectedLevels.length > 0 ? selectedLevels.join(", ") : "N2";
  const subtitle = `Showing results for ${levelSummary} ${selectedCategory}`;

  const amHanVietText = selectedEntry?.amHanViet && selectedEntry.amHanViet.length > 0
    ? selectedEntry.amHanViet.join(" / ").toUpperCase()
    : "—";

  return (
    <div className="relative flex h-[calc(100vh-65px)] w-full overflow-hidden bg-[var(--color-surface)]">
      {/* 1. Left Sidebar: Filters */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-8">
          {/* Sidebar Title */}
          <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-primary)]">
            Filters
          </h2>

          {/* Section: JLPT LEVEL with instant clickable rows */}
          <div>
            <h3 className="font-[family-name:var(--font-label)] text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)] mb-3">
              JLPT LEVEL
            </h3>
            <div className="space-y-1">
              {JLPT_LEVELS.map(({ level, label }) => {
                const isChecked = selectedLevels.includes(level);
                return (
                  <div
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-2.5 py-2 -mx-2.5 text-sm transition-colors select-none font-[family-name:var(--font-body)]",
                      isChecked
                        ? "bg-[var(--color-surface-container)] font-semibold text-[var(--color-primary)]"
                        : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 border flex items-center justify-center transition-colors shrink-0",
                        isChecked
                          ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                          : "border-[var(--color-outline)] bg-[var(--color-surface)]"
                      )}
                    >
                      {isChecked && (
                        <span className="material-symbols-outlined text-[13px] text-white font-bold leading-none">
                          check
                        </span>
                      )}
                    </div>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: CATEGORY */}
          <div>
            <h3 className="font-[family-name:var(--font-label)] text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)] mb-3">
              CATEGORY
            </h3>
            <div className="space-y-1">
              {CATEGORIES.map(({ id, label, icon }) => {
                const isActive = selectedCategory === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectCategory(id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-2.5 py-2 -mx-2.5 text-sm transition-colors text-left font-[family-name:var(--font-body)]",
                      isActive
                        ? "bg-[var(--color-surface-container-high)] text-[var(--color-primary)] font-bold"
                        : "text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]"
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {icon}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Applied active filter indicator */}
        <div className="pt-6 mt-auto border-t border-[var(--color-outline-variant)]">
          <div className="flex items-center justify-between text-xs text-[var(--color-secondary)] mb-3 font-[family-name:var(--font-body)]">
            <span>Active:</span>
            <span className="font-bold text-[var(--color-primary)]">{levelSummary}</span>
          </div>
          <Button
            variant="primary"
            onClick={() => updateFilters(selectedLevels, selectedCategory, 1)}
            className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-[family-name:var(--font-label)] font-bold text-xs uppercase tracking-[0.2em] rounded-none justify-center"
          >
            APPLY FILTERS
          </Button>
        </div>
      </aside>

      {/* 2. Main Content Area: Compact Kotoba Grid */}
      <section className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-primary)] pb-4 mb-6">
            <div>
              <h1 className="font-[family-name:var(--font-headline)] text-3xl md:text-4xl font-bold text-[var(--color-primary)] mb-1">
                Kanji Library
              </h1>
              <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[var(--color-secondary)]">
                {subtitle}
              </p>
            </div>

            <div className="flex items-baseline">
              <span className="font-[family-name:var(--font-headline)] text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
                {initialTotal}
              </span>
              <span className="font-[family-name:var(--font-label)] text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)] ml-2">
                ENTRIES FOUND
              </span>
            </div>
          </header>

          {/* Compact Kotoba Cards Grid (8 items per page = 2 rows of 4) */}
          {initialEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-[var(--color-secondary)]">
              <p className="font-[family-name:var(--font-headline)] text-lg text-[var(--color-primary)] mb-2 font-bold">
                No entries found
              </p>
              <p className="font-[family-name:var(--font-body)] text-xs">
                No kanji entries matched the selected filters. Please adjust the filters and try again.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {initialEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                const promptLength = entry.kanji.length;

                // Responsive font scaling so multi-character words never wrap or stretch
                const kanjiSizeClass = promptLength >= 4
                  ? "text-2xl sm:text-3xl"
                  : promptLength >= 2
                    ? "text-3xl sm:text-4xl"
                    : "text-4xl sm:text-5xl";

                return (
                  <article
                    key={entry.id}
                    onClick={() => setSelectedEntry(isSelected ? null : entry)}
                    className={cn(
                      "relative flex flex-col justify-between border p-3.5 sm:p-4 cursor-pointer transition-all h-[210px] sm:h-[220px]",
                      isSelected
                        ? "bg-[var(--color-surface-container-high)] border-[var(--color-primary)] shadow-sm"
                        : "bg-[var(--color-surface)] border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]"
                    )}
                  >
                    {/* Top Right Level Badge */}
                    <div className="flex justify-end">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 text-[9px] font-[family-name:var(--font-label)] font-bold uppercase tracking-wider border leading-none",
                          isSelected
                            ? "bg-black text-white border-black"
                            : "border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent"
                        )}
                      >
                        {entry.level}
                      </span>
                    </div>

                    {/* Compact Kanji Hero (Horizontal, single-line without vertical wrap) */}
                    <div className="flex flex-1 items-center justify-center px-1 overflow-hidden">
                      <span
                        className={cn(
                          "font-[family-name:var(--font-headline)] font-bold text-[var(--color-primary)] select-none text-center truncate max-w-full tracking-tight",
                          kanjiSizeClass
                        )}
                        title={entry.kanji}
                      >
                        {entry.kanji}
                      </span>
                    </div>

                    {/* Bottom Metadata with Subtle Divider */}
                    <div className="mt-auto">
                      <div className="w-full border-t border-[var(--color-outline-variant)] mb-2" />
                      <div className="font-[family-name:var(--font-headline)] text-xs sm:text-sm font-bold text-[var(--color-primary)] truncate">
                        {entry.reading}
                      </div>
                      <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--color-secondary)] truncate mt-0.5">
                        {entry.meaning}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Pagination Controls */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
            {/* Prev Button */}
            <button
              type="button"
              disabled={initialPage <= 1}
              onClick={() => handlePageChange(initialPage - 1)}
              className="flex items-center gap-1 border border-[var(--color-outline-variant)] px-3.5 py-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
              PREV
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1.5 font-[family-name:var(--font-body)] text-xs">
              {renderPaginationItems().map((item, idx) => {
                if (item === "...") {
                  return (
                    <span key={`dots-${idx}`} className="px-1 text-[var(--color-secondary)]">
                      ...
                    </span>
                  );
                }

                const pageNum = item as number;
                const isCurrent = pageNum === initialPage;

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center font-bold text-xs transition-colors",
                      isCurrent
                        ? "bg-black text-white"
                        : "text-[var(--color-primary)] hover:bg-[var(--color-surface-container)]"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              type="button"
              disabled={initialPage >= totalPages}
              onClick={() => handlePageChange(initialPage + 1)}
              className="flex items-center gap-1 border border-[var(--color-outline-variant)] px-3.5 py-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              NEXT
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </nav>
        )}
      </section>

      {/* 3. Splitter & Vocabulary Details Right Panel */}
      {selectedEntry && (
        <>
          {/* Draggable Splitter (Discreet, visible on hover - Gray) */}
          <div
            onMouseDown={handleMouseDownDetails}
            className="group relative hidden lg:flex w-2 -mr-[4px] z-30 cursor-col-resize items-center justify-center bg-transparent hover:bg-neutral-200/40 transition-colors"
            title="Drag to resize details panel"
          >
            <div className="h-full w-[2px] bg-neutral-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150" />
            <div className="absolute h-8 w-1 rounded-full bg-neutral-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150" />
          </div>

          {/* Vocabulary Details Panel */}
          <aside
            className="hidden h-full shrink-0 border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col"
            style={{ width: `${detailsPanelWidth}px` }}
          >
            <div className="scrollbar-subtle-strong scrollbar-gutter-stable flex h-full flex-col overflow-y-auto p-8">
              {/* Header */}
              <header className="mb-6 shrink-0 flex items-center justify-between border-b-2 border-[var(--color-primary)] pb-3">
                <div>
                  <div className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-primary)]">
                    Vocabulary Details
                  </div>
                  <div className="font-[family-name:var(--font-label)] text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-secondary)]">
                    Character Marginalia
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="border border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    JLPT {selectedEntry.level}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedEntry(null)}
                    className="p-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)] font-bold text-xs"
                    title="Close details"
                  >
                    ✕
                  </button>
                </div>
              </header>

              <div className="flex flex-col space-y-6">
                {/* View Mode Toggle: Overview vs Stroke */}
                <div className="flex w-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-1">
                  <button
                    type="button"
                    onClick={() => setDetailTab("overview")}
                    className={cn(
                      "flex-1 py-1.5 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                      detailTab === "overview"
                        ? "bg-black text-white shadow-sm"
                        : "text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                    )}
                  >
                    <span className="material-symbols-outlined text-[15px]">text_fields</span>
                    <span>Overview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab("strokes")}
                    className={cn(
                      "flex-1 py-1.5 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                      detailTab === "strokes"
                        ? "bg-black text-white shadow-sm"
                        : "text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                    )}
                  >
                    <span className="material-symbols-outlined text-[15px]">draw</span>
                    <span>Stroke</span>
                  </button>
                </div>

                {detailTab === "strokes" ? (
                  <KanjiStrokeAnimator term={selectedEntry.kanji} />
                ) : (
                  /* Main Hero Card with Audio & Copy */
                  <div className="relative flex flex-col items-center border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-6 text-center shadow-sm">
                    {/* Action Buttons Top Right */}
                    <div className="absolute right-3 top-3 flex items-center gap-1">
                      <button
                        onClick={() => playAudio(selectedEntry.kanji, selectedEntry.id)}
                        className="rounded p-1 text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]"
                        title="Pronounce Japanese"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {speakingId === selectedEntry.id ? "volume_up" : "volume_down"}
                        </span>
                      </button>
                      <button
                        onClick={() => copyToClipboard(selectedEntry.kanji)}
                        className="rounded p-1 text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]"
                        title="Copy Kanji"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedText === selectedEntry.kanji ? "check" : "content_copy"}
                        </span>
                      </button>
                    </div>

                    <div className="mb-3 font-[family-name:var(--font-headline)] text-6xl font-bold leading-none text-[var(--color-primary)]">
                      {selectedEntry.kanji}
                    </div>
                    <div className="mb-2 font-[family-name:var(--font-body)] text-xl font-medium tracking-wide text-[var(--color-primary)]">
                      {fullDetailData?.reading || selectedEntry.reading}
                    </div>
                    {amHanVietText !== "—" && (
                      <div className="inline-block border border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-3 py-1 font-[family-name:var(--font-headline)] text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
                        {amHanVietText}
                      </div>
                    )}
                  </div>
                )}

                {/* Meanings & Definitions Section */}
                <section className="border-t border-[var(--color-outline-variant)] pt-4">
                  <h2 className="mb-3 flex items-center font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    <span className="material-symbols-outlined mr-1.5 text-[18px]">menu_book</span>
                    Meanings & Definitions
                  </h2>
                  <div className="space-y-2 font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--color-on-surface)]">
                    {(fullDetailData?.meaningsVi?.length ? fullDetailData.meaningsVi : [selectedEntry.meaning]).map((meaning, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-3"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{meaning}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Kunyomi & Onyomi Breakdown */}
                {(fullDetailData?.kunyomi?.length || fullDetailData?.onyomi?.length) ? (
                  <section className="border-t border-[var(--color-outline-variant)] pt-4">
                    <h2 className="mb-3 flex items-center font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                      <span className="material-symbols-outlined mr-1.5 text-[18px]">translate</span>
                      Kunyomi & Onyomi
                    </h2>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-3">
                        <span className="block font-bold text-[var(--color-secondary)]">KUNYOMI</span>
                        <span className="mt-1 block font-medium text-[var(--color-primary)]">
                          {fullDetailData?.kunyomi?.join(", ") || "—"}
                        </span>
                      </div>
                      <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-3">
                        <span className="block font-bold text-[var(--color-secondary)]">ONYOMI</span>
                        <span className="mt-1 block font-medium text-[var(--color-primary)]">
                          {fullDetailData?.onyomi?.join(", ") || "—"}
                        </span>
                      </div>
                    </div>
                  </section>
                ) : null}

                {/* Character Metadata */}
                <section className="border-t border-[var(--color-outline-variant)] pt-4">
                  <h2 className="mb-3 flex items-center font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    <span className="material-symbols-outlined mr-1.5 text-[18px]">info</span>
                    Character Information
                  </h2>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-2.5">
                      <span className="text-[10px] uppercase text-[var(--color-secondary)]">Character Length</span>
                      <p className="font-bold text-[var(--color-primary)]">{selectedEntry.kanji.length} Kanji</p>
                    </div>
                    <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-2.5">
                      <span className="text-[10px] uppercase text-[var(--color-secondary)]">JLPT Grade</span>
                      <p className="font-bold text-[var(--color-primary)]">Level {selectedEntry.level}</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Mobile Drawer Modal for Word Details */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 lg:hidden"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="max-h-[85vh] w-full overflow-y-auto border-t-2 border-[var(--color-primary)] bg-[var(--color-surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-[var(--color-outline-variant)] pb-3">
              <span className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-primary)]">
                Vocabulary Details
              </span>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 font-bold text-[var(--color-primary)]"
              >
                ✕
              </button>
            </div>

            {/* View Mode Toggle: Overview vs Stroke */}
            <div className="mb-4 flex w-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-1">
              <button
                type="button"
                onClick={() => setDetailTab("overview")}
                className={cn(
                  "flex-1 py-1.5 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                  detailTab === "overview"
                    ? "bg-black text-white shadow-sm"
                    : "text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                )}
              >
                <span className="material-symbols-outlined text-[15px]">text_fields</span>
                <span>Overview</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("strokes")}
                className={cn(
                  "flex-1 py-1.5 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                  detailTab === "strokes"
                    ? "bg-black text-white shadow-sm"
                    : "text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                )}
              >
                <span className="material-symbols-outlined text-[15px]">draw</span>
                <span>Stroke</span>
              </button>
            </div>

            {detailTab === "strokes" ? (
              <KanjiStrokeAnimator term={selectedEntry.kanji} className="mb-4" />
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="font-[family-name:var(--font-headline)] text-6xl font-bold text-[var(--color-primary)]">
                  {selectedEntry.kanji}
                </div>
                <div className="mt-2 text-lg font-medium text-[var(--color-primary)]">
                  {fullDetailData?.reading || selectedEntry.reading}
                </div>
                {amHanVietText !== "—" && (
                  <div className="mt-1 font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                    {amHanVietText}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 space-y-4 text-sm">
              <div className="border-t border-[var(--color-outline-variant)] pt-3">
                <span className="font-bold text-[var(--color-primary)]">Meanings:</span>
                <p className="mt-1 text-[var(--color-on-surface)]">
                  {fullDetailData?.meaningsVi?.join(", ") || selectedEntry.meaning}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              className="mt-6 w-full py-3 text-xs tracking-widest"
              onClick={() => setSelectedEntry(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
