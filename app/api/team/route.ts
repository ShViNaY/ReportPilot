// app/api/team/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import { TeamListResponse, AddTeamMemberResponse } from '@/types';
import { hashPassword, validateEmail, validatePasswordStrength } from '@/lib/utils/auth';

/**
 * GET /api/team
 * List all team members in the owner's agency
 * Owner only
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
// app/api/team/route.ts (POST function only - keep your existing GET function above this)

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: passwordError },
        { status: 400 }
      );
    }

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

    const password_hash = hashPassword(password);

    const { data: newMember, error: insertError } = await supabaseServer
      .from('users')
      .insert({
        agency_id,
        email,
        password_hash,
        role: 'account_manager',
      })
      .select('id, email, role, created_at')
      .single();

    if (insertError) {
      console.error('Team member insert error:', insertError);
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