import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    service: "goiflow",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
