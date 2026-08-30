// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { hashPassword, generateToken, validateEmail, validatePasswordStrength } from '@/lib/utils/auth';
import { SignupRequest, SignupResponse } from '@/types';
import crypto from 'crypto';

export async function POST(request: NextRequest): Promise<NextResponse<SignupResponse>> {
  try {
    // Parse request body
    const body: SignupRequest = await request.json();
    const { email, password, agency_name } = body;

    // Validate input
    if (!email || !password || !agency_name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and agency name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: passwordError },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase());

    if (checkError) {
      console.error('Database check error:', checkError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Step 1: Create agency
    const { data: agencyData, error: agencyError } = await supabaseServer
      .from('agencies')
      .insert([{ name: agency_name }])
      .select()
      .single();

    if (agencyError || !agencyData) {
      console.error('Agency creation error:', agencyError);
      return NextResponse.json(
        { success: false, error: 'Failed to create agency' },
        { status: 500 }
      );
    }

    // Step 2: Create user as owner
    const passwordHash = hashPassword(password);
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .insert([
        {
          agency_id: agencyData.id,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role: 'owner', // First user is always owner
        },
      ])
      .select()
      .single();

    if (userError || !userData) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Step 3: Generate JWT token
    const token = generateToken({
      user_id: userData.id,
      agency_id: userData.agency_id,
      role: userData.role,
      iat: 0, // Will be set by generateToken
      exp: 0, // Will be set by generateToken
    });

    // Step 4: Return response
    const response: SignupResponse = {
      success: true,
      token,
      user: {
        id: userData.id,
        agency_id: userData.agency_id,
        email: userData.email,
        role: userData.role,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      },
      agency: {
        id: agencyData.id,
        name: agencyData.name,
        created_at: agencyData.created_at,
        updated_at: agencyData.updated_at,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}