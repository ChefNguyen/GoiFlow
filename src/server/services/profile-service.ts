import { prisma } from "@/server/db/client";

// ── XP thresholds: level = floor(sqrt(totalXp / 100)) + 1 ──────────────────
export function computeLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, totalXp) / 100)) + 1;
}

export function computeRank(level: number): string {
  if (level >= 50) return "Grand Master";
  if (level >= 40) return "Scholar Rank";
  if (level >= 30) return "Advanced";
  if (level >= 20) return "Intermediate";
  if (level >= 10) return "Beginner";
  return "Newcomer";
}

// ── Date helpers ──────────────────────────────────────────────────────────────
/**
 * Returns "YYYY-MM-DD" in the local timezone (avoids UTC offset issues).
 */
export function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── Heatmap ─────────────────────────────────────────────────────────────────
// Classify daily submission count into intensity buckets
function classifyActivity(count: number): string {
  if (count === 0) return "empty";
  if (count <= 5) return "light";
  if (count <= 15) return "mid";
  if (count <= 30) return "medium";
  return "strong";
}

/**
 * Build a 12-column × 7-row heatmap grid covering the last 84 days.
 * Each column represents one week (Mon–Sun). Columns run oldest → newest (left → right).
 */
export function buildHeatmapColumns(
  activityByDay: Map<string, number>, // key: "YYYY-MM-DD" (local timezone)
): string[][] {
  const now = new Date();
  // Align to the end of today
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // We want 12 full weeks. The last week ends on today's weekday.
  // We step back (12 * 7 - 1) days from today to get the start date.
  const totalDays = 12 * 7; // 84 days
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (totalDays - 1));

  // Build flat list of 84 days from startDate → today
  const days: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(toLocalDateString(d));
  }

  // Reshape into 12 columns × 7 rows
  const columns: string[][] = [];
  for (let col = 0; col < 12; col++) {
    const column: string[] = [];
    for (let row = 0; row < 7; row++) {
      const dayKey = days[col * 7 + row];
      const count = dayKey ? (activityByDay.get(dayKey) ?? 0) : 0;
      column.push(classifyActivity(count));
    }
    columns.push(column);
  }

  return columns;
}

// ── Streak ───────────────────────────────────────────────────────────────────
/**
 * Count consecutive days (ending today or yesterday) that have at least one submission.
 */
export function computeStreak(activeDays: Set<string>): number {
  const now = new Date();
  const todayStr = toLocalDateString(now);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  // Streak must anchor on today or yesterday
  if (!activeDays.has(todayStr) && !activeDays.has(yesterdayStr)) return 0;

  let streak = 0;
  const cursor = new Date(activeDays.has(todayStr) ? now : yesterday);

  while (true) {
    const key = toLocalDateString(cursor);
    if (!activeDays.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ── Accuracy ─────────────────────────────────────────────────────────────────
export function computeAccuracy(correctCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((correctCount / totalCount) * 1000) / 10; // 1 decimal
}

// ── Public API ────────────────────────────────────────────────────────────────

export type UserProfileStats = {
  displayName: string;
  avatarInitial: string;
  avatarUrl?: string | null;
  level: number;
  rank: string;
  totalVocabularyMastered: number;
  currentStreak: number;
  accuracyRate: number;
  heatmapColumns: string[][];
};

export async function getUserProfileStats(userId: string): Promise<UserProfileStats> {
  // Fetch user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });

  const displayName = user?.name ?? user?.email ?? "Learner";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const avatarUrl = user?.image;

  // Fetch all participant records for this user
  const participants = await prisma.gameParticipant.findMany({
    where: { userId },
    select: { id: true, gameSessionId: true },
  });

  const participantIds = participants.map((p) => p.id);

  if (participantIds.length === 0) {
    return {
      displayName,
      avatarInitial,
      avatarUrl,
      level: 1,
      rank: computeRank(1),
      totalVocabularyMastered: 0,
      currentStreak: 0,
      accuracyRate: 0,
      heatmapColumns: buildHeatmapColumns(new Map()),
    };
  }

  // Fetch all submissions for this user
  const submissions = await prisma.gameSubmission.findMany({
    where: { participantId: { in: participantIds } },
    select: {
      isCorrect: true,
      scoreAwarded: true,
      submittedAt: true,
      gameRound: { select: { vocabularyEntryId: true } },
    },
  });

  // Stats calculation
  let totalSubmissions = 0;
  let correctSubmissions = 0;
  let totalXp = 0;
  const activityByDay = new Map<string, number>();
  const masteredVocabIds = new Set<string>();

  for (const sub of submissions) {
    totalSubmissions++;
    if (sub.isCorrect) {
      correctSubmissions++;
      if (sub.gameRound.vocabularyEntryId) {
        masteredVocabIds.add(sub.gameRound.vocabularyEntryId);
      }
    }
    totalXp += sub.scoreAwarded ?? 0;

    const dayKey = toLocalDateString(sub.submittedAt);
    activityByDay.set(dayKey, (activityByDay.get(dayKey) ?? 0) + 1);
  }

  const activeDays = new Set(activityByDay.keys());
  const level = computeLevel(totalXp);

  return {
    displayName,
    avatarInitial,
    avatarUrl,
    level,
    rank: computeRank(level),
    totalVocabularyMastered: masteredVocabIds.size,
    currentStreak: computeStreak(activeDays),
    accuracyRate: computeAccuracy(correctSubmissions, totalSubmissions),
    heatmapColumns: buildHeatmapColumns(activityByDay),
  };
}

// ── Recent Sessions ───────────────────────────────────────────────────────────

export type RecentSession = {
  id: string;
  date: string;
  icon: string;
  title: string;
  subtitle: string;
  score: string;
  xp: string;
};

function formatRelativeDate(d: Date): string {
  const now = new Date();
  const todayStr = toLocalDateString(now);
  const dStr = toLocalDateString(d);

  if (dStr === todayStr) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dStr === toLocalDateString(yesterday)) return "Yesterday";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function getUserRecentSessions(
  userId: string,
  limit = 5,
): Promise<RecentSession[]> {
  const participants = await prisma.gameParticipant.findMany({
    where: { userId },
    select: { id: true },
  });

  const participantIds = participants.map((p) => p.id);
  if (participantIds.length === 0) return [];

  const results = await prisma.gameResult.findMany({
    where: { participantId: { in: participantIds } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      gameSession: {
        select: {
          roomCode: true,
          jlptLevel: true,
          maxRounds: true,
          finishedAt: true,
        },
      },
    },
  });

  return results.map((result) => {
    const session = result.gameSession;
    const totalRounds = session.maxRounds;
    const accuracyPct =
      totalRounds > 0 ? Math.round((result.correctCount / totalRounds) * 100) : 0;
    const finishedAt = session.finishedAt ?? result.createdAt;

    return {
      id: result.id,
      date: formatRelativeDate(finishedAt),
      icon: "menu_book",
      title: `${session.jlptLevel} Vocabulary Session`,
      subtitle: `${result.correctCount} of ${totalRounds} correct`,
      score: totalRounds > 0 ? `${accuracyPct}% Correct` : "-",
      xp: `+${result.totalScore} XP`,
    };
  });
}
