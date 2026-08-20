"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type StrokeInfo = {
  d: string;
  id: string;
};

type NumberInfo = {
  text: string;
  transform: string;
};

type ParsedKanjiSvg = {
  strokes: StrokeInfo[];
  numbers: NumberInfo[];
  viewBox: string;
};

// In-memory cache for parsed Kanji SVG structures
const svgCache = new Map<string, ParsedKanjiSvg>();

function isKanjiChar(char: string): boolean {
  const code = char.codePointAt(0) || 0;
  return (
    (code >= 0x4e00 && code <= 0x9faf) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf)    // CJK Extension A
  );
}

function getKanjiList(term: string): string[] {
  const chars = Array.from(term);
  const kanjis = chars.filter(isKanjiChar);
  return kanjis.length > 0 ? kanjis : chars.slice(0, 1);
}

function getKanjiHex(char: string): string {
  const code = char.codePointAt(0);
  if (!code) return "00000";
  return code.toString(16).toLowerCase().padStart(5, "0");
}

export function KanjiStrokeAnimator({
  term,
  className,
}: {
  term: string;
  className?: string;
}) {
  const kanjiList = getKanjiList(term);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const currentChar = kanjiList[selectedCharIndex] || kanjiList[0] || "一";

  const [svgData, setSvgData] = useState<ParsedKanjiSvg | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Animation states: Default speed 0.5x, auto-looping, numbers always on
  const speed = 0.5;
  const [activeStrokeIndex, setActiveStrokeIndex] = useState(0);
  const [isStrokeDrawing, setIsStrokeDrawing] = useState(false);
  const [strokeLengths, setStrokeLengths] = useState<number[]>([]);

  const pathsRef = useRef<(SVGPathElement | null)[]>([]);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch and parse SVG
  useEffect(() => {
    let cancelled = false;
    const hex = getKanjiHex(currentChar);

    if (svgCache.has(hex)) {
      setSvgData(svgCache.get(hex)!);
      setActiveStrokeIndex(0);
      setIsStrokeDrawing(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    async function fetchSvg() {
      try {
        const url = `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg/kanji/${hex}.svg`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("KanjiVG SVG not found");

        const xmlText = await res.text();
        if (cancelled) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, "image/svg+xml");

        const pathEls = Array.from(doc.querySelectorAll("path"));
        const strokes: StrokeInfo[] = [];

        pathEls.forEach((p, idx) => {
          const d = p.getAttribute("d");
          if (d && !p.id.includes("kvg:StrokeNumbers")) {
            strokes.push({
              id: p.id || `s-${idx}`,
              d,
            });
          }
        });

        const numEls = Array.from(doc.querySelectorAll("text"));
        const numbers: NumberInfo[] = numEls.map((t) => ({
          text: t.textContent || "",
          transform: t.getAttribute("transform") || "",
        }));

        const parsed: ParsedKanjiSvg = {
          strokes,
          numbers,
          viewBox: doc.querySelector("svg")?.getAttribute("viewBox") || "0 0 109 109",
        };

        svgCache.set(hex, parsed);
        setSvgData(parsed);
        setActiveStrokeIndex(0);
        setIsStrokeDrawing(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setSvgData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchSvg();

    return () => {
      cancelled = true;
    };
  }, [currentChar]);

  // 2. Measure actual path lengths once SVG paths are mounted in DOM
  useEffect(() => {
    if (!svgData || svgData.strokes.length === 0) return;

    const lengths = pathsRef.current.map((path) => {
      try {
        return path ? path.getTotalLength() : 150;
      } catch {
        return 150;
      }
    });

    setStrokeLengths(lengths);
    setActiveStrokeIndex(0);
    setIsStrokeDrawing(false);
  }, [svgData]);

  // 3. Smooth brush stroke-by-stroke animation sequencer with automatic looping replay
  useEffect(() => {
    if (!svgData || strokeLengths.length === 0) return;

    if (activeStrokeIndex >= svgData.strokes.length) {
      // Auto replay after short pause
      animTimeoutRef.current = setTimeout(() => {
        setActiveStrokeIndex(0);
        setIsStrokeDrawing(false);
      }, 1800);

      return () => {
        if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      };
    }

    // Trigger stroke drawing transition
    setIsStrokeDrawing(false);
    const frameId = requestAnimationFrame(() => {
      setIsStrokeDrawing(true);
    });

    // Speed 0.5x duration for natural, clear calligraphy stroke visibility
    const currentLen = strokeLengths[activeStrokeIndex] || 120;
    const baseDuration = Math.max(400, Math.min(800, currentLen * 4.5));
    const strokeDuration = baseDuration / speed;

    animTimeoutRef.current = setTimeout(() => {
      setActiveStrokeIndex((prev) => prev + 1);
    }, strokeDuration + 120);

    return () => {
      cancelAnimationFrame(frameId);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [activeStrokeIndex, speed, strokeLengths, svgData]);

  return (
    <div className={cn("flex flex-col items-center border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-4 text-center shadow-sm", className)}>
      {/* Compact Character Switcher if multiple Kanji (e.g. 半 / 島) */}
      {kanjiList.length > 1 && (
        <div className="mb-3 flex items-center gap-1 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-0.5">
          {kanjiList.map((char, idx) => (
            <button
              key={`${char}-${idx}`}
              type="button"
              onClick={() => {
                setSelectedCharIndex(idx);
                setActiveStrokeIndex(0);
                setIsStrokeDrawing(false);
              }}
              className={cn(
                "px-2.5 py-0.5 font-[family-name:var(--font-headline)] text-xs font-bold transition-all",
                selectedCharIndex === idx
                  ? "bg-black text-white shadow-sm"
                  : "text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
              )}
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {/* Main Canvas with Traditional Japanese Calligraphy Manuscript Grid (米字格) */}
      <div className="relative flex h-44 w-44 items-center justify-center border border-[var(--color-outline-variant)] bg-[var(--color-surface)] overflow-hidden">
        {/* Background Quadrant & Diagonal Grid Lines */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full stroke-[var(--color-outline-variant)]/60"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="0" y1="50%" x2="100%" y2="50%" strokeDasharray="3,3" strokeWidth="1" />
          <line x1="50%" y1="0" x2="50%" y2="100%" strokeDasharray="3,3" strokeWidth="1" />
          <line x1="0" y1="0" x2="100%" y2="100%" strokeDasharray="2,4" strokeWidth="0.5" />
          <line x1="100%" y1="0" x2="0" y2="100%" strokeDasharray="2,4" strokeWidth="0.5" />
        </svg>

        {loading ? (
          <div className="flex flex-col items-center justify-center text-xs text-[var(--color-secondary)]">
            <span className="material-symbols-outlined mb-1 animate-spin text-xl">
              progress_activity
            </span>
            <span className="text-[11px]">Loading...</span>
          </div>
        ) : error || !svgData ? (
          /* Fallback static Kanji */
          <div className="font-[family-name:var(--font-headline)] text-6xl font-bold text-[var(--color-primary)]">
            {currentChar}
          </div>
        ) : (
          /* Ultra-Smooth SVG Animated Strokes with Permanent Numbers */
          <svg
            viewBox={svgData.viewBox}
            className="relative z-10 h-36 w-36"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 1. Ghost Strokes in subtle background guide */}
            <g className="stroke-[var(--color-outline-variant)]/30" fill="none" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
              {svgData.strokes.map((s) => (
                <path key={`ghost-${s.id}`} d={s.d} />
              ))}
            </g>

            {/* 2. Fluid Brush Animated Strokes */}
            <g fill="none" stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-primary)]">
              {svgData.strokes.map((s, idx) => {
                const len = strokeLengths[idx] || 150;
                const isPast = idx < activeStrokeIndex;
                const isCurrent = idx === activeStrokeIndex;

                let strokeOffset = len;
                let transitionStyle = "none";

                if (isPast) {
                  strokeOffset = 0;
                } else if (isCurrent) {
                  strokeOffset = isStrokeDrawing ? 0 : len;
                  const currentLen = strokeLengths[activeStrokeIndex] || 120;
                  const baseDuration = Math.max(400, Math.min(800, currentLen * 4.5));
                  const strokeDuration = baseDuration / speed;
                  transitionStyle = isStrokeDrawing
                    ? `stroke-dashoffset ${strokeDuration}ms cubic-bezier(0.35, 0.0, 0.25, 1.0)`
                    : "none";
                }

                return (
                  <path
                    key={`stroke-${s.id}`}
                    d={s.d}
                    ref={(el) => {
                      pathsRef.current[idx] = el;
                    }}
                    style={{
                      strokeDasharray: len,
                      strokeDashoffset: strokeOffset,
                      transition: transitionStyle,
                      opacity: isPast || (isCurrent && isStrokeDrawing) ? 1 : 0,
                    }}
                    className={cn(
                      isCurrent && "text-black"
                    )}
                  />
                );
              })}
            </g>

            {/* 3. Stroke Order Numbers (Always visible per stroke order) */}
            <g className="fill-[var(--color-secondary)] font-sans text-[7.5px] font-bold select-none">
              {svgData.numbers.slice(0, activeStrokeIndex + 1).map((n, idx) => (
                <text key={`num-${idx}`} transform={n.transform}>
                  {n.text}
                </text>
              ))}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
