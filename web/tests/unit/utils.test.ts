import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names properly", () => {
    expect(cn("px-2 py-1", "bg-black")).toBe("px-2 py-1 bg-black");
  });

  it("handles conditional classes", () => {
    const isTrue = true;
    const isFalse = false;
    expect(cn("base-class", isTrue && "active-class", isFalse && "inactive-class")).toBe(
      "base-class active-class"
    );
  });

  it("overrides conflicting tailwind classes cleanly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
