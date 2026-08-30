// app/api/team/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { UpdateTeamMemberResponse, DeleteResponse } from '@/types';

interface RouteParams {
  params: { id: string };
}

/**
 * PUT /api/team/[id]
 * Update a team member's role (owner only)
 * Body: { role: 'owner' | 'account_manager' }
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UpdateTeamMemberResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id, role, user_id } = auth.payload;
    const targetId = params.id;

    if (role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Only agency owners can edit team members' },
        { status: 403 }
      );
    }

    if (targetId === user_id) {
      return NextResponse.json(
        { success: false, error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role: newRole } = body;

    if (!['owner', 'account_manager'].includes(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Verify target belongs to the same agency (data isolation)
    const { data: target, error: fetchError } = await supabaseServer
      .from('users')
      .select('id, agency_id')
      .eq('id', targetId)
      .single();

    if (fetchError || !target || target.agency_id !== agency_id) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }

    const { data: updated, error: updateError } = await supabaseServer
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', targetId)
      .select('id, email, role, created_at')
      .single();

    if (updateError) {
      console.error('Team member update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update team member' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, member: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/team/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/[id]
 * Remove a team member from the agency (owner only)
 * Also cleans up their client assignments and deletes their auth account
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<DeleteResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id, role, user_id } = auth.payload;
    const targetId = params.id;

    if (role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Only agency owners can remove team members' },
        { status: 403 }
      );
    }

    if (targetId === user_id) {
      return NextResponse.json(
        { success: false, error: 'You cannot remove yourself' },
        { status: 400 }
      );
    }

    const { data: target, error: fetchError } = await supabaseServer
      .from('users')
      .select('id, agency_id, role')
      .eq('id', targetId)
      .single();

    if (fetchError || !target || target.agency_id !== agency_id) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Clean up client assignments first
    await supabaseServer
      .from('user_client_assignments')
      .delete()
      .eq('user_id', targetId);

    // Remove the app-level row
    const { error: deleteError } = await supabaseServer
      .from('users')
      .delete()
      .eq('id', targetId);

    if (deleteError) {
      console.error('Team member delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove team member' },
        { status: 500 }
      );
    }

    // Remove their Supabase Auth account too
    await supabaseServer.auth.admin.deleteUser(targetId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/team/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}