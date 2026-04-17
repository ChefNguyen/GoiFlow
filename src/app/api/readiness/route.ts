import { NextResponse } from "next/server";
import { getReadinessSnapshot } from "@/server/services/readiness-service";

export function GET() {
  return NextResponse.json(getReadinessSnapshot());
}
