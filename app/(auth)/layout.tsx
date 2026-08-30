// app/(auth)/layout.tsx

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 px-12 py-10 text-white">
        <div className="text-lg font-semibold tracking-tight">
          ReportPilot
        </div>

        <div className="max-w-sm space-y-6">
          <TrendGraphic />
          <h1 className="text-3xl font-semibold leading-snug tracking-tight">
            One dashboard for every client, always up to date.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Enter your campaign numbers once. Your team and your clients see
            the results instantly — no more building reports by hand.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} ReportPilot
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

function TrendGraphic() {
  return (
    <svg
      width="180"
      height="64"
      viewBox="0 0 180 64"
      fill="none"
      className="text-indigo-400"
    >
      <path
        d="M2 50 L34 38 L62 44 L94 20 L126 26 L150 8 L178 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[2, 34, 62, 94, 126, 150, 178].map((cx, i) => (
        <circle
          key={i}
          cx={cx}
          cy={[50, 38, 44, 20, 26, 8, 14][i]}
          r="3"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}