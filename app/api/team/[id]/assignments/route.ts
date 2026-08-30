// app/api/team/[id]/assignments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { AssignmentResponse, DeleteResponse } from '@/types';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/team/[id]/assignments
 * Assign a client to an account manager (owner only)
 * Body: { client_id: string }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AssignmentResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id, role } = auth.payload;
    const managerId = params.id;

    if (role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Only agency owners can manage assignments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { client_id } = body;

    if (!client_id) {
      return NextResponse.json(
        { success: false, error: 'client_id is required' },
        { status: 400 }
      );
    }

    // Verify manager belongs to this agency
    const { data: manager } = await supabaseServer
      .from('users')
      .select('id, agency_id, role')
      .eq('id', managerId)
      .single();

    if (!manager || manager.agency_id !== agency_id) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Verify client belongs to this agency (data isolation)
    const { data: client } = await supabaseServer
      .from('clients')
      .select('id, agency_id')
      .eq('id', client_id)
      .single();

    if (!client || client.agency_id !== agency_id) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Upsert to avoid duplicate assignment errors
    const { data: assignment, error } = await supabaseServer
      .from('user_client_assignments')
      .upsert(
        { user_id: managerId, client_id },
        { onConflict: 'user_id,client_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Assignment error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to assign client' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/team/[id]/assignments error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/[id]/assignments?client_id=xxx
 * Unassign a client from an account manager (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<DeleteResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id, role } = auth.payload;
    const managerId = params.id;

    if (role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Only agency owners can manage assignments' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'client_id query param is required' },
        { status: 400 }
      );
    }

    // Verify manager belongs to this agency before touching assignments
    const { data: manager } = await supabaseServer
      .from('users')
      .select('id, agency_id')
      .eq('id', managerId)
      .single();

    if (!manager || manager.agency_id !== agency_id) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }

    const { error } = await supabaseServer
      .from('user_client_assignments')
      .delete()
      .eq('user_id', managerId)
      .eq('client_id', clientId);

    if (error) {
      console.error('Unassign error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to unassign client' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/team/[id]/assignments error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}