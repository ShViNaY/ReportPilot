// app/api/campaigns/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { CreateCampaignRequest, CreateCampaignResponse, GetCampaignsResponse } from '@/types';

/**
 * GET /api/campaigns
 * Get all campaigns for the authenticated user's agency
 * 
 * Data isolation: Only campaigns in their agency
 * For account managers: Only campaigns for assigned clients
 */
export async function GET(request: NextRequest): Promise<NextResponse<GetCampaignsResponse>> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id, user_id, role } = auth.payload;

        let query = supabaseServer
            .from('campaigns')
            .select('*')
            .eq('agency_id', agency_id); // DATA ISOLATION: User's agency only

        // Step 2: If account manager, filter by assigned clients
        if (role === 'account_manager') {
            // Get client IDs assigned to this user
            const { data: assignments } = await supabaseServer
                .from('user_client_assignments')
                .select('client_id')
                .eq('user_id', user_id);

            const assignedClientIds = assignments?.map(a => a.client_id) || [];

            if (assignedClientIds.length === 0) {
                // Manager has no assigned clients
                return NextResponse.json(
                    { success: true, campaigns: [] },
                    { status: 200 }
                );
            }

            // Query campaigns only for assigned clients
            query = query.in('client_id', assignedClientIds);
        }

        // Step 3: Fetch campaigns
        const { data: campaigns, error } = await query.order('created_at', {
            ascending: false,
        });

        if (error) {
            console.error('Query error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch campaigns' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, campaigns: campaigns || [] },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/campaigns error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/campaigns
 * Create a new campaign for a client
 * 
 * Data isolation: Campaign automatically tied to user's agency
 * Validation: Client must belong to user's agency
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateCampaignResponse>> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id, user_id, role } = auth.payload;

        // Step 2: Parse request
        const body: CreateCampaignRequest = await request.json();
        const { client_id, name, platform } = body;

        // Step 3: Validate input
        if (!client_id || !name || !name.trim() || !platform || !platform.trim()) {
            return NextResponse.json(
                { success: false, error: 'Client ID, campaign name, and platform are required' },
                { status: 400 }
            );
        }

        // Step 4: Verify client exists and belongs to user's agency
        const { data: client } = await supabaseServer
            .from('clients')
            .select('id, agency_id')
            .eq('id', client_id)
            .eq('agency_id', agency_id) // DATA ISOLATION: User's agency only
            .single();

        if (!client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        // Step 5: For account managers, verify they're assigned to this client
        if (role === 'account_manager') {
            const { data: assignment } = await supabaseServer
                .from('user_client_assignments')
                .select('client_id')
                .eq('user_id', user_id)
                .eq('client_id', client_id)
                .maybeSingle();

            if (!assignment) {
                return NextResponse.json(
                    { success: false, error: 'You are not assigned to this client' },
                    { status: 403 }
                );
            }
        }

        // Step 6: Create campaign
        const { data: campaign, error } = await supabaseServer
            .from('campaigns')
            .insert([
                {
                    client_id,
                    agency_id,
                    name: name.trim(),
                    platform: platform.trim(),
                    status: 'active',
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Insert error:', error);
            return NextResponse.json(
                { success: false, error: error.message || 'Failed to create campaign' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, campaign },
            { status: 201 }
        );
    } catch (error) {
        console.error('POST /api/campaigns error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}