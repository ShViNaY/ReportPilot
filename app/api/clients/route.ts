// app/api/clients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute, checkRole } from '@/lib/middleware';
import { CreateClientRequest, CreateClientResponse, GetClientsResponse } from '@/types';
import crypto from 'crypto';

/**
 * GET /api/clients
 * Get all clients for the authenticated user's agency
 * 
 * Role restriction: Owner & Account Manager can view
 * Data isolation: Only clients in their agency
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Authenticate user
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id } = auth.payload;

    // Step 2: Query clients for this agency ONLY
    const { data: clients, error } = await supabaseServer
      .from('clients')
      .select('*')
      .eq('agency_id', agency_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, clients: clients || [] },
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Authenticate user
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id, role } = auth.payload;

    // Step 2: Parse request
    const body: CreateClientRequest = await request.json();
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

    // Step 4: Generate unique portal token
    // This token will be used for client-facing dashboard access
    const portalToken = crypto.randomBytes(16).toString('hex');

    // Step 5: Create client
    const { data: client, error } = await supabaseServer
      .from('clients')
      .insert([
        {
          agency_id, // Automatically use authenticated user's agency
          name: name.trim(),
          contact_email: contact_email?.trim() || null,
          portal_token: portalToken,
        },
      ])
      .select()
      .single();

    // if (error) {
    //   console.error('Insert error:', error);
    //   return NextResponse.json(
    //     { success: false, error: 'Failed to create client' },
    //     { status: 500 }
    //   );
    // }

    // return NextResponse.json(
    //   { success: true, client },
    //   { status: 201 }
    // );
    if (error || !client) {
  console.error('Insert error:', error);
  return NextResponse.json(
    { success: false, error: 'Failed to create client' },
    { status: 500 }
  );
}

// Step 6: Hash the portal token
const tokenHash = crypto
  .createHash('sha256')
  .update(portalToken)
  .digest('hex');

// Step 7: Store the hashed token in client_access_tokens
const { error: tokenError } = await supabaseServer
  .from('client_access_tokens')
  .insert([
    {
      client_id: client.id,
      token_hash: tokenHash,
      expires_at: null,
    },
  ]);

if (tokenError) {
  console.error('Portal token creation error:', tokenError);
  return NextResponse.json(
    { success: false, error: 'Failed to create portal access token' },
    { status: 500 }
  );
}

// Step 8: Return client + portal token
return NextResponse.json(
  {
    success: true,
    client,
    portal_token: portalToken,
  },
  { status: 201 }
);
  } catch (error) {
    console.error('POST /api/clients error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}