// app/api/clients/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/clients/[id]
 * Get a specific client
 * 
 * Data isolation: Verify client belongs to user's agency
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
    const clientId = params.id;

    // Step 2: Fetch client
    const { data: client, error } = await supabaseServer
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('agency_id', agency_id) // DATA ISOLATION: Only this agency's clients
      .single();

    if (error || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, client },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clients/[id]
 * Update a client
 * 
 * Data isolation: Verify client belongs to user's agency
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
    const clientId = params.id;

    // Step 2: Parse request
    const body = await request.json();
    const { name, contact_email } = body;

    // Step 3: Validate input
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Client name is required' },
        { status: 400 }
      );
    }

    if (contact_email && !contact_email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Step 4: Verify client exists and belongs to this agency
    const { data: existingClient } = await supabaseServer
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('agency_id', agency_id) // DATA ISOLATION
      .single();

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Step 5: Update client
    const { data: client, error } = await supabaseServer
      .from('clients')
      .update({
        name: name.trim(),
        contact_email: contact_email?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
      .eq('agency_id', agency_id) // DATA ISOLATION: Extra safety
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update client' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, client },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/clients/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete a client (and all related data via CASCADE)
 * 
 * Data isolation: Verify client belongs to user's agency
 * Role restriction: Only owner can delete
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
    const clientId = params.id;

    // Step 2: Verify client exists and belongs to this agency
    const { data: existingClient } = await supabaseServer
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('agency_id', agency_id) // DATA ISOLATION
      .single();

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Step 3: Delete client
    // All related campaigns, metrics, and tokens will cascade delete
    const { error } = await supabaseServer
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('agency_id', agency_id); // DATA ISOLATION: Extra safety

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete client' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Client deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/clients/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}