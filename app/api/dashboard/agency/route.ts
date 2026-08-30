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
 * - Total clients, campaigns, ad spend
 * - Total leads, conversions
 * - Average CPL and conversion rate
 * - List of all clients (for owner)
 * - Only assigned clients (for account managers)
 * 
 * Data isolation: Only user's agency data
 */
export async function GET(request: NextRequest): Promise<NextResponse<AgencyDashboardResponse>> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id, user_id, role } = auth.payload;

        // Step 2: Get clients (filtered by role)
        let clientsQuery = supabaseServer
            .from('clients')
            .select('id, name, contact_email, created_at')
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
            .select('id, name, contact_email, created_at')
            .eq('agency_id', agency_id)
            .in('id', clientIds);

        if (clientError) {
            console.error('Client fetch error:', clientError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch clients' },
                { status: 500 }
            );
        }

        // Step 4: Count total clients and campaigns
        const { count: totalClients } = await supabaseServer
            .from('clients')
            .select('id', { count: 'exact' })
            .eq('agency_id', agency_id)
            .in('id', clientIds);

        const { count: totalCampaigns } = await supabaseServer
            .from('campaigns')
            .select('id', { count: 'exact' })
            .eq('agency_id', agency_id)
            .in('client_id', clientIds);

        // Step 5: Fetch all metrics for aggregation
        const { data: metrics, error: metricsError } = await supabaseServer
            .from('metric_entries')
            .select('ad_spend, leads, conversions, cost_per_lead, conversion_rate')
            .eq('agency_id', agency_id)
            .in('client_id', clientIds);

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

        // Step 7: Build summary
        const summary: AgencyDashboardSummary = {
            total_clients: totalClients || 0,
            total_campaigns: totalCampaigns || 0,
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