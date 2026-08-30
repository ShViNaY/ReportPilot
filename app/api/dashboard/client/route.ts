// app/api/dashboard/client/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { ClientDashboardResponse, ClientDashboardSummary } from '@/types';

/**
 * GET /api/dashboard/client
 * Get client portal dashboard (read-only view)
 * 
 * Query param: ?token=portal_token_here
 * 
 * Shows:
 * - Client name
 * - Their campaigns and metrics
 * - Their KPIs
 * - Recent metric entries
 * 
 * NO authentication required - uses portal token
 * Data isolation: Only this client's data, nothing else
 */
export async function GET(request: NextRequest): Promise<NextResponse<ClientDashboardResponse>> {
    try {
        // Step 1: Extract portal token from query params
        const { searchParams } = new URL(request.url);
        const portalToken = searchParams.get('token');

        if (!portalToken) {
            return NextResponse.json(
                { success: false, error: 'Portal token is required' },
                { status: 400 }
            );
        }

        // Step 2: Verify portal token and get client
        const { data: tokenRecord, error: tokenError } = await supabaseServer
            .from('client_access_tokens')
            .select('client_id, expires_at')
            .eq('token_hash', hashToken(portalToken))
            .single();

        if (tokenError || !tokenRecord) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired portal token' },
                { status: 401 }
            );
        }

        // Check if token is expired
        if (tokenRecord.expires_at) {
            const expiresAt = new Date(tokenRecord.expires_at);
            if (expiresAt < new Date()) {
                return NextResponse.json(
                    { success: false, error: 'Portal token has expired' },
                    { status: 401 }
                );
            }
        }

        const clientId = tokenRecord.client_id;

        // Step 3: Fetch client details
        const { data: client, error: clientError } = await supabaseServer
            .from('clients')
            .select('id, name, agency_id')
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        // Step 4: Fetch campaigns for this client ONLY
        const { data: campaigns, error: campaignError } = await supabaseServer
            .from('campaigns')
            .select('id, name, platform, status, created_at')
            .eq('client_id', clientId)
            .eq('agency_id', client.agency_id);

        if (campaignError) {
            console.error('Campaign fetch error:', campaignError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch campaigns' },
                { status: 500 }
            );
        }

        // Step 5: Fetch metrics for this client ONLY
        const { data: metrics, error: metricsError } = await supabaseServer
            .from('metric_entries')
            .select('*')
            .eq('client_id', clientId)
            .order('reporting_period', { ascending: false })
            .limit(12); // Last 12 entries (e.g., last 12 months)

        if (metricsError) {
            console.error('Metrics fetch error:', metricsError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch metrics' },
                { status: 500 }
            );
        }

        // Step 6: Calculate client summary
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

        const averageCpl = cplValues.length > 0
            ? Math.round((cplValues.reduce((a, b) => a + b, 0) / cplValues.length) * 100) / 100
            : 0;

        const averageConversionRate = conversionRateValues.length > 0
            ? Math.round((conversionRateValues.reduce((a, b) => a + b, 0) / conversionRateValues.length) * 100) / 100
            : 0;

        // Step 7: Build response
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

/**
 * Helper function: Hash portal token
 * Matches how tokens are hashed in database
 */
function hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
}