import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-900 py-12 px-6 bg-zinc-950">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
        <Link
          href="/"
          className="font-bold tracking-tight text-zinc-100 hover:text-white transition-colors"
        >
          Report<span className="text-lime-400">Pilot</span>
        </Link>
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/features" className="hover:text-zinc-300 transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-zinc-300 transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-zinc-300 transition-colors">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">
            Terms
          </Link>
        </div>
        <p>© {new Date().getFullYear()} ReportPilot. All rights reserved.</p>
      </div>
    </footer>
  );
}
