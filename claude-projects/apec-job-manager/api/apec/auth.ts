/**
 * APEC Authentication Test Endpoint
 *
 * Purpose: Test APEC authentication and cookie management
 *
 * Usage:
 *   POST /api/apec/auth
 *   Body: { forceRefresh: false }
 *
 * Returns:
 *   - Authentication status
 *   - Cookie source (KV_CACHE or FRESH_LOGIN)
 *   - Cookie age and expiry
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { apecService } from '../../lib/services/apecServiceServerless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const { forceRefresh = false } = req.body || {};

  try {
    console.log('[APEC:Auth] Starting authentication test');

    // Initialize browser
    await apecService.initialize();

    // Authenticate (with or without force refresh)
    await apecService.authenticate(forceRefresh);

    const duration = Date.now() - startTime;

    // Close browser
    await apecService.close();

    console.log(`[APEC:Auth] Authentication successful in ${duration}ms`);

    return res.status(200).json({
      success: true,
      data: {
        isAuthenticated: true,
        cookieSource: forceRefresh ? 'FRESH_LOGIN' : 'KV_CACHE',
        duration,
      },
      message: 'APEC authentication successful',
    });
  } catch (error) {
    console.error('[APEC:Auth] Authentication failed:', error);

    // Always close browser
    await apecService.close();

    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'APEC authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check APEC_EMAIL and APEC_PASSWORD environment variables',
      },
    });
  }
}
