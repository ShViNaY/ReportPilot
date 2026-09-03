// lib/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './utils/auth';
import { AuthPayload } from '@/types';

// Explicit discriminated union types so TS can narrow correctly
type ProtectedRouteResult =
  | { success: true; payload: AuthPayload }
  | { success: false; response: NextResponse };

type CheckRoleResult =
  | { success: true }
  | { success: false; response: NextResponse };


/**
 * Wrapper to apply auth to an API route
 * Usage:
 *
 * export async function POST(request: NextRequest) {
 *   const auth = await protectedRoute(request);
 *   if (!auth.success) return auth.response;
 *
 *   const { user_id, agency_id } = auth.payload;
 *   // Your route logic here
 * }
 */
export async function protectedRoute(request: NextRequest): Promise<ProtectedRouteResult> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader ?? undefined);

    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Missing authorization token' },
          { status: 401 }
        ),
      };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        ),
      };
    }

    return { success: true, payload };
  } catch (error) {
    console.error('Protected route error:', error);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Require specific role(s) for a route
 * Usage:
 *
 * const roleCheck = checkRole(auth.payload.role, ['owner']);
 * if (!roleCheck.success) return roleCheck.response;
 */
export function checkRole(
  userRole: string,
  allowedRoles: string[]
): CheckRoleResult {
  if (!allowedRoles.includes(userRole)) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return { success: true };
}