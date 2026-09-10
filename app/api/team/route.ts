// app/api/team/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { protectedRoute } from '@/lib/middleware';
import {
  checkRateLimit,
  createRateLimitResponse,
  getRateLimitConfig,
} from '@/lib/utils/rateLimit';
import { TeamListResponse, AddTeamMemberResponse } from '@/types';
import { hashPassword, validateEmail, validatePasswordStrength } from '@/lib/utils/auth';
import { validateCreateTeamMemberInput } from '@/lib/utils/validation';

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

    const [membersResult, agencyClientsResult] = await Promise.all([
      supabaseServer
        .from('users')
        .select('id, email, role, created_at')
        .eq('agency_id', agency_id)
        .order('created_at', { ascending: true }),
      supabaseServer
        .from('clients')
        .select('id')
        .eq('agency_id', agency_id),
    ]);

    if (membersResult.error) {
      console.error('Team fetch error:', membersResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    const members = membersResult.data || [];
    const validClientIds = new Set((agencyClientsResult.data || []).map((c) => c.id));

    // Attach assigned client counts for account managers
    const memberIds = (members || []).map((m) => m.id);
    const { data: assignments } = await supabaseServer
      .from('user_client_assignments')
      .select('user_id, client_id')
      .in('user_id', memberIds);

    const validAssignments = (assignments || []).filter((a) => validClientIds.has(a.client_id));

    const membersWithCounts = (members || []).map((member) => ({
      ...member,
      assigned_client_count: validAssignments.filter((a) => a.user_id === member.id).length,
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

    // Rate limiting for adding team members / account creation
    const config = getRateLimitConfig();
    const teamRateLimit = checkRateLimit(
      `team:create:${agency_id}`,
      config.passwordAction.max,
      config.passwordAction.windowSec
    );

    if (!teamRateLimit.allowed) {
      return createRateLimitResponse(
        teamRateLimit,
        'Rate limit exceeded for creating team accounts. Please try again later.'
      );
    }

    const body = await request.json().catch(() => null);
    const validation = validateCreateTeamMemberInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    const { email, password } = validation.data;

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