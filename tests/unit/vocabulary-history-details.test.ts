import { describe, expect, it } from "vitest";
import { toVocabularyHistoryDetails } from "@/server/services/content-selection-service";

describe("toVocabularyHistoryDetails", () => {
  it("maps VocabularyEntry fields into the word history detail shape", () => {
    const details = toVocabularyHistoryDetails({
      id: "vocab-1",
      reading: "べんきょう",
      meaningsVi: ["học tập"],
      amHanViet: ["miễn cường"],
    });

    expect(details).toEqual({
      meaningsVi: ["học tập"],
      amHanViet: ["miễn cường"],
      onyomi: ["べんきょう"],
      kunyomi: [],
    });
  });

  it("does not add an empty reading to onyomi", () => {
    const details = toVocabularyHistoryDetails({
      id: "vocab-2",
      reading: "",
      meaningsVi: [],
      amHanViet: [],
    });

    expect(details.onyomi).toEqual([]);
  });
});
