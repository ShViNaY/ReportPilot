// app/api/team/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { TeamListResponse, AddTeamMemberResponse } from '@/types';

/**
 * GET /api/team
 * List all team members in the owner's agency
 * Owner only
 */
export async function GET(request: NextRequest): Promise<NextResponse<TeamListResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id, role } = auth.payload;

    if (role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Only agency owners can view the team' },
        { status: 403 }
      );
    }

    const { data: members, error } = await supabaseServer
      .from('users')
      .select('id, email, role, created_at')
      .eq('agency_id', agency_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Team fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Attach assigned client counts for account managers
    const memberIds = (members || []).map(m => m.id);
    const { data: assignments } = await supabaseServer
      .from('user_client_assignments')
      .select('user_id, client_id')
      .in('user_id', memberIds);

    const membersWithCounts = (members || []).map(member => ({
      ...member,
      assigned_client_count:
        assignments?.filter(a => a.user_id === member.id).length || 0,
    }));

    return NextResponse.json(
      { success: true, members: membersWithCounts },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/team error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team
 * Add a new account manager to the agency
 * Owner only
 *
 * Body: { email: string, password: string }
 * (role is always 'account_manager' - owners can't create other owners here)
 */
export async function POST(request: NextRequest): Promise<NextResponse<AddTeamMemberResponse>> {
  try {
    const auth = await protectedRoute(request);
    if (!auth.success) return auth.response;

    const { agency_id, role } = auth.payload;

    if (role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Only agency owners can add team members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check email isn't already in use anywhere
    const { data: existing } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'This email is already registered' },
        { status: 409 }
      );
    }

    // Create the auth user via Supabase Admin API (service role required)
    const { data: authUser, error: authError } =
      await supabaseServer.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authUser?.user) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Insert the app-level user row, linked to this agency
    const { data: newMember, error: insertError } = await supabaseServer
      .from('users')
      .insert({
        id: authUser.user.id,
        agency_id,
        email,
        role: 'account_manager',
      })
      .select('id, email, role, created_at')
      .single();

    if (insertError) {
      console.error('Team member insert error:', insertError);
      // Roll back the auth user so we don't leave an orphaned account
      await supabaseServer.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { success: false, error: 'Failed to add team member' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, member: newMember },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/team error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}