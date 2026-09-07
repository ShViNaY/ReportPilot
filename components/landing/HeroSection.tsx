'use client';

import React from 'react';
import Link from 'next/link';
import { IconArrowRight, IconZap, IconLock, IconFileText } from '@/components/common/Icons';

export function HeroSection() {
  return (
    <section className="relative pt-12 sm:pt-20 pb-12 sm:pb-16 overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-emerald-100/50 via-teal-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-emerald-50/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Main Hero Column */}
          <div className="max-w-3xl space-y-6 sm:space-y-8">
            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Campaign reporting, <br className="hidden sm:inline" />
              <span className="text-emerald-600">effortlessly streamlined.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
              Stop assembling spreadsheet reports by hand. Enter your campaign numbers once and give your clients real-time, read-only performance dashboards.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold rounded-xl transition-all duration-150 shadow-md shadow-emerald-700/20 active:scale-[0.98]"
              >
                <span>Start Free Agency Trial</span>
                <IconArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 text-base font-medium rounded-xl border border-slate-200/90 shadow-2xs transition-all duration-150 active:scale-[0.98]"
              >
                Agency Login
              </Link>
            </div>

            {/* Value Proposition Row */}
            <div className="pt-6 sm:pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <IconZap className="w-4 h-4" />
                </div>
                <span className="font-medium">Automatic CPL & ROI Calculation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <IconLock className="w-4 h-4" />
                </div>
                <span className="font-medium">Secure Passwordless Client Portals</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <IconFileText className="w-4 h-4" />
                </div>
                <span className="font-medium">One-click CSV Data Exports</span>
              </div>
            </div>
          </div>

          {/* Decorative Floating Graphic (Desktop) matching reference */}
          <div className="hidden lg:block absolute top-4 right-0 w-80 pointer-events-none select-none">
            {/* Tilted background card */}
            <div className="relative transform rotate-3 rounded-2xl bg-white/70 border border-emerald-100/90 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-medium text-emerald-700 font-sans tracking-wide">Client ROI Report</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-emerald-100/80 rounded-full w-3/4" />
                <div className="h-2 bg-slate-100 rounded-full w-1/2" />
              </div>

              {/* Hand-drawn style growth note */}
              <div className="mt-4 flex items-center gap-1.5 text-emerald-700">
                <span className="text-xs font-semibold italic">Turn data into growth</span>
                <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </div>

              {/* Front floating retention badge */}
              <div className="mt-4 bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-md -rotate-2 transform hover:rotate-0 transition-transform">
                <div className="w-full h-1 bg-emerald-100 rounded-full mb-2.5 overflow-hidden">
                  <div className="w-3/4 h-full bg-emerald-500 rounded-full" />
                </div>
                <div className="text-2xl font-black text-emerald-600 tabular-nums">+28%</div>
                <div className="text-xs text-slate-500 font-medium">Higher client retention</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
