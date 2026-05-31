import { NextResponse } from "next/server";
import { getSessionHistory } from "@/server/services/game-history-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const history = await getSessionHistory(sessionId);

    return NextResponse.json({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
