// Top navigation bar.
// Minimal — brand mark on the left, DEMO badge when mock mode is active,
// "New Session" link on the right. Height locked at 56px.

import Link from "next/link";

export default function Navbar() {
  const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

  return (
    <nav className="h-14 border-b border-edge bg-canvas flex items-center px-6 gap-3">
      {/* Brand */}
      <Link href="/upload" className="flex items-center gap-2 shrink-0">
        <span className="text-accent font-bold text-[18px] leading-none">✦</span>
        <span className="font-bold text-hi tracking-[-0.03em] text-[17px]">
          Shotline<span className="text-accent">AI</span>
        </span>
      </Link>

      {/* Mock mode indicator */}
      {isMock && (
        <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-semibold uppercase tracking-[0.1em] border border-accent/20">
          Demo
        </span>
      )}

      <div className="ml-auto">
        <Link
          href="/upload"
          className="text-[13px] text-mid hover:text-hi transition-colors duration-150 ease-out"
        >
          New Session
        </Link>
      </div>
    </nav>
  );
}
