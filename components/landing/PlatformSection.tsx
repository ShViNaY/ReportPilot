'use client';

import React from 'react';

export function PlatformSection() {
  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      {/* Subtle Platform Heading */}
      <h4 className="text-xs font-semibold text-slate-400 tracking-widest uppercase mb-8">
        TRUSTED BY GROWING AGENCIES
      </h4>

      {/* Brand Logos Row */}
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-slate-400">
        {/* Google Ads */}
        <div className="flex items-center gap-2 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-opacity">
          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z" />
          </svg>
          <span className="font-semibold text-slate-700 text-sm tracking-tight">Google Ads</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-opacity">
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.99 7.03c-1.84 0-3.32 1.05-4.99 3.01C10.33 8.08 8.85 7.03 7.01 7.03 3.65 7.03 1 9.87 1 13.5c0 4.09 3.2 7.47 7.01 7.47 2.11 0 3.73-.97 4.99-2.58 1.26 1.61 2.88 2.58 4.99 2.58 3.81 0 7.01-3.38 7.01-7.47 0-3.63-2.65-6.47-6.01-6.47zm0 11.97c-2.45 0-4.49-2.34-4.49-5.5s2.04-5.5 4.49-5.5c2.25 0 4.01 1.95 4.01 4.5s-1.76 4.5-4.01 4.5zm-9.98 0c-2.25 0-4.01-1.95-4.01-4.5s1.76-4.5 4.01-4.5c2.45 0 4.49 2.34 4.49 5.5s-2.04 5.5-4.49 5.5z" />
          </svg>
          <span className="font-semibold text-slate-700 text-sm tracking-tight">Meta</span>
        </div>

        {/* LinkedIn */}
        <div className="flex items-center gap-1.5 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-opacity">
          <svg className="w-4 h-4 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.97 0 1.75-.79 1.75-1.76a1.76 1.76 0 0 0-1.75-1.76c-.97 0-1.76.79-1.76 1.76 0 .97.79 1.76 1.76 1.76m1.39 9.74v-8.37H5.07v8.37h2.78z" />
          </svg>
          <span className="font-semibold text-slate-700 text-sm tracking-tight">LinkedIn</span>
        </div>

        {/* Stripe */}
        <div className="flex items-center gap-1.5 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-opacity">
          <span className="font-black text-slate-800 text-base tracking-tighter lowercase">stripe</span>
        </div>

        {/* Shopify */}
        <div className="flex items-center gap-2 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-opacity">
          <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.8 6.5c-.1-.3-.3-.4-.5-.4h-1.6c-.3-1.8-1.5-3.3-3.4-3.3s-3.1 1.5-3.4 3.3H8.3c-.2 0-.4.1-.5.4L6 18.2c-.1.3.1.6.4.7l10.9 2.2c.1 0 .2 0 .2-.1.1 0 .1-.1.2-.2L20 7.2l-1.2-.7zm-5.5-2.2c1 0 1.8.9 2 2.2h-4c.2-1.3 1-2.2 2-2.2z" />
          </svg>
          <span className="font-semibold text-slate-700 text-sm tracking-tight">shopify</span>
        </div>
      </div>
    </section>
  );
}
