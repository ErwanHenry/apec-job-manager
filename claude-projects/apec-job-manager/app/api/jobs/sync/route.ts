import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { performApecSync } from '@/lib/services/jobSyncHelper'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * Manual APEC Job Sync - Dashboard Button
 *
 * This endpoint is called when users click the "Synchroniser APEC" button
 * in the dashboard. It requires authentication via NextAuth session.
 *
 * Authentication: NextAuth session (user must be logged in)
 * Method: POST
 * Usage: Dashboard "Synchroniser APEC" button
 */
export async function POST() {
  try {
    // Check authentication - user must be logged in
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log('[Manual Sync] Unauthorized - no session')
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      )
    }

    console.log(`[Manual Sync] User ${session.user?.email} triggered manual sync`)

    // Perform the sync using shared helper
    const result = await performApecSync()

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Manual Sync] Error:', error)

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
