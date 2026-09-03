// lib/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './utils/auth';
import { AuthPayload } from '@/types';

// Explicit discriminated union types so TS can narrow correctly.
// The failure response is typed as NextResponse<{ success: false; error: string }>
// (not plain NextResponse, which defaults to NextResponse<unknown>) so that
// `return auth.response` type-checks inside routes with a strict return type
// like Promise<NextResponse<CreateClientResponse>> — every generated
// ...Response union includes this exact { success: false; error: string } shape,
// so it's assignable no matter which route is calling it.
type ProtectedRouteResult =
  | { success: true; payload: AuthPayload }
  | { success: false; response: NextResponse<{ success: false; error: string }> };

type CheckRoleResult =
  | { success: true }
  | { success: false; response: NextResponse<{ success: false; error: string }> };

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