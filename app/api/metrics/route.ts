// app/api/metrics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { validateRouteId, validateDateRange, validateCreateMetricInput } from '@/lib/utils/validation';
import { CreateMetricEntryRequest, CreateMetricEntryResponse, GetMetricsResponse } from '@/types';

/**
 * Helper function to calculate KPIs
 */
function calculateKPIs(ad_spend: number, leads: number, conversions: number) {
  let cost_per_lead = null;
  let conversion_rate = null;

  // Cost Per Lead = ad_spend / leads
  if (leads > 0) {
    cost_per_lead = Math.round((ad_spend / leads) * 100) / 100;
  }

  // Conversion Rate = (conversions / leads) * 100
  if (leads > 0) {
    conversion_rate = Math.round((conversions / leads) * 100 * 100) / 100;
  }

  return { cost_per_lead, conversion_rate };
}

/**
 * GET /api/metrics
 * Get metrics with optional filters
 * Query params: ?campaign_id=xxx&startDate=xxx&endDate=xxx
 * 
 * Data isolation: Only metrics from user's agency
 */
export async function GET(request: NextRequest): Promise<NextResponse<GetMetricsResponse>> {
  try {
    // Step 1: Authenticate user
    const auth = await protectedRoute(request);
    if (!auth.success) {
    return NextResponse.json<GetMetricsResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
    );
    }

    const { agency_id, user_id, role } = auth.payload;

    // Extract query parameters for filtering
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const campaignIdParam = url.searchParams.get('campaign_id');
    const clientIdParam = url.searchParams.get('client_id');

    // Validate date range parameters
    const dateValidation = validateDateRange(startDateParam, endDateParam);
    if (!dateValidation.success) {
      return NextResponse.json<GetMetricsResponse>(
        { success: false, error: dateValidation.error },
        { status: 400 }
      );
    }
    const { startDate, endDate } = dateValidation.data;

    // Validate campaign ID filter if provided
    if (campaignIdParam) {
      const campValidation = validateRouteId(campaignIdParam, 'Campaign ID');
      if (!campValidation.success) {
        return NextResponse.json<GetMetricsResponse>(
          { success: false, error: campValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate client ID filter if provided
    if (clientIdParam) {
      const clientValidation = validateRouteId(clientIdParam, 'Client ID');
      if (!clientValidation.success) {
        return NextResponse.json<GetMetricsResponse>(
          { success: false, error: clientValidation.error },
          { status: 400 }
        );
      }
    }

    // Step 2: Determine client scope for account manager if applicable
    let allowedClientIds: string[] | null = null;
    if (role === 'account_manager') {
      const { data: assignments } = await supabaseServer
        .from('user_client_assignments')
        .select('client_id')
        .eq('user_id', user_id);

      allowedClientIds = assignments?.map((a) => a.client_id) || [];

      if (allowedClientIds.length === 0) {
        return NextResponse.json<GetMetricsResponse>(
          { success: true, metrics: [] },
          { status: 200 }
        );
      }

      if (clientIdParam && !allowedClientIds.includes(clientIdParam)) {
        return NextResponse.json<GetMetricsResponse>(
          { success: true, metrics: [] },
          { status: 200 }
        );
      }
    }

    // Step 3: Build concurrent queries for valid campaigns and metric entries
    let campaignsQuery = supabaseServer
      .from('campaigns')
      .select('id, client_id')
      .eq('agency_id', agency_id);

    let metricsQuery = supabaseServer
      .from('metric_entries')
      .select('id, campaign_id, client_id, agency_id, reporting_period, ad_spend, impressions, clicks, leads, conversions, cost_per_lead, conversion_rate, created_at, updated_at')
      .eq('agency_id', agency_id);

    if (allowedClientIds !== null) {
      campaignsQuery = campaignsQuery.in('client_id', allowedClientIds);
      metricsQuery = metricsQuery.in('client_id', allowedClientIds);
    }

    if (clientIdParam) {
      campaignsQuery = campaignsQuery.eq('client_id', clientIdParam);
      metricsQuery = metricsQuery.eq('client_id', clientIdParam);
    }

    if (campaignIdParam) {
      campaignsQuery = campaignsQuery.eq('id', campaignIdParam);
      metricsQuery = metricsQuery.eq('campaign_id', campaignIdParam);
    }

    if (startDate) {
      metricsQuery = metricsQuery.gte('reporting_period', startDate);
    }

    if (endDate) {
      metricsQuery = metricsQuery.lte('reporting_period', endDate);
    }

    metricsQuery = metricsQuery.order('reporting_period', { ascending: false });

    // Step 4: Execute campaigns and metrics queries concurrently
    const [campResult, metricsResult] = await Promise.all([
      campaignsQuery,
      metricsQuery,
    ]);

    if (campResult.error) {
      console.error('Error fetching valid campaigns for metrics:', campResult.error);
      return NextResponse.json<GetMetricsResponse>(
        { success: false, error: 'Failed to verify active campaigns' },
        { status: 500 }
      );
    }

    if (metricsResult.error) {
      console.error('Query error:', metricsResult.error);
      return NextResponse.json<GetMetricsResponse>(
        { success: false, error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    const validCampaignIds = new Set((campResult.data || []).map((c) => c.id));
    if (validCampaignIds.size === 0) {
      return NextResponse.json<GetMetricsResponse>(
        { success: true, metrics: [] },
        { status: 200 }
      );
    }

    const metrics = (metricsResult.data || []).filter((m) => validCampaignIds.has(m.campaign_id));

    return NextResponse.json<GetMetricsResponse>(
      { success: true, metrics },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/metrics error:', error);
    return NextResponse.json<GetMetricsResponse>(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metrics
 * Create a new metric entry and calculate KPIs automatically
 * 
 * Data isolation: Campaign must belong to user's agency
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateMetricEntryResponse>> {
  try {
    // Step 1: Authenticate user
    const auth = await protectedRoute(request);
        if (!auth.success) {
        return NextResponse.json<CreateMetricEntryResponse>(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const { agency_id, user_id, role } = auth.payload;

    // Step 2: Parse and validate request
    const body = await request.json().catch(() => null);
    const validation = validateCreateMetricInput(body);
    if (!validation.success) {
      return NextResponse.json<CreateMetricEntryResponse>(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    const {
      campaign_id,
      reporting_period,
      ad_spend,
      impressions,
      clicks,
      leads,
      conversions,
    } = validation.data;

    // Step 4: Verify campaign exists and belongs to user's agency
    const { data: campaign } = await supabaseServer
      .from('campaigns')
      .select('id, client_id, agency_id')
      .eq('id', campaign_id)
      .eq('agency_id', agency_id)
      .single();

    if (!campaign) {
      return NextResponse.json<CreateMetricEntryResponse>(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Step 5: For account managers, verify they're assigned to this client
    if (role === 'account_manager') {
      const { data: assignment } = await supabaseServer
        .from('user_client_assignments')
        .select('client_id')
        .eq('user_id', user_id)
        .eq('client_id', campaign.client_id)
        .maybeSingle();

      if (!assignment) {
        return NextResponse.json<CreateMetricEntryResponse>(
          { success: false, error: 'You are not assigned to this client' },
          { status: 403 }
        );
      }
    }

    // Prevent duplicate entries for the same campaign + reporting period
    const { data: existingEntry } = await supabaseServer
      .from('metric_entries')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('reporting_period', reporting_period)
      .single();

    if (existingEntry) {
      return NextResponse.json<CreateMetricEntryResponse>(
        {
          success: false,
          error: 'A metric entry already exists for this campaign and reporting period. Edit it instead of creating a new one.',
        },
        { status: 409 }
      );
    }

    // Step 6: Calculate KPIs
    const { cost_per_lead, conversion_rate } = calculateKPIs(
      ad_spend,
      leads,
      conversions
    );

    // Step 7: Create metric entry
    const { data: entry, error } = await supabaseServer
      .from('metric_entries')
      .insert([
        {
          campaign_id,
          client_id: campaign.client_id,
          agency_id,
          reporting_period,
          ad_spend,
          impressions,
          clicks,
          leads,
          conversions,
          cost_per_lead,
          conversion_rate,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json<CreateMetricEntryResponse>(
        { success: false, error: 'Failed to create metric entry' },
        { status: 500 }
      );
    }

    return NextResponse.json<CreateMetricEntryResponse>(
      { success: true, entry },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/metrics error:', error);
    return NextResponse.json<CreateMetricEntryResponse>(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}