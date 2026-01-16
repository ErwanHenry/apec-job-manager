/**
 * Authentication Library
 *
 * Provides cookie-based session management with test user credentials.
 * Users are validated against database records (populated by db:seed).
 *
 * MVP: Cookie sessions with SHA-256 passwords
 * Phase 2: Migrate to NextAuth + bcrypt hashing
 */

import { cookies } from 'next/headers';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import type { User } from '@/lib/db/schema';

/**
 * Session data stored in encrypted cookie
 */
interface SessionData {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION_HOURS = 24;

/**
 * Hash a password using SHA-256
 * MVP: Simple hashing
 * Phase 2: Use bcrypt
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Create an encrypted session cookie
 */
function createSessionCookie(user: User): string {
  const sessionData: SessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000,
  };

  // Base64 encode for MVP (not real encryption)
  // Phase 2: Use jose or crypto to encrypt with secret key
  return Buffer.from(JSON.stringify(sessionData)).toString('base64');
}

/**
 * Decode session from cookie
 */
function decodeSession(sessionString: string): SessionData | null {
  try {
    const json = Buffer.from(sessionString, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Login user with email and password
 * Returns user object if successful, error message otherwise
 */
export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Create session cookie
    const sessionCookie = createSessionCookie(user);

    // Set cookie (httpOnly for security)
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_HOURS * 60 * 60,
      path: '/',
    });

    return { success: true, user };
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

/**
 * Logout user by clearing session cookie
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get current user from session cookie
 * Returns null if no valid session
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return null;
    }

    // Decode session
    const session = decodeSession(sessionCookie.value);
    if (!session) {
      return null;
    }

    // Check expiration
    if (session.exp < Date.now()) {
      // Session expired, clear cookie
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Fetch full user from database
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

    return user || null;
  } catch (error) {
    console.error('[AUTH] Get current user error:', error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 * Optionally check for specific role
 */
export async function requireAuth(requiredRole?: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new Error('Forbidden');
  }

  return user;
}

/**
 * Check if user is authenticated (non-throwing version)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Test helper: Get test credentials
 * Used in login page to show available credentials
 */
export function getTestCredentials(): Array<{
  email: string;
  password: string;
  role: string;
  name: string;
}> {
  return [
    {
      email: 'jean.martin@cabinet-cardio.fr',
      password: 'prescriber1',
      role: 'prescriber',
      name: 'Dr. Jean Martin (Prescriber)',
    },
    {
      email: 'marie.dupont@cabinet-cardio.fr',
      password: 'prescriber2',
      role: 'prescriber',
      name: 'Dr. Marie Dupont (Prescriber)',
    },
    {
      email: 'pierre.bernard@pharmacie-marais.fr',
      password: 'pharmacist1',
      role: 'pharmacist',
      name: 'Pierre Bernard (Pharmacist)',
    },
    {
      email: 'sophie.lefebvre@pharmacie-marais.fr',
      password: 'pharmacist2',
      role: 'pharmacist',
      name: 'Sophie Lefebvre (Pharmacist)',
    },
  ];
}
