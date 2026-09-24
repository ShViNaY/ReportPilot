import Link from 'next/link';

export function PublicHeader() {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 transition-all">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-zinc-100 hover:text-white transition-colors"
        >
          Report<span className="text-lime-400">Pilot</span>
        </Link>

        <nav aria-label="Main Navigation" className="hidden sm:flex items-center gap-8 text-sm font-medium">
          <Link
            href="/features"
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-5 text-sm">
          <Link href="/login" className="text-zinc-400 hover:text-zinc-100 transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-sm transition-transform active:scale-95 shadow-xs"
          >
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
}
