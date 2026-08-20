import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const session = await auth();
  const displayName = session?.user?.name ?? "StudentOfMa";
  const email = session?.user?.email ?? "scholar@inkandinterval.com";

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[var(--color-surface)] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16">
          <h1 className="mb-4 font-[family-name:var(--font-headline)] text-5xl font-bold tracking-tight text-[var(--color-primary)]">
            Settings
          </h1>
          <p className="text-lg tracking-[0.02em] text-[var(--color-secondary)]">
            Configure your study environment.
          </p>
        </div>

        <div className="space-y-16">
          <section className="border border-transparent bg-[var(--color-surface-container-low)] p-8 transition-none hover:border-[var(--color-outline)]">
            <h2 className="mb-8 border-b border-[var(--color-outline-variant)] pb-4 font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)]">
              Account Settings
            </h2>
            <form className="space-y-8">
              <div className="flex flex-col">
                <label
                  htmlFor="username"
                  className="mb-1 font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-secondary)]"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  defaultValue={displayName}
                  className="input-underline w-full border-b-2 border-[var(--color-primary)] bg-transparent py-2 text-lg text-[var(--color-primary)] focus:ring-0"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="email"
                  className="mb-1 font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-secondary)]"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  defaultValue={email}
                  className="input-underline w-full border-b-2 border-[var(--color-primary)] bg-transparent py-2 text-lg text-[var(--color-primary)] focus:ring-0"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="secondary" type="button" className="px-6 py-3">
                  Discard
                </Button>
                <Button variant="primary" type="button" className="px-6 py-3">
                  Save Changes
                </Button>
              </div>
            </form>
          </section>

          <section className="border border-transparent bg-[var(--color-surface-container-low)] p-8 transition-none hover:border-[var(--color-outline)]">
            <h2 className="mb-8 border-b border-[var(--color-outline-variant)] pb-4 font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)]">
              Quiz Preferences
            </h2>
            <div className="space-y-8">
              <div className="flex flex-col">
                <label
                  htmlFor="timer"
                  className="mb-1 font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-secondary)]"
                >
                  Default Timer Duration (Seconds)
                </label>
                <select
                  id="timer"
                  defaultValue="30"
                  className="input-underline w-full border-b-2 border-[var(--color-primary)] bg-transparent py-2 text-lg text-[var(--color-primary)] focus:ring-0"
                >
                  <option value="15">15 Seconds (Rapid)</option>
                  <option value="30">30 Seconds (Standard)</option>
                  <option value="60">60 Seconds (Deliberate)</option>
                  <option value="0">Off (Infinite)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="fontSize"
                  className="mb-1 font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-secondary)]"
                >
                  Kanji Display Size
                </label>
                <select
                  id="fontSize"
                  defaultValue="xlarge"
                  className="input-underline w-full border-b-2 border-[var(--color-primary)] bg-transparent py-2 text-lg text-[var(--color-primary)] focus:ring-0"
                >
                  <option value="large">Large (Standard)</option>
                  <option value="xlarge">Extra Large (Immersive)</option>
                  <option value="massive">Massive (Brutalist)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="border border-transparent bg-[var(--color-surface-container-low)] p-8 transition-none hover:border-[var(--color-outline)]">
            <h2 className="mb-8 border-b border-[var(--color-outline-variant)] pb-4 font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)]">
              Display
            </h2>
            <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] py-4">
              <div>
                <h3 className="text-lg font-medium text-[var(--color-primary)]">Dark Mode</h3>
                <p className="text-sm tracking-[0.02em] text-[var(--color-secondary)]">Invert the canvas.</p>
              </div>
              <label className="relative inline-block h-6 w-12 cursor-pointer select-none align-middle">
                <input type="checkbox" className="peer sr-only" />
                <span className="absolute inset-0 border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)] transition-none peer-checked:bg-[var(--color-primary)]" />
                <span className="absolute left-0 top-0 z-10 h-6 w-6 border-2 border-[var(--color-primary)] bg-[var(--color-surface)] transition-none peer-checked:left-6" />
              </label>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
