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
    color: '#a3e635',
  },
  leads: {
    label: 'Leads',
    color: '#a1a1aa',
  },
  conversions: {
    label: 'Conversions',
    color: '#71717a',
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
      <div className="bg-[#111113] rounded-2xl border border-zinc-800 p-8 text-center text-zinc-500 text-sm">
        No active campaigns found to graph
      </div>
    );
  }

  return (
    <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">{title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Comparative spend, leads, and conversions by campaign</p>
        </div>
      </div>

      {/* shadcn Chart Container */}
      <ChartContainer config={chartConfig} className="h-[320px] w-full">
        <BarChart
          accessibilityLayer
          data={campaignData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-zinc-800/60" />

          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={{ stroke: '#27272a' }}
            tickMargin={8}
            className="text-[11px] font-medium text-zinc-500"
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[11px] font-medium text-zinc-500"
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
            fill="#a3e635"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          />
          <Bar
            dataKey="leads"
            fill="#a1a1aa"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          />
          <Bar
            dataKey="conversions"
            fill="#71717a"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}