import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

const featureCards = [
  {
    icon: "psychology",
    title: "Quiz Mode",
    description:
      "Engage in adaptive testing that challenges your recall. Spaced repetition algorithms ensure lasting retention of complex characters.",
  },
  {
    icon: "menu_book",
    title: "Kanji Info",
    description:
      "Deep dive into stroke order, radical breakdown, and contextual examples for every character in the JLPT syllabus.",
  },
  {
    icon: "leaderboard",
    title: "Leaderboard",
    description:
      "Track your mastery against global peers. A metric-driven approach to language acquisition.",
  },
];

const navLinks = [
  { href: "/game/setup", label: "Game" },
  { href: "/shiritori", label: "Shiritori" },
  { href: "/library", label: "Library" },
  { href: "/settings", label: "Settings" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-primary)] bg-[var(--color-surface)]">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-headline)] text-2xl font-bold tracking-[0.08em]"
          >
            語彙フロー
          </Link>

          <div className="hidden h-full items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex h-full items-center font-[family-name:var(--font-headline)] tracking-[0.08em] text-[var(--color-secondary)] transition-colors duration-[50ms] hover:text-[var(--color-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className={buttonStyles("secondary", "px-4 py-3")}>
              Sign in
            </Link>
            <Link href="/game/setup" className={buttonStyles("primary", "px-4 py-3 !text-white")}>
              Start game
            </Link>
          </div>
        </div>
      </nav>

      <section className="flex min-h-[716px] flex-col items-center justify-center px-4 pt-16">
        <div className="mx-auto max-w-3xl space-y-12 text-center">
          <h1 className="font-[family-name:var(--font-headline)] text-[4rem] leading-tight font-bold tracking-tight md:text-[5rem] lg:text-[6rem]">
            語彙フロー
          </h1>
          <p className="mx-auto max-w-xl text-lg tracking-[0.02em] text-[var(--color-secondary)] md:text-xl">
            Master Japanese vocabulary through focused, continuous immersion.
          </p>
          <div className="flex flex-col items-center justify-center gap-6 pt-8 sm:flex-row">
            <Link href="/game/setup" className={buttonStyles("primary", "w-full px-10 py-5 sm:w-auto !text-white")}>
              Start Game
            </Link>
            <Link href="/shiritori" className={buttonStyles("secondary", "w-full px-10 py-5 sm:w-auto")}>
              Explore Shiritori
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-8 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
            {featureCards.map((feature) => (
              <div key={feature.title} className="flex flex-col items-start gap-6">
                <div className="flex h-16 w-16 items-center justify-center border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-highest)]">
                  <span
                    className="material-symbols-outlined text-3xl text-[var(--color-primary)]"
                    style={{ fontVariationSettings: '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 24' }}
                    aria-hidden="true"
                  >
                    {feature.icon}
                  </span>
                </div>
                <h2 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)]">
                  {feature.title}
                </h2>
                <p className="leading-relaxed text-[var(--color-secondary)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
