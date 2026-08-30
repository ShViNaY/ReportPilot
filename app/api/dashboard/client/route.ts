// app/api/dashboard/client/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { ClientDashboardResponse, ClientDashboardSummary } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const portalToken = searchParams.get('token')?.trim();

    console.log('Received portal token:', portalToken); // DEBUG

    if (!portalToken) {
      return NextResponse.json(
        { success: false, error: 'Portal token is required' },
        { status: 400 }
      );
    }

    const { data: client, error: clientError } = await supabaseServer
      .from('clients')
      .select('id, name, agency_id')
      .eq('portal_token', portalToken)
      .single();

    console.log('Client lookup result:', { client, clientError }); // DEBUG

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired portal token' },
        { status: 401 }
      );
    }

    const clientId = client.id;

    const { data: campaigns, error: campaignError } = await supabaseServer
      .from('campaigns')
      .select('*')
      .eq('client_id', clientId)
      .eq('agency_id', client.agency_id);

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    const { data: metrics, error: metricsError } = await supabaseServer
      .from('metric_entries')
      .select('*')
      .eq('client_id', clientId)
      .order('reporting_period', { ascending: false })
      .limit(12);

    if (metricsError) {
      console.error('Metrics fetch error:', metricsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    let totalAdSpend = 0;
    let totalLeads = 0;
    let totalConversions = 0;
    let cplValues: number[] = [];
    let conversionRateValues: number[] = [];

    if (metrics && metrics.length > 0) {
      metrics.forEach(metric => {
        totalAdSpend += metric.ad_spend || 0;
        totalLeads += metric.leads || 0;
        totalConversions += metric.conversions || 0;
        if (metric.cost_per_lead !== null) cplValues.push(metric.cost_per_lead);
        if (metric.conversion_rate !== null) conversionRateValues.push(metric.conversion_rate);
      });
    }

    const averageCpl = cplValues.length > 0
      ? Math.round((cplValues.reduce((a, b) => a + b, 0) / cplValues.length) * 100) / 100
      : 0;

    const averageConversionRate = conversionRateValues.length > 0
      ? Math.round((conversionRateValues.reduce((a, b) => a + b, 0) / conversionRateValues.length) * 100) / 100
      : 0;

    const summary: ClientDashboardSummary = {
      client_name: client.name,
      total_campaigns: campaigns?.length || 0,
      total_ad_spend: Math.round(totalAdSpend * 100) / 100,
      total_leads: totalLeads,
      total_conversions: totalConversions,
      average_cpl: averageCpl,
      average_conversion_rate: averageConversionRate,
    };

    const response: ClientDashboardResponse = {
      success: true,
      summary,
      campaigns: campaigns || [],
      recent_metrics: metrics || [],
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET /api/dashboard/client error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}