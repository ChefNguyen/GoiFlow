import { describe, expect, it } from "vitest";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as readinessGet } from "@/app/api/readiness/route";

describe("platform routes", () => {
  it("returns a healthy response", async () => {
    const response = healthGet();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      service: "goiflow",
      status: "ok",
    });
  });

  it("returns readiness requirements", async () => {
    const response = readinessGet();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.service).toBe("goiflow");
    expect(Array.isArray(payload.requirements)).toBe(true);
  });
});
