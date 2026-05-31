import { describe, expect, it } from "vitest";
import {
  MAX_HISTORY_ENTRIES,
  normalizeHistoryLimit,
  normalizeHistorySessionIds,
} from "@/server/services/game-history-service";

describe("game history normalization", () => {
  it("deduplicates and trims played session ids", () => {
    expect(normalizeHistorySessionIds([" session-1 ", "session-2", "session-1", "", null])).toEqual([
      "session-1",
      "session-2",
    ]);
  });

  it("rejects non-array session id input", () => {
    expect(normalizeHistorySessionIds("session-1")).toEqual([]);
  });

  it("caps history limits at 100 entries", () => {
    expect(normalizeHistoryLimit(500)).toBe(MAX_HISTORY_ENTRIES);
    expect(normalizeHistoryLimit(24.8)).toBe(24);
    expect(normalizeHistoryLimit(undefined)).toBe(MAX_HISTORY_ENTRIES);
  });
});
