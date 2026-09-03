// app/api/dashboard/client/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer } from '@/lib/supabase/server';
import { ClientDashboardResponse, ClientDashboardSummary } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const portalToken = searchParams.get('token')?.trim();

    if (!portalToken) {
      return NextResponse.json(
        { success: false, error: 'Portal token is required' },
        { status: 400 }
      );
    }

    // Look up the token by its hash, never by the raw value — this is the
    // credential a client presents on every request, so it should be
    // verified the same way a password would be.
    const tokenHash = crypto
      .createHash('sha256')
      .update(portalToken)
      .digest('hex');

    const { data: accessToken, error: accessTokenError } = await supabaseServer
      .from('client_access_tokens')
      .select('client_id, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (accessTokenError || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired portal token' },
        { status: 401 }
      );
    }

    // Honor expiration now that it's actually being checked
    if (accessToken.expires_at && new Date(accessToken.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired portal token' },
        { status: 401 }
      );
    }

    const { data: client, error: clientError } = await supabaseServer
      .from('clients')
      .select('id, name, agency_id')
      .eq('id', accessToken.client_id)
      .single();

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

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let metricsQuery = supabaseServer
      .from('metric_entries')
      .select('*')
      .eq('client_id', clientId);

    if (startDateParam) {
      metricsQuery = metricsQuery.gte('reporting_period', startDateParam.split('T')[0]);
    }
    if (endDateParam) {
      metricsQuery = metricsQuery.lte('reporting_period', endDateParam.split('T')[0]);
    }

    const { data: metrics, error: metricsError } = await metricsQuery.order(
      'reporting_period',
      { ascending: false }
    );

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

    // Summary above uses the full filtered set; the table only needs the
    // most recent 12 within that range (metrics is already sorted desc).
    const recentMetrics = (metrics || []).slice(0, 12);

    const response: ClientDashboardResponse = {
      success: true,
      summary,
      campaigns: campaigns || [],
      recent_metrics: recentMetrics,
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