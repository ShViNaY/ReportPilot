// components/charts/CampaignChart.tsx
'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { MetricEntry, Campaign } from '@/types';

interface CampaignChartProps {
  metrics: MetricEntry[];
  campaigns: Campaign[];
  title: string;
}

const chartConfig = {
  spend: {
    label: 'Ad Spend ($)',
    color: 'var(--chart-1)',
  },
  leads: {
    label: 'Leads',
    color: 'var(--chart-2)',
  },
  conversions: {
    label: 'Conversions',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export function CampaignChart({
  metrics,
  campaigns,
  title,
}: CampaignChartProps) {
  // Group metrics by campaign
  const campaignData = React.useMemo(() => {
    return campaigns.map((campaign) => {
      const campaignMetrics = metrics.filter((m) => m.campaign_id === campaign.id);
      const totalSpend = campaignMetrics.reduce((sum, m) => sum + m.ad_spend, 0);
      const totalLeads = campaignMetrics.reduce((sum, m) => sum + m.leads, 0);
      const totalConversions = campaignMetrics.reduce(
        (sum, m) => sum + m.conversions,
        0
      );

      return {
        name:
          campaign.name.length > 18
            ? `${campaign.name.substring(0, 16)}…`
            : campaign.name,
        fullName: campaign.name,
        spend: totalSpend,
        leads: totalLeads,
        conversions: totalConversions,
      };
    });
  }, [campaigns, metrics]);

  if (campaignData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-400 text-sm">
        No active campaigns found to graph
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Comparative spend, leads, and conversions by campaign</p>
        </div>
      </div>

      {/* shadcn Chart Container */}
      <ChartContainer config={chartConfig} className="min-h-[320px] w-full aspect-auto">
        <BarChart
          accessibilityLayer
          data={campaignData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-100" />

          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickMargin={8}
            className="text-[11px] font-medium text-slate-500"
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[11px] font-medium text-slate-500"
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
            }
          />

          <ChartTooltip
            content={
              <ChartTooltipContent
                labelKey="fullName"
                nameKey="dataKey"
              />
            }
          />

          <ChartLegend content={<ChartLegendContent />} />

          <Bar
            dataKey="spend"
            fill="var(--color-spend)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
          <Bar
            dataKey="leads"
            fill="var(--color-leads)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
          <Bar
            dataKey="conversions"
            fill="var(--color-conversions)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}