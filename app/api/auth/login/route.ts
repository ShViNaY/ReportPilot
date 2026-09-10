// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyPassword, generateToken } from '@/lib/utils/auth';
import {
  getClientIp,
  checkRateLimit,
  resetRateLimit,
  createRateLimitResponse,
  getRateLimitConfig,
} from '@/lib/utils/rateLimit';
import { validateLoginInput } from '@/lib/utils/validation';
import { LoginRequest, LoginResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    // 1. IP-based rate limiting check
    const clientIp = getClientIp(request);
    const config = getRateLimitConfig();
    const ipRateLimit = checkRateLimit(
      `login:ip:${clientIp}`,
      config.login.ipMax,
      config.login.ipWindowSec
    );

    if (!ipRateLimit.allowed) {
      return createRateLimitResponse(
        ipRateLimit,
        'Too many login attempts from this IP. Please try again later.'
      );
    }

    // Parse request body
    const body = await request.json().catch(() => null);
    const validation = validateLoginInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    const { email, password } = validation.data;
    const normalizedEmail = email;
    const accountRateLimit = checkRateLimit(
      `login:account:${normalizedEmail}`,
      config.login.accountMax,
      config.login.accountWindowSec
    );

    if (!accountRateLimit.allowed) {
      return createRateLimitResponse(
        accountRateLimit,
        'Too many failed login attempts for this account. Please try again later.'
      );
    }

    // Query Supabase for user
    const { data: users, error: queryError } = await supabaseServer
      .from('users')
      .select('id, agency_id, email, password_hash, role, created_at, updated_at')
      .eq('email', normalizedEmail)
      .limit(1);

    if (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    // User not found
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password with timing-safe comparison
    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Password correct - clear account-specific rate limit on success
    resetRateLimit(`login:account:${normalizedEmail}`);

    // Password correct - generate JWT token
    const token = generateToken({
      user_id: user.id,
      agency_id: user.agency_id,
      role: user.role,
      iat: 0, // Will be set by generateToken
      exp: 0, // Will be set by generateToken
    });

    // Return token and user info (don't expose password hash)
    const response: LoginResponse = {
      success: true,
      token,
      user: {
        id: user.id,
        agency_id: user.agency_id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}