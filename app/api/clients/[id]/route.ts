// app/api/clients/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { validateRouteId, validateUpdateClientInput } from '@/lib/utils/validation';
import { 
  GetClientResponse, 
  UpdateClientRequest, 
  UpdateClientResponse 
} from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clients/[id]
 * Get a specific client (owner or assigned account manager)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<GetClientResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) {
      return NextResponse.json<GetClientResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { agency_id, user_id, role } = auth.payload;
    const { id: clientId } = await params;

    const idValidation = validateRouteId(clientId, 'Client ID');
    if (!idValidation.success) {
      return NextResponse.json<GetClientResponse>(
        { success: false, error: idValidation.error },
        { status: 400 }
      );
    }

    // Fetch client without portal_token
    const { data: client, error } = await supabaseServer
      .from('clients')
      .select('id, agency_id, name, contact_email, created_at, updated_at')
      .eq('id', clientId)
      .eq('agency_id', agency_id)
      .single();

    if (error || !client) {
      return NextResponse.json<GetClientResponse>(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if account manager has access
    if (role === 'account_manager') {
      const { data: assignment } = await supabaseServer
        .from('user_client_assignments')
        .select('client_id')
        .eq('user_id', user_id)
        .eq('client_id', clientId)
        .maybeSingle();

      if (!assignment) {
        return NextResponse.json<GetClientResponse>(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json<GetClientResponse>(
      { success: true, client },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error);
    return NextResponse.json<GetClientResponse>(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clients/[id]
 * Update a client (owner or assigned account manager)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UpdateClientResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) {
      return NextResponse.json<UpdateClientResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { agency_id, user_id, role } = auth.payload;
    const { id: clientId } = await params;

    const idValidation = validateRouteId(clientId, 'Client ID');
    if (!idValidation.success) {
      return NextResponse.json<UpdateClientResponse>(
        { success: false, error: idValidation.error },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const validation = validateUpdateClientInput(body);
    if (!validation.success) {
      return NextResponse.json<UpdateClientResponse>(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Check if account manager has access
    if (role === 'account_manager') {
      const { data: assignment } = await supabaseServer
        .from('user_client_assignments')
        .select('client_id')
        .eq('user_id', user_id)
        .eq('client_id', clientId)
        .maybeSingle();

      if (!assignment) {
        return NextResponse.json<UpdateClientResponse>(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Update client with validated fields
    const { data: client, error } = await supabaseServer
      .from('clients')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
      .eq('agency_id', agency_id)
      .select('id, agency_id, name, contact_email, created_at, updated_at')
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json<UpdateClientResponse>(
        { success: false, error: 'Failed to update client' },
        { status: 500 }
      );
    }

    return NextResponse.json<UpdateClientResponse>(
      { success: true, client },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/clients/[id] error:', error);
    return NextResponse.json<UpdateClientResponse>(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete a client (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { agency_id, role } = auth.payload;
    const { id: clientId } = await params;

    const idValidation = validateRouteId(clientId, 'Client ID');
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: idValidation.error },
        { status: 400 }
      );
    }

    if (role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Only agency owners can delete clients' },
        { status: 403 }
      );
    }

    // Verify client exists and belongs to user's agency (IDOR prevention)
    const { data: existingClient } = await supabaseServer
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('agency_id', agency_id)
      .single();

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Delete associated portal tokens
    await supabaseServer
      .from('client_access_tokens')
      .delete()
      .eq('client_id', clientId);

    // Delete associated assignments
    await supabaseServer
      .from('user_client_assignments')
      .delete()
      .eq('client_id', clientId);

    // Delete the client
    const { error } = await supabaseServer
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('agency_id', agency_id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete client' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/clients/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}