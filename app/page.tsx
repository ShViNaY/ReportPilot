'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useReducedMotion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const chartData = [
  { name: 'Mon', spend: 2100 },
  { name: 'Tue', spend: 3400 },
  { name: 'Wed', spend: 2800 },
  { name: 'Thu', spend: 4600 },
  { name: 'Fri', spend: 4100 },
  { name: 'Sat', spend: 5800 },
  { name: 'Sun', spend: 6400 },
];

export default function HomePage() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [showBackToTop, setShowBackToTop] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    setMounted(true);
    setScrolled(scrollY.get() > 80);
    setShowBackToTop(scrollY.get() > 350);
    return scrollY.on('change', (latest) => {
      setScrolled(latest > 80);
      setShowBackToTop(latest > 350);
    });
  }, [scrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: (custom: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.3 : 0.6,
        delay: custom * 0.15,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400 selection:text-black">
      {/* Nav */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
            }}
            className="text-xl font-bold tracking-tight text-zinc-100 cursor-pointer"
          >
            Report<span className="text-lime-400">Pilot</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/login" className="text-zinc-400 hover:text-zinc-100 transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-sm transition-transform active:scale-95"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 space-y-32 sm:space-y-40">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-12 sm:pt-20 text-center flex flex-col items-center">
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-zinc-100 leading-[1.05]"
          >
            Client reports, <br />
            without the <span className="text-lime-400">deck</span>.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="mt-6 text-lg sm:text-xl text-zinc-500 max-w-xl"
          >
            One dashboard. Every client's numbers, live.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="mt-10 flex flex-col items-center gap-3"
          >
            <Link
              href="/signup"
              className="px-8 py-4 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-base transition-transform active:scale-95"
            >
              Start Free
            </Link>
            <span className="text-xs text-zinc-500">Free to start. No card needed.</span>
          </motion.div>
        </section>

        {/* Three Features */}
        <section className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              'Spend, leads, and conversions — one dashboard.',
              'Each client gets their own live link.',
              'Owners, managers, clients — everyone sees only their own data.',
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                custom={i * 0.2}
                variants={fadeUp}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-lime-400/40 hover:-translate-y-1 transition-all duration-300"
              >
                <p className="text-base text-zinc-100 leading-relaxed font-medium">{feature}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Product Preview */}
        <section className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, ease: [0.21, 0.47, 0.32, 0.98] as const }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Browser chrome */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-zinc-800 inline-block" />
                <span className="w-3 h-3 rounded-full bg-zinc-800 inline-block" />
                <span className="w-3 h-3 rounded-full bg-zinc-800 inline-block" />
                <span className="ml-3 text-xs font-mono text-zinc-500">app.reportpilot.com/overview</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">Live</span>
            </div>

            {/* Dashboard content */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Active Clients', value: '18' },
                  { label: 'Total Spend', value: '$42,850' },
                  { label: 'Total Leads', value: '1,420' },
                  { label: 'Avg. CPL', value: '$30.18' },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-5">
                    <div className="text-xs text-zinc-500 font-medium">{stat.label}</div>
                    <div className="text-2xl font-bold tracking-tight text-zinc-100 mt-2 font-mono">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-6">
                <div className="text-xs text-zinc-500 font-medium mb-4">Ad Spend Trajectory</div>
                <div className="h-64 w-full min-h-[256px]">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={200}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a3e635" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          stroke="#71717a"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#71717a"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#09090b',
                            borderColor: '#27272a',
                            borderRadius: '8px',
                            color: '#f4f4f5',
                            fontSize: '12px',
                          }}
                          labelStyle={{ color: '#a1a1aa' }}
                          itemStyle={{ color: '#a3e635' }}
                          formatter={(value: any) => [`$${value}`, 'Spend']}
                        />
                        <Area
                          type="monotone"
                          dataKey="spend"
                          stroke="#a3e635"
                          strokeWidth={2.5}
                          fill="url(#limeGradient)"
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-60 w-full animate-pulse bg-zinc-900/40 rounded-lg" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="w-full bg-zinc-900 border-y border-zinc-800 py-24 px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp}
            className="max-w-xl mx-auto flex flex-col items-center gap-6"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100">Start Free.</h2>
            <Link
              href="/signup"
              className="px-8 py-4 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-base transition-transform active:scale-95"
            >
              Start Free
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
            }}
            className="font-bold tracking-tight text-zinc-100 cursor-pointer"
          >
            Report<span className="text-lime-400">Pilot</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">
              Contact
            </Link>
          </div>
          <p>© {new Date().getFullYear()} ReportPilot. All rights reserved.</p>
        </div>
      </footer>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-lime-400/50 text-zinc-400 hover:text-lime-400 shadow-xl shadow-black/80 backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-lime-400/40 cursor-pointer group"
          >
            <svg
              className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}