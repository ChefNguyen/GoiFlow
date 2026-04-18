import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const players = [
  { rank: 1, name: "Guest player", words: 12, active: true },
  { rank: 2, name: "ZenMaster", words: 12 },
  { rank: 3, name: "KanaPulse", words: 9 },
];

const history = [
  { word: "くすり", meaning: "kusuri (medicine)", player: "ZenMaster" },
  { word: "りく", meaning: "riku (land)", player: "Guest player", active: true },
  { word: "あり", meaning: "ari (ant)", player: "ZenMaster" },
  { word: "しあわせ", meaning: "shiawase (happiness)", player: "Guest player", faded: true },
];

export default function ShiritoriPage() {
  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col lg:h-[calc(100vh-65px)] lg:flex-row">
      <aside className="hidden w-72 shrink-0 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="border-b border-[var(--color-outline-variant)] p-6">
          <h2 className="mt-1 text-lg font-bold text-[var(--color-primary)]">
            Chain history
          </h2>
        </div>
        <div className="flex flex-1 flex-col">
          {history.map((item) => (
            <div
              key={item.word}
              className={item.active
                ? "border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] p-4"
                : item.faded
                  ? "border-b border-[var(--color-outline-variant)] p-4 opacity-50"
                  : "border-b border-[var(--color-outline-variant)] p-4 transition-none hover:bg-[var(--color-surface-container)]"}
            >
              <div className="mb-1 flex items-baseline justify-between gap-4">
                <span className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-primary)]">
                  {item.word}
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-secondary)]">
                  {item.player}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-[var(--color-secondary)]">{item.meaning}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
        <Progress value={72} className="absolute left-0 top-0 h-1 bg-[var(--color-surface-container-high)]" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 lg:px-10">
          <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
            <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Current word
            </p>
            <h1 className="mt-4 select-none font-[family-name:var(--font-headline)] text-[6rem] font-bold leading-none text-[var(--color-primary)] md:text-[9rem]">
              りん<span className="text-[var(--color-secondary)]">ご</span>
            </h1>
            <p className="mt-4 text-lg tracking-[0.12em] text-[var(--color-secondary)]">
              rin<span className="font-bold text-[var(--color-primary)]">go</span> (apple)
            </p>
          </div>

          <div className="w-full max-w-md pb-8">
            <div className="mb-2 flex items-center justify-between font-[family-name:var(--font-label)] text-[0.75rem] font-medium uppercase tracking-[0.15em] text-[var(--color-secondary)]">
              <span>Your turn</span>
              <span className="font-bold text-[var(--color-error)]">00:14</span>
            </div>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 font-[family-name:var(--font-headline)] text-4xl font-bold text-[var(--color-primary)]">
                ご
              </span>
              <Input
                autoFocus
                autoComplete="off"
                placeholder="Enter next word"
                className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent py-4 pl-16 text-4xl font-[family-name:var(--font-headline)] text-[var(--color-primary)] placeholder:text-[var(--color-outline-variant)] focus-visible:ring-0"
              />
            </div>
            <p className="mt-2 text-right text-xs text-[var(--color-secondary)]">
              Press Enter to submit
            </p>
          </div>
        </div>
      </main>

      <aside className="hidden w-72 shrink-0 border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex lg:flex-col">
        <div className="flex items-start justify-between border-b border-[var(--color-outline-variant)] p-6">
          <div>
            <p className="font-[family-name:var(--font-label)] text-[0.75rem] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Shiritori room
            </p>
            <h2 className="mt-1 text-lg font-bold text-[var(--color-primary)]">
              ROOM_CODE: SI42
            </h2>
          </div>
          <div className="text-right">
            <p className="font-[family-name:var(--font-label)] text-[0.75rem] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Chain length
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-primary)]">24</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {players.map((player) => (
            <div
              key={player.rank}
              className={player.active
                ? "flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)] p-4"
                : "flex items-center justify-between border-b border-[var(--color-outline-variant)] p-4 transition-none hover:bg-[var(--color-surface-container)]"}
            >
              <div className="flex items-center gap-3">
                <span className={player.active ? "w-4 font-bold text-[var(--color-primary)]" : "w-4 font-bold text-[var(--color-secondary)]"}>
                  {player.rank}
                </span>
                <span className={player.active ? "font-medium text-[var(--color-primary)]" : "font-medium text-[var(--color-secondary)]"}>
                  {player.name}
                </span>
              </div>
              <span className={player.active ? "font-bold text-[var(--color-primary)]" : "font-bold text-[var(--color-secondary)]"}>
                {player.words}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-2 border-t border-[var(--color-outline-variant)] p-4">
          <Link href="/leaderboard" className="block">
            <Button variant="primary" className="w-full py-3">
              View results
            </Button>
          </Link>
          <Link href="/game/setup" className="block">
            <Button variant="secondary" className="w-full py-3">
              Leave
            </Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}
