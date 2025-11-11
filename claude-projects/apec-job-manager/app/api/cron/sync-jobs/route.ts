import { NextResponse } from 'next/server'
import { performApecSync } from '@/lib/services/jobSyncHelper'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * Vercel Cron Job - Automatic APEC Job Sync
 *
 * This endpoint is called automatically by Vercel Cron
 * Configuration in vercel.json: Runs daily at 2 AM (Hobby plan limitation)
 *
 * Note: Vercel Hobby accounts are limited to daily cron jobs only.
 * For more frequent syncs (every 6h, hourly, etc.), upgrade to Pro plan.
 *
 * Authentication: CRON_SECRET Bearer token (Vercel sets this automatically)
 * Method: GET
 * Usage: Automatic sync via Vercel Cron
 */
export async function GET(request: Request) {
  try {
    // Verify this is a cron request (only in production with CRON_SECRET set)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Only check authorization if CRON_SECRET is set (Vercel production)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Cron] Unauthorized request - missing or invalid CRON_SECRET')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Starting automatic APEC job sync...')

    // Perform the sync using shared helper
    const result = await performApecSync()

    console.log('[Cron] Sync completed:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Cron] Sync failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
