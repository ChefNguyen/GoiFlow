import { describe, expect, it } from "vitest";
import {
  computeLevel,
  computeRank,
  computeAccuracy,
  computeStreak,
  buildHeatmapColumns,
  toLocalDateString,
} from "@/server/services/profile-service";

// ── computeLevel ──────────────────────────────────────────────────────────────
describe("computeLevel", () => {
  it("returns level 1 for 0 XP", () => {
    expect(computeLevel(0)).toBe(1);
  });

  it("returns level 1 for XP below 100", () => {
    expect(computeLevel(99)).toBe(1);
  });

  it("returns level 2 for 100 XP (sqrt(100/100)=1, +1=2)", () => {
    expect(computeLevel(100)).toBe(2);
  });

  it("returns level 11 for 10000 XP", () => {
    expect(computeLevel(10000)).toBe(11);
  });

  it("handles negative XP gracefully", () => {
    expect(computeLevel(-50)).toBe(1);
  });
});

// ── computeRank ───────────────────────────────────────────────────────────────
describe("computeRank", () => {
  it("returns Newcomer for level 1", () => {
    expect(computeRank(1)).toBe("Newcomer");
  });
  it("returns Beginner for level 10", () => {
    expect(computeRank(10)).toBe("Beginner");
  });
  it("returns Scholar Rank for level 40", () => {
    expect(computeRank(40)).toBe("Scholar Rank");
  });
  it("returns Grand Master for level 50+", () => {
    expect(computeRank(50)).toBe("Grand Master");
  });
});

// ── computeAccuracy ───────────────────────────────────────────────────────────
describe("computeAccuracy", () => {
  it("returns 0 for 0 total submissions", () => {
    expect(computeAccuracy(0, 0)).toBe(0);
  });

  it("returns 100 for all correct", () => {
    expect(computeAccuracy(10, 10)).toBe(100);
  });

  it("returns 50 for half correct", () => {
    expect(computeAccuracy(5, 10)).toBe(50);
  });

  it("returns a correctly rounded 1-decimal value", () => {
    // 1/3 = 33.333... → rounds to 33.3
    expect(computeAccuracy(1, 3)).toBe(33.3);
  });
});

// ── computeStreak ─────────────────────────────────────────────────────────────
describe("computeStreak", () => {
  const today = new Date();
  const todayStr = toLocalDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const twoDaysAgoStr = toLocalDateString(twoDaysAgo);

  it("returns 0 when no activity", () => {
    expect(computeStreak(new Set())).toBe(0);
  });

  it("returns 0 when last activity was 2+ days ago", () => {
    expect(computeStreak(new Set([twoDaysAgoStr]))).toBe(0);
  });

  it("returns 1 when only today has activity", () => {
    expect(computeStreak(new Set([todayStr]))).toBe(1);
  });

  it("returns 1 when only yesterday has activity", () => {
    expect(computeStreak(new Set([yesterdayStr]))).toBe(1);
  });

  it("returns 3 for a 3-day consecutive streak ending today", () => {
    expect(computeStreak(new Set([todayStr, yesterdayStr, twoDaysAgoStr]))).toBe(3);
  });

  it("breaks streak when a day is missing", () => {
    // today and twoDaysAgo but NOT yesterday → streak is 1
    expect(computeStreak(new Set([todayStr, twoDaysAgoStr]))).toBe(1);
  });
});

// ── buildHeatmapColumns ───────────────────────────────────────────────────────
describe("buildHeatmapColumns", () => {
  it("returns exactly 12 columns", () => {
    const cols = buildHeatmapColumns(new Map());
    expect(cols).toHaveLength(12);
  });

  it("each column has exactly 7 rows", () => {
    const cols = buildHeatmapColumns(new Map());
    for (const col of cols) {
      expect(col).toHaveLength(7);
    }
  });

  it("uses 'empty' for days with no activity", () => {
    const cols = buildHeatmapColumns(new Map());
    for (const col of cols) {
      for (const cell of col) {
        expect(cell).toBe("empty");
      }
    }
  });

  it("classifies today's activity in the last column", () => {
    const today = new Date();
    const todayStr = toLocalDateString(today);
    const activity = new Map([[todayStr, 50]]); // 50 submissions → 'strong'
    const cols = buildHeatmapColumns(activity);
    const lastCol = cols[cols.length - 1];
    // today maps to the last cell of the last column
    expect(lastCol[lastCol.length - 1]).toBe("strong");
  });

  it("classifies low activity as 'light'", () => {
    const today = new Date();
    const todayStr = toLocalDateString(today);
    const activity = new Map([[todayStr, 3]]); // 3 submissions → 'light'
    const cols = buildHeatmapColumns(activity);
    const lastCol = cols[cols.length - 1];
    expect(lastCol[lastCol.length - 1]).toBe("light");
  });
});
