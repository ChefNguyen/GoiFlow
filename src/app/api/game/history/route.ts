import { NextRequest, NextResponse } from "next/server";
import {
  getSessionsHistory,
  normalizeHistoryLimit,
  normalizeHistorySessionIds,
} from "@/server/services/game-history-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const sessionIds = normalizeHistorySessionIds(
      body && typeof body === "object" && "sessionIds" in body ? body.sessionIds : undefined
    );

    if (sessionIds.length === 0) {
      return NextResponse.json({ history: [], limit: normalizeHistoryLimit(undefined) });
    }

    const limit = normalizeHistoryLimit(
      body && typeof body === "object" && "limit" in body ? body.limit : undefined
    );
    const history = await getSessionsHistory(sessionIds, limit);

    return NextResponse.json({ history, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
