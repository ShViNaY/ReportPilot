// components/charts/CampaignChart.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MetricEntry, Campaign } from '@/types';

interface CampaignChartProps {
  metrics: MetricEntry[];
  campaigns: Campaign[];
  title: string;
}

export function CampaignChart({
  metrics,
  campaigns,
  title,
}: CampaignChartProps) {
  // Group metrics by campaign
  const campaignData = campaigns.map(campaign => {
    const campaignMetrics = metrics.filter(m => m.campaign_id === campaign.id);
    const totalSpend = campaignMetrics.reduce((sum, m) => sum + m.ad_spend, 0);
    const totalLeads = campaignMetrics.reduce((sum, m) => sum + m.leads, 0);
    const totalConversions = campaignMetrics.reduce(
      (sum, m) => sum + m.conversions,
      0
    );

    return {
      name: campaign.name.length > 18 ? `${campaign.name.substring(0, 16)}…` : campaign.name,
      fullName: campaign.name,
      spend: totalSpend,
      leads: totalLeads,
      conversions: totalConversions,
    };
  });

  if (campaignData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-400 text-sm">
        No active campaigns found to graph
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Comparative spend, leads, and conversions by campaign</p>
        </div>
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={campaignData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              style={{ fontSize: '11px', fontWeight: 500 }}
              dy={6}
            />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(51, 65, 85, 0.8)',
                borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                color: '#fff',
                fontSize: '12px',
                padding: '10px 14px',
              }}
              labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}
              formatter={(value: any, name: any) => {
                if (typeof value === 'number') {
                  return [value.toLocaleString(), name];
                }
                return [value, name];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            />
            <Bar dataKey="spend" fill="#6366f1" name="Ad Spend ($)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="leads" fill="#10b981" name="Leads" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar
              dataKey="conversions"
              fill="#f59e0b"
              name="Conversions"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}