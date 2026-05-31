import { NextRequest, NextResponse } from "next/server";
import { findVocabularyHistoryDetailsById } from "@/server/repositories/content-repository";
import { toVocabularyHistoryDetails } from "@/server/services/content-selection-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ vocabularyEntryId: string }> }
) {
  try {
    const { vocabularyEntryId } = await params;
    const normalizedId = vocabularyEntryId.trim();

    if (!normalizedId) {
      return NextResponse.json({ error: "vocabularyEntryId is required" }, { status: 400 });
    }

    const vocabularyEntry = await findVocabularyHistoryDetailsById(normalizedId);
    if (!vocabularyEntry) {
      return NextResponse.json({ error: "Vocabulary entry not found" }, { status: 404 });
    }

    return NextResponse.json({
      vocabularyEntryId: vocabularyEntry.id,
      details: toVocabularyHistoryDetails(vocabularyEntry),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
