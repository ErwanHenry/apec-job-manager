import { NextResponse } from 'next/server'
import { getAuthUser, requireAuth } from '@/lib/auth/jwt'
import { ApecSyncService } from '@/lib/services/apecSyncService'

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()

    // Require ADMIN or SUPER_ADMIN role
    try {
      requireAuth(user, ['ADMIN', 'SUPER_ADMIN'])
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status: error instanceof Error && error.message === 'Insufficient permissions' ? 403 : 401 }
      )
    }

    const { type = 'full' } = await request.json()

    const syncService = new ApecSyncService()
    const result = await syncService.syncJobs(type)

    return NextResponse.json({
      success: true,
      message: 'Synchronisation terminée',
      data: result,
    })
  } catch (error) {
    console.error('Error syncing jobs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la synchronisation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/jobs/sync - Get sync status
export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const syncService = new ApecSyncService()
    const status = await syncService.getSyncStatus()

    return NextResponse.json({ data: status })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
