// lib/utils/auth.ts

import crypto from 'crypto';
import { AuthPayload } from '@/types';

/**
 * Hash a password using Node.js crypto
 * Simple hashing for MVP - consider bcrypt in production
 */
export function hashPassword(password: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  const hash = crypto
    .createHash('sha256')
    .update(password + secret)
    .digest('hex');
  return hash;
}

/**
 * Verify a password against its hash using timing-safe comparison
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    const newHash = hashPassword(password);
    const hashBuf = Buffer.from(newHash, 'utf8');
    const targetBuf = Buffer.from(hash, 'utf8');
    if (hashBuf.length !== targetBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, targetBuf);
  } catch {
    return false;
  }
}

/**
 * Generate JWT token manually (no external library)
 */
export function generateToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const header = Buffer.from(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT',
  })).toString('base64url');

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 24 * 60 * 60, // Expires in 24 hours
  };

  const body = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode JWT token with timing-safe signature comparison and algorithm validation
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, bodyB64, signatureB64] = parts;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return null;
    }

    // Decode and verify header algorithm
    const header = JSON.parse(
      Buffer.from(headerB64, 'base64url').toString('utf-8')
    );
    if (header.alg !== 'HS256') {
      return null;
    }

    // Verify signature with constant-time comparison
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${bodyB64}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signatureB64, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');

    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(bodyB64, 'base64url').toString('utf-8')
    ) as AuthPayload;

    // Check required claims
    if (!payload.user_id || !payload.agency_id || !payload.role) {
      return null;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || typeof payload.exp !== 'number' || payload.exp < now) {
      return null; // Token expired
    }

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 * Expects: "Bearer token_here"
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Validate password strength
 * Returns error message if invalid, null if valid
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
    if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}