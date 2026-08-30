// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { hashPassword, generateToken } from '@/lib/utils/auth';
import { LoginRequest, LoginResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    // Parse request body
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query Supabase for user
    const { data: users, error: queryError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

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

    // Verify password
    const passwordHash = hashPassword(password);
    if (passwordHash !== user.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

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