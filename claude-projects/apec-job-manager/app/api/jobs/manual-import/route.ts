import { NextRequest, NextResponse } from 'next/server'
import { apecSyncService } from '@/lib/services/apecSyncService'

/**
 * Manual Import Endpoint
 * Receives job data from browser bookmarklet
 * POST /api/jobs/manual-import
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Manual Import] Receiving job data from bookmarklet...')

    // Parse the request body
    const body = await request.json()
    const { jobs } = body

    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: jobs array is required',
        },
        { status: 400 }
      )
    }

    if (jobs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No jobs provided',
        },
        { status: 400 }
      )
    }

    console.log(`[Manual Import] Received ${jobs.length} jobs`)

    // Use the same sync service to process jobs
    const result = await apecSyncService.syncJobs(jobs)

    console.log('[Manual Import] Sync completed:', {
      created: result.created,
      updated: result.updated,
      unchanged: result.unchanged,
      errors: result.errors,
    })

    return NextResponse.json({
      success: true,
      message: 'Jobs imported successfully',
      created: result.created,
      updated: result.updated,
      unchanged: result.unchanged,
      errors: result.errors,
      total: jobs.length,
    })
  } catch (error) {
    console.error('[Manual Import] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
