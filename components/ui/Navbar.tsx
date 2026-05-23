// Top navigation bar — present on every page via the root layout.
// Shows the ShotlineAI brand and a subtle mock-mode indicator badge
// when NEXT_PUBLIC_MOCK_MODE=true, so demo audiences know the data is simulated.

import Link from "next/link";

export default function Navbar() {
  const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

  return (
    <nav className="h-14 border-b border-[var(--border)] bg-[var(--surface)] flex items-center px-6 gap-4">
      <Link href="/upload" className="flex items-center gap-2 group">
        <span className="text-[var(--accent)] text-xl">✦</span>
        <span className="font-bold text-white tracking-tight text-lg">
          Shotline<span className="text-[var(--accent)]">AI</span>
        </span>
      </Link>

      {isMock && (
        <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/30">
          DEMO MODE
        </span>
      )}

      <div className="ml-auto flex items-center gap-4">
        <Link
          href="/upload"
          className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          New Session
        </Link>
      </div>
    </nav>
  );
}
