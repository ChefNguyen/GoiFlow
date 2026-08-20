export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8 text-sm text-[var(--color-ink-soft)]">
      <div className="container-shell flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>GoiFlow starter scaffold for production-minded workflow software.</p>
        <p>Keep product specs in docs, not in the repo root.</p>
      </div>
    </footer>
  );
}
