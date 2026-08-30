// app/api/campaigns/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';

interface RouteParams { 
    params: Promise<{ id: string }>; 
}

/**
 * GET /api/campaigns/[id]
 * Get a specific campaign
 * 
 * Data isolation: Verify campaign belongs to user's agency
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
        const { id: campaignId } = await params;

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
 * Update a campaign
 * 
 * Data isolation: Verify campaign belongs to user's agency
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
        const { id: campaignId } = await params;
        
        // Step 2: Parse request
        const body = await request.json();
        const { name, platform, status } = body;

        // Step 3: Validate input
        if (name && name.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Campaign name cannot be empty' },
                { status: 400 }
            );
        }

        if (platform && !['google_ads', 'meta_ads', 'other'].includes(platform)) {
            return NextResponse.json(
                { success: false, error: 'Invalid platform' },
                { status: 400 }
            );
        }

        if (status && !['active', 'paused', 'completed'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Step 4: Verify campaign exists and belongs to user's agency
        const { data: existingCampaign } = await supabaseServer
            .from('campaigns')
            .select('id')
            .eq('id', campaignId)
            .eq('agency_id', agency_id) // DATA ISOLATION
            .single();

        if (!existingCampaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Step 5: Build update object (only include provided fields)
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (name) updateData.name = name.trim();
        if (platform) updateData.platform = platform;
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
 * Data isolation: Verify campaign belongs to user's agency
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
        const { id: campaignId } = await params;

        // Step 2: Verify campaign exists and belongs to user's agency
        const { data: existingCampaign } = await supabaseServer
            .from('campaigns')
            .select('id')
            .eq('id', campaignId)
            .eq('agency_id', agency_id) // DATA ISOLATION
            .single();

        if (!existingCampaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Step 3: Delete campaign
        // All related metric_entries will cascade delete
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