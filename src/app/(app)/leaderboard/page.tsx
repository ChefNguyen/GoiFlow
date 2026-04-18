import Link from "next/link";
import { Button } from "@/components/ui/button";

type PodiumEntry = {
  rank: number;
  name: string;
  score: string;
  streak: string;
  height: string;
  outerClassName: string;
  barClassName: string;
  rankClassName: string;
  nameClassName: string;
  highlighted?: boolean;
};

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: string;
  streak: string;
  active?: boolean;
  muted?: boolean;
};

const podiumEntries: PodiumEntry[] = [
  {
    rank: 2,
    name: "ZenMaster",
    score: "11,980",
    streak: "12 wins",
    height: "h-[140px]",
    outerClassName: "max-w-[160px]",
    barClassName: "bg-[var(--color-surface-container-high)] border-[var(--color-primary)]",
    rankClassName: "text-4xl text-[var(--color-primary)] opacity-20",
    nameClassName: "text-2xl",
  },
  {
    rank: 1,
    name: "Calligrapher",
    score: "12,420",
    streak: "18 wins",
    height: "h-[200px]",
    outerClassName: "max-w-[180px]",
    barClassName: "bg-[var(--color-primary)] border-[var(--color-primary)]",
    rankClassName: "text-6xl text-[var(--color-on-primary)] opacity-20",
    nameClassName: "text-3xl",
    highlighted: true,
  },
  {
    rank: 3,
    name: "KanaPulse",
    score: "10,640",
    streak: "9 wins",
    height: "h-[100px]",
    outerClassName: "max-w-[160px]",
    barClassName: "bg-[var(--color-surface)] border-[var(--color-outline-variant)]",
    rankClassName: "text-4xl text-[var(--color-primary)] opacity-20",
    nameClassName: "text-2xl",
  },
];

const leaderboardEntries: LeaderboardEntry[] = [
  { rank: 1, name: "Calligrapher", score: "12,420", streak: "18 wins", active: true },
  { rank: 2, name: "ZenMaster", score: "11,980", streak: "12 wins" },
  { rank: 3, name: "KanaPulse", score: "10,640", streak: "9 wins" },
  { rank: 4, name: "InkRunner", score: "9,880", streak: "6 wins" },
  { rank: 5, name: "SoraType", score: "9,210", streak: "5 wins", muted: true },
];

export default function LeaderboardPage() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <header className="mb-20 text-center">
          <h1 className="mb-4 font-[family-name:var(--font-headline)] text-5xl font-bold uppercase tracking-tight text-[var(--color-primary)] md:text-6xl">
            Results
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            Shiritori Room: SI42 • 24 Chain Length
          </p>
        </header>

        <section className="mb-24 flex h-64 w-full max-w-3xl items-end justify-center gap-2 md:gap-6">
          {podiumEntries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex w-1/3 flex-col items-center ${entry.outerClassName}`}
            >
              <div className="mb-4 text-center">
                {entry.highlighted ? (
                  <span
                    className="material-symbols-outlined mb-1 text-[var(--color-primary)]"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    workspace_premium
                  </span>
                ) : null}
                <span
                  className={`block font-[family-name:var(--font-headline)] font-bold text-[var(--color-primary)] ${entry.nameClassName}`}
                >
                  {entry.name}
                </span>
                <span className="block font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)]">
                  {entry.score}
                </span>
              </div>
              <div
                className={`flex w-full items-start justify-center border pt-4 ${entry.height} ${entry.barClassName} ${entry.highlighted ? "pt-6" : ""}`}
              >
                <span
                  className={`font-[family-name:var(--font-headline)] font-bold ${entry.rankClassName}`}
                >
                  {entry.rank}
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-16 w-full max-w-3xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-[var(--color-primary)]">
                  <th className="w-16 py-4 pl-4 pr-2 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
                    Rank
                  </th>
                  <th className="px-4 py-4 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
                    Username
                  </th>
                  <th className="px-4 py-4 text-right font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
                    Score
                  </th>
                  <th className="px-4 py-4 text-right font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody className="font-[family-name:var(--font-body)] text-sm">
                {leaderboardEntries.map((entry) => (
                  <tr
                    key={entry.rank}
                    className={entry.active
                      ? "border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]"
                      : "border-b border-[var(--color-outline-variant)]"}
                  >
                    <td className={entry.active
                      ? "py-5 pl-4 pr-2 font-[family-name:var(--font-headline)] font-bold text-[var(--color-primary)]"
                      : "py-5 pl-4 pr-2 font-[family-name:var(--font-headline)] text-[var(--color-secondary)]"}
                    >
                      {String(entry.rank).padStart(2, "0")}
                    </td>
                    <td className={entry.active
                      ? "px-4 py-5 font-bold text-[var(--color-primary)]"
                      : entry.muted
                        ? "px-4 py-5 text-[var(--color-primary)] opacity-50"
                        : "px-4 py-5 text-[var(--color-primary)]"}
                    >
                      {entry.name}
                    </td>
                    <td className={entry.muted
                      ? "px-4 py-5 text-right opacity-50"
                      : "px-4 py-5 text-right font-medium text-[var(--color-on-surface)]"}
                    >
                      {entry.score}
                    </td>
                    <td className={entry.muted
                      ? "px-4 py-5 text-right text-[var(--color-secondary)] opacity-50"
                      : "px-4 py-5 text-right text-[var(--color-secondary)]"}
                    >
                      {entry.streak}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row">
          <Link href="/shiritori" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full px-10 py-4 text-sm tracking-widest !text-[var(--color-on-primary)] sm:w-auto">
              Play Again
            </Button>
          </Link>
          <Link href="/shiritori/setup" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full px-10 py-4 text-sm tracking-widest sm:w-auto">
              New Room
            </Button>
          </Link>
          <Button variant="tertiary" className="w-full px-6 py-4 text-sm tracking-widest sm:w-auto">
            Share
          </Button>
        </section>
      </div>
    </main>
  );
}
