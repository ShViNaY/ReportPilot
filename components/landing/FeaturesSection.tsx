'use client';

import React from 'react';
import {
  IconLayoutGrid,
  IconClients,
  IconBarChart3,
  IconArrowRight,
} from '@/components/common/Icons';

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function FeaturesSection() {
  const features: FeatureItem[] = [
    {
      title: 'Unified Multi-Client Hub',
      description:
        'Consolidate Google Ads, Meta Ads, and custom channels across your entire agency portfolio in one structured view.',
      icon: <IconLayoutGrid className="w-5 h-5 text-emerald-600" />,
    },
    {
      title: 'Instant Client Portals',
      description:
        'Generate secure, tokenized portal links for your clients. No login headaches, zero friction, and always up to date.',
      icon: <IconClients className="w-5 h-5 text-emerald-600" />,
    },
    {
      title: 'Automated KPI Analytics',
      description:
        'CPL, conversion rates, and performance trends calculate instantly on ingestion with customizable date filters.',
      icon: <IconBarChart3 className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <section id="features" className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((item) => (
          <div
            key={item.title}
            className="group bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* Feature Icon Container */}
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
                {item.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Bottom Accent Arrow */}
            <div className="pt-6 flex items-center text-emerald-600">
              <span className="inline-flex items-center justify-center text-emerald-600 group-hover:translate-x-1 transition-transform">
                <IconArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
