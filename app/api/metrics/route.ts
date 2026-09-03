// app/api/metrics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
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

    // Extract query parameters for date filtering
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const campaignIdParam = url.searchParams.get('campaign_id');

    let query = supabaseServer
      .from('metric_entries')
      .select('*')
      .eq('agency_id', agency_id);

    // Add date filtering
    if (startDateParam) {
      const startDate = startDateParam.split('T')[0];
      query = query.gte('reporting_period', startDate);
    }

    if (endDateParam) {
      const endDate = endDateParam.split('T')[0];
      query = query.lte('reporting_period', endDate);
    }

    // Add campaign filtering if provided
    if (campaignIdParam) {
      query = query.eq('campaign_id', campaignIdParam);
    }

    // Step 2: For account managers, filter by assigned clients
    if (role === 'account_manager') {
      const { data: assignments } = await supabaseServer
        .from('user_client_assignments')
        .select('client_id')
        .eq('user_id', user_id);

      const assignedClientIds = assignments?.map(a => a.client_id) || [];

      if (assignedClientIds.length === 0) {
        return NextResponse.json<GetMetricsResponse>(
          { success: true, metrics: [] },
          { status: 200 }
        );
      }

      query = query.in('client_id', assignedClientIds);
    }

    // Step 3: Fetch metrics
    const { data: metrics, error } = await query.order('reporting_period', {
      ascending: false,
    });

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json<GetMetricsResponse>(
        { success: false, error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json<GetMetricsResponse>(
      { success: true, metrics: metrics || [] },
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

    // Step 2: Parse request
    const body: CreateMetricEntryRequest = await request.json();
    const {
      campaign_id,
      reporting_period,
      ad_spend,
      impressions,
      clicks,
      leads,
      conversions,
    } = body;

    // Step 3: Validate input
    if (!campaign_id || !reporting_period) {
      return NextResponse.json<CreateMetricEntryResponse>(
        { success: false, error: 'Campaign ID and reporting period are required' },
        { status: 400 }
      );
    }

    // Validate numbers (no negatives)
    if (
      ad_spend < 0 ||
      impressions < 0 ||
      clicks < 0 ||
      leads < 0 ||
      conversions < 0
    ) {
      return NextResponse.json<CreateMetricEntryResponse>(
        { success: false, error: 'Metrics cannot be negative' },
        { status: 400 }
      );
    }

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
        .select('id')
        .eq('user_id', user_id)
        .eq('client_id', campaign.client_id)
        .single();

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