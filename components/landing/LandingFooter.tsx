'use client';

import React from 'react';
import Link from 'next/link';
import { IconLogo } from '@/components/common/Icons';

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand and Description */}
        <div className="flex items-center gap-2">
          <IconLogo variant="emerald" className="w-5 h-5 rounded" />
          <Link href="/" className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors">
            ReportPilot
          </Link>
          <span className="text-slate-400">— Agency Campaign Intelligence</span>
        </div>

        {/* Copyright notice */}
        <p className="text-slate-400">
          © {new Date().getFullYear()} ReportPilot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
