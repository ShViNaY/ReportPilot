// app/api/metrics/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';

interface RouteParams { 
    params: Promise<{ id: string }>; 
}

/**
 * Helper function to calculate KPIs
 */
function calculateKPIs(ad_spend: number, leads: number, conversions: number) {
    let cost_per_lead = null;
    let conversion_rate = null;

    if (leads > 0) {
        cost_per_lead = Math.round((ad_spend / leads) * 100) / 100;
    }

    if (leads > 0) {
        conversion_rate = Math.round((conversions / leads) * 100 * 100) / 100;
    }

    return { cost_per_lead, conversion_rate };
}

/**
 * GET /api/metrics/[id]
 * Get a specific metric entry
 * 
 * Data isolation: Verify metric belongs to user's agency
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id } = auth.payload;
        const { id: metricId } = await params;

        // Step 2: Fetch metric
        const { data: metric, error } = await supabaseServer
            .from('metric_entries')
            .select('*')
            .eq('id', metricId)
            .eq('agency_id', agency_id) // DATA ISOLATION
            .single();

        if (error || !metric) {
            return NextResponse.json(
                { success: false, error: 'Metric entry not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, metric },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/metrics/[id] error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/metrics/[id]
 * Update a metric entry and recalculate KPIs
 * 
 * Data isolation: Verify metric belongs to user's agency
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id } = auth.payload;
        const { id: metricId } = await params;

        // Step 2: Parse request
        const body = await request.json();
        const {
            ad_spend,
            impressions,
            clicks,
            leads,
            conversions,
        } = body;

        // Step 3: Validate numbers (if provided)
        if (ad_spend !== undefined && ad_spend < 0) {
            return NextResponse.json(
                { success: false, error: 'Ad spend cannot be negative' },
                { status: 400 }
            );
        }

        if (impressions !== undefined && impressions < 0) {
            return NextResponse.json(
                { success: false, error: 'Impressions cannot be negative' },
                { status: 400 }
            );
        }

        if (clicks !== undefined && clicks < 0) {
            return NextResponse.json(
                { success: false, error: 'Clicks cannot be negative' },
                { status: 400 }
            );
        }

        if (leads !== undefined && leads < 0) {
            return NextResponse.json(
                { success: false, error: 'Leads cannot be negative' },
                { status: 400 }
            );
        }

        if (conversions !== undefined && conversions < 0) {
            return NextResponse.json(
                { success: false, error: 'Conversions cannot be negative' },
                { status: 400 }
            );
        }

        // Step 4: Verify metric exists and belongs to user's agency
        const { data: existingMetric } = await supabaseServer
            .from('metric_entries')
            .select('*')
            .eq('id', metricId)
            .eq('agency_id', agency_id) // DATA ISOLATION
            .single();

        if (!existingMetric) {
            return NextResponse.json(
                { success: false, error: 'Metric entry not found' },
                { status: 404 }
            );
        }

        // Step 5: Prepare update data
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        // Use existing values if not provided
        const newAdSpend = ad_spend !== undefined ? ad_spend : existingMetric.ad_spend;
        const newLeads = leads !== undefined ? leads : existingMetric.leads;
        const newConversions = conversions !== undefined ? conversions : existingMetric.conversions;

        if (ad_spend !== undefined) updateData.ad_spend = ad_spend;
        if (impressions !== undefined) updateData.impressions = impressions;
        if (clicks !== undefined) updateData.clicks = clicks;
        if (leads !== undefined) updateData.leads = leads;
        if (conversions !== undefined) updateData.conversions = conversions;

        // Step 6: Recalculate KPIs based on updated values
        const { cost_per_lead, conversion_rate } = calculateKPIs(
            newAdSpend,
            newLeads,
            newConversions
        );

        updateData.cost_per_lead = cost_per_lead;
        updateData.conversion_rate = conversion_rate;

        // Step 7: Update metric
        const { data: metric, error } = await supabaseServer
            .from('metric_entries')
            .update(updateData)
            .eq('id', metricId)
            .eq('agency_id', agency_id) // DATA ISOLATION: Extra safety
            .select()
            .single();

        if (error) {
            console.error('Update error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update metric entry' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, metric },
            { status: 200 }
        );
    } catch (error) {
        console.error('PUT /api/metrics/[id] error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/metrics/[id]
 * Delete a metric entry
 * 
 * Data isolation: Verify metric belongs to user's agency
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id } = auth.payload;
        const { id: metricId } = await params;

        // Step 2: Verify metric exists and belongs to user's agency
        const { data: existingMetric } = await supabaseServer
            .from('metric_entries')
            .select('id')
            .eq('id', metricId)
            .eq('agency_id', agency_id) // DATA ISOLATION
            .single();

        if (!existingMetric) {
            return NextResponse.json(
                { success: false, error: 'Metric entry not found' },
                { status: 404 }
            );
        }

        // Step 3: Delete metric
        const { error } = await supabaseServer
            .from('metric_entries')
            .delete()
            .eq('id', metricId)
            .eq('agency_id', agency_id); // DATA ISOLATION: Extra safety

        if (error) {
            console.error('Delete error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to delete metric entry' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Metric entry deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('DELETE /api/metrics/[id] error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}