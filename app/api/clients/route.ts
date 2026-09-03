// app/api/clients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { CreateClientRequest, CreateClientResponse, GetClientsResponse } from '@/types';
import crypto from 'crypto';

/**
 * GET /api/clients
 * Get all clients for the authenticated user's agency
 * 
 * Role restriction: Owner & Account Manager can view
 * Data isolation: Only clients in their agency (Account Managers: only assigned clients)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Authenticate user
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id, user_id, role } = auth.payload;

    // Step 2: Query clients for this agency ONLY
    let query = supabaseServer
      .from('clients')
      .select('id, agency_id, name, contact_email, created_at, updated_at')
      .eq('agency_id', agency_id);

    // Step 2b: Account managers only see their assigned clients
    if (role === 'account_manager') {
      const { data: assignments } = await supabaseServer
        .from('user_client_assignments')
        .select('client_id')
        .eq('user_id', user_id);

      const assignedClientIds = assignments?.map((a) => a.client_id) || [];

      if (assignedClientIds.length === 0) {
        return NextResponse.json(
          { success: true, clients: [] },
          { status: 200 }
        );
      }

      query = query.in('id', assignedClientIds);
    }

    const { data: clients, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    // Step 3: Look up assignments for these clients, and the manager for each
    const clientIds = (clients || []).map((c) => c.id);

    let assignedManagerByClientId: Record<string, { id: string; email: string }> = {};

    if (clientIds.length > 0) {
      const { data: assignments } = await supabaseServer
        .from('user_client_assignments')
        .select('client_id, user_id')
        .in('client_id', clientIds);

      if (assignments && assignments.length > 0) {
        const managerIds = [...new Set(assignments.map((a) => a.user_id))];

        const { data: managers } = await supabaseServer
          .from('users')
          .select('id, email')
          .in('id', managerIds);

        const managerById = new Map((managers || []).map((m) => [m.id, m]));

        assignedManagerByClientId = assignments.reduce((acc, a) => {
          const manager = managerById.get(a.user_id);
          if (manager) acc[a.client_id] = { id: manager.id, email: manager.email };
          return acc;
        }, {} as Record<string, { id: string; email: string }>);
      }
    }

    const clientsWithAssignment = (clients || []).map((c) => ({
      ...c,
      assigned_manager: assignedManagerByClientId[c.id] || null,
    }));

    return NextResponse.json(
      { success: true, clients: clientsWithAssignment },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/clients error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Create a new client for the agency
 * 
 * Role restriction: Only Owner & Account Manager
 * Data isolation: Client automatically tied to authenticated user's agency
 */

/**
 * POST /api/clients
 * Create a new client (owner only)
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateClientResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id, role } = auth.payload;

    if (role !== 'owner') {
      return NextResponse.json<CreateClientResponse>(
        { success: false, error: 'Only agency owners can create clients' },
        { status: 403 }
      );
    }

    const body: CreateClientRequest = await request.json();
    const { name, contact_email } = body;

    if (!name || !contact_email) {
      return NextResponse.json<CreateClientResponse>(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Generate portal token
    const portalToken = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(portalToken)
      .digest('hex');

    // Create client
    const { data: client, error: clientError } = await supabaseServer
      .from('clients')
      .insert([
        {
          agency_id,
          name,
          contact_email,
          portal_token: tokenHash, // Store hash, not raw token
        },
      ])
      .select('id, agency_id, name, contact_email, created_at, updated_at')
      .single();

    if (clientError) {
      console.error('Client creation error:', clientError);
      return NextResponse.json<CreateClientResponse>(
        { success: false, error: 'Failed to create client' },
        { status: 500 }
      );
    }

    return NextResponse.json<CreateClientResponse>(
      {
        success: true,
        client,
        portal_token: portalToken,
        portal_url: `/portal/${portalToken}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/clients error:', error);
    return NextResponse.json<CreateClientResponse>(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}