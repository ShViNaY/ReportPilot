// app/api/dashboard/agency/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { AgencyDashboardResponse, AgencyDashboardSummary } from '@/types';

/**
 * GET /api/dashboard/agency
 * Get agency-wide dashboard summary for internal team
 * 
 * Shows:
 * - Active clients, active campaigns, total ad spend
 * - Total leads, conversions
 * - Average CPL and conversion rate
 * - List of all clients (for owner)
 * - Only assigned clients (for account managers)
 * 
 * Data isolation: Only user's agency data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id, user_id, role } = auth.payload;

        // Step 1b: Optional date range filter (matches /api/metrics convention)
        const url = new URL(request.url);
        const startDateParam = url.searchParams.get('startDate');
        const endDateParam = url.searchParams.get('endDate');

        // Step 2: Get clients (filtered by role)
        let clientsQuery = supabaseServer
            .from('clients')
            .select('id, agency_id, name, contact_email, created_at, updated_at')
            .eq('agency_id', agency_id);

        let clientIds: string[] = [];

        if (role === 'account_manager') {
            // Get assigned clients
            const { data: assignments } = await supabaseServer
                .from('user_client_assignments')
                .select('client_id')
                .eq('user_id', user_id);

            const assignedIds = assignments?.map(a => a.client_id) || [];

            if (assignedIds.length === 0) {
                // Manager has no assigned clients
                const emptySummary: AgencyDashboardSummary = {
                    total_clients: 0,
                    total_campaigns: 0,
                    total_ad_spend: 0,
                    total_leads: 0,
                    total_conversions: 0,
                    average_cpl: 0,
                    average_conversion_rate: 0,
                };

                return NextResponse.json(
                    {
                        success: true,
                        summary: emptySummary,
                        clients_overview: [],
                    },
                    { status: 200 }
                );
            }

            clientsQuery = clientsQuery.in('id', assignedIds);
            clientIds = assignedIds;
        } else {
            // Owner sees all clients
            const { data: allClients } = await supabaseServer
                .from('clients')
                .select('id')
                .eq('agency_id', agency_id);

            clientIds = allClients?.map(c => c.id) || [];
        }

        // Step 3: Fetch full client details
        const { data: clients, error: clientError } = await supabaseServer
            .from('clients')
            .select('id, agency_id, name, contact_email, created_at, updated_at')
            .eq('agency_id', agency_id)
            .in('id', clientIds);

        if (clientError) {
            console.error('Client fetch error:', clientError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch clients' },
                { status: 500 }
            );
        }

        // Step 4: Fetch campaigns (needed to determine which are Active)
        const { data: campaignsData, error: campaignsError } = await supabaseServer
            .from('campaigns')
            .select('id, client_id, status')
            .eq('agency_id', agency_id)
            .in('client_id', clientIds);

        if (campaignsError) {
            console.error('Campaigns fetch error:', campaignsError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch campaigns' },
                { status: 500 }
            );
        }

        // Step 5: Fetch metrics for aggregation (filtered by date range if provided)
        let metricsQuery = supabaseServer
            .from('metric_entries')
            .select('campaign_id, ad_spend, leads, conversions, cost_per_lead, conversion_rate')
            .eq('agency_id', agency_id)
            .in('client_id', clientIds);

        if (startDateParam) {
            metricsQuery = metricsQuery.gte('reporting_period', startDateParam.split('T')[0]);
        }

        if (endDateParam) {
            metricsQuery = metricsQuery.lte('reporting_period', endDateParam.split('T')[0]);
        }

        const { data: metrics, error: metricsError } = await metricsQuery;

        if (metricsError) {
            console.error('Metrics fetch error:', metricsError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch metrics' },
                { status: 500 }
            );
        }

        // Step 6: Calculate aggregates
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

                if (metric.cost_per_lead !== null) {
                    cplValues.push(metric.cost_per_lead);
                }
                if (metric.conversion_rate !== null) {
                    conversionRateValues.push(metric.conversion_rate);
                }
            });
        }

        // Calculate averages
        const averageCpl = cplValues.length > 0
            ? Math.round((cplValues.reduce((a, b) => a + b, 0) / cplValues.length) * 100) / 100
            : 0;

        const averageConversionRate = conversionRateValues.length > 0
            ? Math.round((conversionRateValues.reduce((a, b) => a + b, 0) / conversionRateValues.length) * 100) / 100
            : 0;

        // Step 6b: Determine Active Clients / Active Campaigns
        // An "active campaign" has status 'active' AND (when a date range is set)
        // has at least one metric entry within that range.
        const isDateRangeApplied = Boolean(startDateParam || endDateParam);
        const metricCampaignIds = new Set((metrics || []).map((m) => m.campaign_id));

        const activeStatusCampaigns = (campaignsData || []).filter(
            (c) => c.status === 'active'
        );

        const activeCampaigns = isDateRangeApplied
            ? activeStatusCampaigns.filter((c) => metricCampaignIds.has(c.id))
            : activeStatusCampaigns;

        const activeClientIds = new Set(activeCampaigns.map((c) => c.client_id));

        // Step 7: Build summary
        const summary: AgencyDashboardSummary = {
            total_clients: activeClientIds.size,
            total_campaigns: activeCampaigns.length,
            total_ad_spend: Math.round(totalAdSpend * 100) / 100,
            total_leads: totalLeads,
            total_conversions: totalConversions,
            average_cpl: averageCpl,
            average_conversion_rate: averageConversionRate,
        };

        const response: AgencyDashboardResponse = {
            success: true,
            summary,
            clients_overview: clients || [],
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error('GET /api/dashboard/agency error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}