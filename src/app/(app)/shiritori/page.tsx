import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const players = [
  { name: "Guest player", words: 12, active: true },
  { name: "ZenMaster", words: 12, active: false },
];

const history = [
  { word: "くすり", meaning: "kusuri (medicine)", player: "ZenMaster", active: false },
  { word: "りく", meaning: "riku (land)", player: "Guest player", active: true },
  { word: "あり", meaning: "ari (ant)", player: "ZenMaster", active: false },
  { word: "しあわせ", meaning: "shiawase (happiness)", player: "Guest player", active: false, faded: true },
];

export default function ShiritoriPage() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] p-6 lg:p-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 lg:flex-row lg:gap-24">
        <section className="flex-1 border-l-4 border-[var(--color-primary)] pl-8">
          <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            Current word
          </p>
          <div className="mt-4 font-[family-name:var(--font-headline)] text-6xl font-black leading-none text-[var(--color-primary)] md:text-8xl lg:text-9xl">
            りん<span className="text-[var(--color-secondary)]">ご</span>
          </div>
          <p className="mt-2 text-lg tracking-[0.12em] text-[var(--color-secondary)]">
            rin<span className="font-bold text-[var(--color-primary)]">go</span> (apple)
          </p>

          <div className="mt-12 w-full max-w-xl">
            <div className="mb-2 flex items-center justify-between font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              <span>Your turn</span>
              <span className="font-bold text-[var(--color-error)]">00:14</span>
            </div>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 font-[family-name:var(--font-headline)] text-4xl font-black text-[var(--color-primary)]">
                ご
              </span>
              <Input
                autoFocus
                placeholder="Enter word ending in n..."
                className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent py-4 pl-16 text-4xl font-[family-name:var(--font-headline)] text-[var(--color-primary)] placeholder:text-[var(--color-outline-variant)] focus-visible:ring-0"
              />
            </div>
            <p className="mt-2 text-right text-xs text-[var(--color-secondary)]">
              Press Enter to submit
            </p>
          </div>
        </section>

        <aside className="w-full space-y-12 lg:w-96">
          <section className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Chain length
              </span>
              <span className="font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)]">
                24
              </span>
            </div>
            <div className="space-y-4">
              <p className="border-b border-[var(--color-outline-variant)] pb-2 font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Active players
              </p>
              {players.map((player) => (
                <div key={player.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={player.active ? "h-2 w-2 bg-[var(--color-primary)]" : "h-2 w-2 bg-[var(--color-outline)]"} />
                    <span className={player.active ? "text-sm font-bold text-[var(--color-primary)]" : "text-sm text-[var(--color-primary)]"}>
                      {player.name}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-secondary)]">{player.words} words</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 border-b-2 border-[var(--color-primary)] pb-2 font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
              Word history
            </div>
            <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
              {history.map((item) => (
                <div
                  key={item.word}
                  className={item.active
                    ? "flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4 last:border-b-0"
                    : item.faded
                      ? "flex items-center justify-between border-b border-[var(--color-outline-variant)] p-4 opacity-50 last:border-b-0"
                      : "flex items-center justify-between border-b border-[var(--color-outline-variant)] p-4 last:border-b-0"}
                >
                  <div className="flex flex-col">
                    <span className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-primary)]">
                      {item.word}
                    </span>
                    <span className="text-xs text-[var(--color-secondary)]">{item.meaning}</span>
                  </div>
                  <span className={item.active ? "text-xs font-bold text-[var(--color-primary)]" : "text-xs text-[var(--color-secondary)]"}>
                    {item.player}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-3">
            <Button variant="primary" className="w-full py-4">
              New session
            </Button>
            <Button variant="secondary" className="w-full py-4">
              Return to practice
            </Button>
          </div>
        </aside>
      </div>
    </main>
  );
}
