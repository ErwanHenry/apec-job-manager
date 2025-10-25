import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { ApecSyncService } from '@/lib/services/apecSyncService'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role for sync operations
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
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
    const session = await getServerSession(authOptions)
    if (!session) {
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
