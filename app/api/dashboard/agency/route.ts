// app/api/dashboard/agency/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { validateDateRange } from '@/lib/utils/validation';
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

        const dateValidation = validateDateRange(startDateParam, endDateParam);
        if (!dateValidation.success) {
            return NextResponse.json(
                { success: false, error: dateValidation.error },
                { status: 400 }
            );
        }
        const { startDate, endDate } = dateValidation.data;

        const emptySummary: AgencyDashboardSummary = {
            total_clients: 0,
            total_campaigns: 0,
            total_ad_spend: 0,
            total_leads: 0,
            total_conversions: 0,
            average_cpl: 0,
            average_conversion_rate: 0,
        };

        // Step 2: Determine client scope (all for owner, assigned for account_manager)
        let assignedIds: string[] | null = null;
        if (role === 'account_manager') {
            const { data: assignments } = await supabaseServer
                .from('user_client_assignments')
                .select('client_id')
                .eq('user_id', user_id);

            assignedIds = assignments?.map((a) => a.client_id) || [];

            if (assignedIds.length === 0) {
                // Manager has no assigned clients
                return NextResponse.json(
                    {
                        success: true,
                        summary: emptySummary,
                        clients_overview: [],
                    },
                    { status: 200 }
                );
            }
        }

        // Step 3: Build concurrent queries for clients, campaigns, and metrics
        let clientsQuery = supabaseServer
            .from('clients')
            .select('id, agency_id, name, contact_email, created_at, updated_at')
            .eq('agency_id', agency_id);

        let campaignsQuery = supabaseServer
            .from('campaigns')
            .select('id, client_id, status')
            .eq('agency_id', agency_id);

        let metricsQuery = supabaseServer
            .from('metric_entries')
            .select('campaign_id, client_id, ad_spend, leads, conversions, cost_per_lead, conversion_rate')
            .eq('agency_id', agency_id);

        if (assignedIds !== null) {
            clientsQuery = clientsQuery.in('id', assignedIds);
            campaignsQuery = campaignsQuery.in('client_id', assignedIds);
            metricsQuery = metricsQuery.in('client_id', assignedIds);
        }

        if (startDate) {
            metricsQuery = metricsQuery.gte('reporting_period', startDate);
        }

        if (endDate) {
            metricsQuery = metricsQuery.lte('reporting_period', endDate);
        }

        // Step 4: Execute all queries concurrently
        const [clientsRes, campaignsRes, metricsRes] = await Promise.all([
            clientsQuery,
            campaignsQuery,
            metricsQuery,
        ]);

        if (clientsRes.error) {
            console.error('Client fetch error:', clientsRes.error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch clients' },
                { status: 500 }
            );
        }

        if (campaignsRes.error) {
            console.error('Campaigns fetch error:', campaignsRes.error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch campaigns' },
                { status: 500 }
            );
        }

        if (metricsRes.error) {
            console.error('Metrics fetch error:', metricsRes.error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch metrics' },
                { status: 500 }
            );
        }

        const clients = clientsRes.data || [];
        const campaignsData = campaignsRes.data || [];
        const rawMetrics = metricsRes.data || [];

        if (clients.length === 0) {
            return NextResponse.json(
                {
                    success: true,
                    summary: emptySummary,
                    clients_overview: [],
                },
                { status: 200 }
            );
        }

        // Step 5: Filter metrics to existing campaigns
        const validCampaignIds = new Set(campaignsData.map((c) => c.id));
        const metrics = rawMetrics.filter((m) => validCampaignIds.has(m.campaign_id));

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
        // Active campaigns are those with status 'active'.
        // Active clients are clients that have at least one active campaign.
        const activeCampaigns = (campaignsData || []).filter(
            (c) => c.status === 'active'
        );

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