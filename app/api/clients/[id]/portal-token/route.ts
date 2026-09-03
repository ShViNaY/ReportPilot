// app/api/clients/[id]/portal-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { PortalTokenResponse, RevokePortalTokenResponse } from '@/types';
import crypto from 'crypto';

interface RouteParams {
  params: { id: string };
}

interface GenerateTokenRequest {
  expirationDays?: number | null; // null = no expiration
}

/**
 * POST /api/clients/[id]/portal-token
 * Generate or regenerate a portal token (owner only)
 * Revokes the old token immediately
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<PortalTokenResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) {
      return NextResponse.json<PortalTokenResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { agency_id, role } = auth.payload;
    const clientId = params.id;

    if (role !== 'owner') {
      return NextResponse.json<PortalTokenResponse>(
        { success: false, error: 'Only agency owners can manage portal tokens' },
        { status: 403 }
      );
    }

    // Verify client exists and belongs to agency
    const { data: client, error: clientError } = await supabaseServer
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .eq('agency_id', agency_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json<PortalTokenResponse>(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Parse request
    const body: GenerateTokenRequest = await request.json().catch(() => ({}));
    const expirationDays = body.expirationDays || null;

    // Calculate expiration date
    let expiresAt: string | null = null;
    if (expirationDays && expirationDays > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      expiresAt = expirationDate.toISOString();
    }

    // Generate new portal token
    const portalToken = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(portalToken)
      .digest('hex');

    // Delete old token entry if exists
    await supabaseServer
      .from('client_access_tokens')
      .delete()
      .eq('client_id', clientId);

    // Create new token entry
    const { error: insertError } = await supabaseServer
      .from('client_access_tokens')
      .insert([
        {
          client_id: clientId,
          token_hash: tokenHash,
          expires_at: expiresAt,
        },
      ]);

    if (insertError) {
      console.error('Token insert error:', insertError);
      return NextResponse.json<PortalTokenResponse>(
        { success: false, error: 'Failed to generate portal token' },
        { status: 500 }
      );
    }

    // Return the raw token (only time it's exposed)
    return NextResponse.json<PortalTokenResponse>(
      {
        success: true,
        portal_token: portalToken,
        portal_url: `/portal/${portalToken}`,
        expires_at: expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/clients/[id]/portal-token error:', error);
    return NextResponse.json<PortalTokenResponse>(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]/portal-token
 * Revoke the portal token (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<RevokePortalTokenResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) {
      return NextResponse.json<RevokePortalTokenResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { agency_id, role } = auth.payload;
    const clientId = params.id;

    if (role !== 'owner') {
      return NextResponse.json<RevokePortalTokenResponse>(
        { success: false, error: 'Only agency owners can revoke portal tokens' },
        { status: 403 }
      );
    }

    // Verify client exists
    const { data: client, error: clientError } = await supabaseServer
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .eq('agency_id', agency_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json<RevokePortalTokenResponse>(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Delete token entry
    const { error: deleteError } = await supabaseServer
      .from('client_access_tokens')
      .delete()
      .eq('client_id', clientId);

    if (deleteError) {
      console.error('Token delete error:', deleteError);
      return NextResponse.json<RevokePortalTokenResponse>(
        { success: false, error: 'Failed to revoke portal token' },
        { status: 500 }
      );
    }

    return NextResponse.json<RevokePortalTokenResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/clients/[id]/portal-token error:', error);
    return NextResponse.json<RevokePortalTokenResponse>(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}