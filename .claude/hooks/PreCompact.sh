#!/bin/bash
# PreCompact.sh
# Runs right before Claude Code compacts the context to save tokens.
# Print essential state and reminders that must survive compaction.

echo "--- GoiFlow Pre-Compaction Reminder ---"
echo ""
echo "RETAIN:"
echo "  1. The current feature scope from tasks/todo.md (if open)"
echo "  2. Any pending verification steps (npm run verify must still pass)"
echo "  3. The active Sprint goal from PROJECT_ROADMAP_4_SPRINTS.md"
echo "  4. Any GitNexus impact analysis results from this session"
echo ""
echo "ARCHITECTURE RULES (never forget):"
echo "  - Data access: src/server/ repositories only, not inline Prisma in routes"
echo "  - Auth: every protected route validates auth() or participantId ownership"
echo "  - Content: always filter by jlptLevel, never full scan KanjiEntry/VocabularyEntry"
echo ""
echo "CONSULT CLAUDE.md if you lose context on GoiFlow architectural rules."
echo "--- End Pre-Compaction Reminder ---"
