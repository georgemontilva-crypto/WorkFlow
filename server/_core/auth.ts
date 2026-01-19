import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { ENV } from './env';
import type { User } from '../../drizzle/schema';

const JWT_SECRET = new TextEncoder().encode(ENV.jwtSecret);
const JWT_EXPIRATION = '7d'; // 7 days
const BCRYPT_SALT_ROUNDS = 12; // Military-grade: 12 rounds = ~1 second per hash

export interface JWTPayload {
  user_id: number;
  email: string;
  role: string;
}

/**
 * Generate JWT token for authenticated user
 */
export async function generateToken(user: User): Promise<string> {
  const token = await new SignJWT({
    user_id: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header or cookie
 */
export function extractToken(authHeader?: string, cookieHeader?: string): string | null {
  // Try Authorization header first (Bearer token)
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth_token='));
    if (authCookie) {
      return authCookie.split('=')[1];
    }
  }

  return null;
}


/**
 * Hash password using bcrypt with military-grade salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify password against hashed password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
