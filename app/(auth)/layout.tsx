'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.5,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-[#a3e635] selection:text-black">
      {/* Left Brand Panel (Desktop) */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-16 border-r border-[#27272a] bg-[#09090b] select-none"
      >
        {/* Top: Wordmark */}
        <div>
          <Link href="/" className="inline-block text-xl font-bold tracking-tight text-[#f4f4f5]">
            Report<span className="text-[#a3e635]">Pilot</span>
          </Link>
        </div>

        {/* Middle Content */}
        <div className="max-w-lg space-y-10 my-auto py-8">
          {/* Small Dashboard Visualization */}
          <div className="w-full max-w-[360px] bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[#a1a1aa]">
                Campaign Conversion Velocity
              </span>
              <span className="text-xs font-bold text-[#a3e635] font-mono tabular-nums">
                +28.4%
              </span>
            </div>

            {/* Clean Line Chart Graphic */}
            <div className="h-14 w-full">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 320 56"
                fill="none"
                className="overflow-visible"
              >
                <path
                  d="M4 48 L56 38 L108 42 L160 22 L212 28 L264 12 L316 6"
                  stroke="#a3e635"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {[
                  { cx: 4, cy: 48 },
                  { cx: 56, cy: 38 },
                  { cx: 108, cy: 42 },
                  { cx: 160, cy: 22 },
                  { cx: 212, cy: 28 },
                  { cx: 264, cy: 12 },
                  { cx: 316, cy: 6 },
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r={i === 6 ? 3.5 : 2.5}
                    fill="#a3e635"
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Headline & Supporting Description */}
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-[#f4f4f5] leading-[1.08]">
              One dashboard for every client, always up to date.
            </h1>
            <p className="text-[#a1a1aa] text-base leading-relaxed max-w-[450px]">
              Enter your campaign numbers once. Your team and clients see the results instantly.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3.5 pt-2">
            {[
              'Multi-client management for marketing teams',
              'Automated CPL, ROI, and conversion benchmarks',
              'Dedicated read-only client share links',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <svg
                  className="w-4 h-4 shrink-0 text-[#a3e635]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-medium text-[#f4f4f5]">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex items-center justify-between text-xs text-[#71717a]">
          <p>© {new Date().getFullYear()} ReportPilot. All rights reserved.</p>
          <span className="font-mono">v1.0 Production</span>
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-10 lg:p-12 bg-[#09090b]">
        {children}
      </div>
    </div>
  );
}