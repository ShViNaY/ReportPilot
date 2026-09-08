// app/api/campaigns/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { validateRouteId, validateUpdateCampaignInput } from '@/lib/utils/validation';

interface RouteParams { 
    params: Promise<{ id: string }>; 
}

/**
 * GET /api/campaigns/[id]
 * Get a specific campaign
 * 
 * Data isolation: Verify campaign belongs to user's agency (and, for Account Managers, is for an assigned client)
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id, user_id, role } = auth.payload;
        const { id: campaignId } = await params;

        const idValidation = validateRouteId(campaignId, 'Campaign ID');
        if (!idValidation.success) {
            return NextResponse.json(
                { success: false, error: idValidation.error },
                { status: 400 }
            );
        }

        // Step 2: Fetch campaign
        const { data: campaign, error } = await supabaseServer
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .eq('agency_id', agency_id) // DATA ISOLATION: User's agency only
            .single();

        if (error || !campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Step 3: Account managers can only view campaigns for their assigned clients
        if (role === 'account_manager') {
            const { data: assignment } = await supabaseServer
                .from('user_client_assignments')
                .select('client_id')
                .eq('user_id', user_id)
                .eq('client_id', campaign.client_id)
                .maybeSingle();

            if (!assignment) {
                return NextResponse.json(
                    { success: false, error: 'Campaign not found' },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json(
            { success: true, campaign },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/campaigns/[id] error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/campaigns/[id]
 * Update campaign details (name, platform, status)
 * 
 * Data isolation: Verify campaign belongs to user's agency
 * For account managers: Verify campaign is for an assigned client
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id, user_id, role } = auth.payload;
        const { id: campaignId } = await params;

        const idValidation = validateRouteId(campaignId, 'Campaign ID');
        if (!idValidation.success) {
            return NextResponse.json(
                { success: false, error: idValidation.error },
                { status: 400 }
            );
        }
        
        // Step 2: Parse and validate request
        const body = await request.json().catch(() => null);
        const validation = validateUpdateCampaignInput(body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }
        const { name, platform, status } = validation.data;

        // Step 4: Verify campaign exists and belongs to user's agency
        const { data: existingCampaign } = await supabaseServer
            .from('campaigns')
            .select('id, client_id')
            .eq('id', campaignId)
            .eq('agency_id', agency_id) // DATA ISOLATION
            .single();

        if (!existingCampaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Step 4b: Account managers can only edit campaigns for their assigned clients
        if (role === 'account_manager') {
            const { data: assignment } = await supabaseServer
                .from('user_client_assignments')
                .select('client_id')
                .eq('user_id', user_id)
                .eq('client_id', existingCampaign.client_id)
                .maybeSingle();

            if (!assignment) {
                return NextResponse.json(
                    { success: false, error: 'Campaign not found' },
                    { status: 404 }
                );
            }
        }

        // Step 5: Build update object (only include provided fields)
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (name && name.trim() !== '') updateData.name = name.trim();
        if (platform && platform.trim() !== '') updateData.platform = platform.trim();
        if (status) updateData.status = status;

        // Step 6: Update campaign
        const { data: campaign, error } = await supabaseServer
            .from('campaigns')
            .update(updateData)
            .eq('id', campaignId)
            .eq('agency_id', agency_id) // DATA ISOLATION: Extra safety
            .select()
            .single();

        if (error) {
            console.error('Update error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update campaign' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, campaign },
            { status: 200 }
        );
    } catch (error) {
        console.error('PUT /api/campaigns/[id] error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete a campaign (cascades to metrics, etc.)
 * 
 * Data isolation: Verify campaign belongs to user's agency (and, for Account Managers, is for an assigned client)
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        // Step 1: Authenticate user
        const auth = await protectedRoute(request);
        if (!auth.success) return auth.response;

        const { agency_id, role } = auth.payload;
        const { id: campaignId } = await params;

        const idValidation = validateRouteId(campaignId, 'Campaign ID');
        if (!idValidation.success) {
            return NextResponse.json(
                { success: false, error: idValidation.error },
                { status: 400 }
            );
        }

        // Step 2: Only owners can delete campaigns
        if (role !== 'owner') {
            return NextResponse.json(
                { success: false, error: 'Only agency owners can delete campaigns' },
                { status: 403 }
            );
        }

        // Step 3: Verify campaign exists and belongs to user's agency
        const { data: existingCampaign } = await supabaseServer
            .from('campaigns')
            .select('id, client_id')
            .eq('id', campaignId)
            .eq('agency_id', agency_id) // DATA ISOLATION
            .single();

        if (!existingCampaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Step 3: Delete campaign and its metric_entries explicitly
        await supabaseServer
            .from('metric_entries')
            .delete()
            .eq('campaign_id', campaignId)
            .eq('agency_id', agency_id);

        const { error } = await supabaseServer
            .from('campaigns')
            .delete()
            .eq('id', campaignId)
            .eq('agency_id', agency_id); // DATA ISOLATION: Extra safety

        if (error) {
            console.error('Delete error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to delete campaign' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Campaign deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('DELETE /api/campaigns/[id] error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}