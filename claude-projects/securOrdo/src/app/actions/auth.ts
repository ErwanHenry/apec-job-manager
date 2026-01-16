/**
 * Auth Server Actions
 *
 * 'use server' - Runs on server only
 * Handles login/logout with redirects
 */

'use server';

import { login as authLogin, logout as authLogout } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Login action - validates credentials and sets session cookie
 * Redirects to dashboard based on user role
 */
export async function loginAction(email: string, password: string) {
  const result = await authLogin(email, password);

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Login failed',
    };
  }

  // Redirect based on role
  if (result.user?.role === 'prescriber') {
    redirect('/prescriber');
  } else if (result.user?.role === 'pharmacist') {
    redirect('/pharmacist');
  } else if (result.user?.role === 'admin') {
    redirect('/admin');
  }

  // Fallback (shouldn't reach here)
  return {
    success: false,
    error: 'Unknown role',
  };
}

/**
 * Logout action - clears session cookie and redirects to login
 */
export async function logoutAction() {
  await authLogout();
  redirect('/login');
}
