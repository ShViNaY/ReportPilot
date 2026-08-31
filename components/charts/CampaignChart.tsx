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
      name: campaign.name.substring(0, 15), // Truncate long names
      spend: totalSpend,
      leads: totalLeads,
      conversions: totalConversions,
    };
  });

  if (campaignData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-500">
        No campaigns to display
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={campaignData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: any) => {
              if (typeof value === 'number') {
                return value.toLocaleString();
              }
              return value;
            }}
          />
          <Legend />
          <Bar dataKey="spend" fill="#6366f1" name="Ad Spend ($)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="leads" fill="#10b981" name="Leads" radius={[8, 8, 0, 0]} />
          <Bar
            dataKey="conversions"
            fill="#f59e0b"
            name="Conversions"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}