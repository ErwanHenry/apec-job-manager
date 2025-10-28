import { NextResponse } from 'next/server'
import { apecService } from '@/lib/services/apecServicePlaywright'
import { prisma } from '@/lib/db/prisma'

/**
 * Vercel Cron Job - Automatic APEC Job Sync
 *
 * This endpoint is called automatically by Vercel Cron
 * Configuration in vercel.json
 *
 * Can also be triggered manually via:
 * curl -X GET https://your-domain.vercel.app/api/cron/sync-jobs
 */
export async function GET(request: Request) {
  const startTime = Date.now()

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

    // Initialize browser and authenticate
    await apecService.initialize()
    console.log('[Cron] Browser initialized')

    await apecService.authenticate()
    console.log('[Cron] Authentication successful')

    // Fetch jobs from APEC
    const apecJobs = await apecService.getAllJobs(100)
    console.log(`[Cron] Fetched ${apecJobs.length} jobs from APEC`)

    // Close browser immediately after scraping
    await apecService.close()
    console.log('[Cron] Browser closed')

    // Sync jobs to database
    let newJobs = 0
    let updatedJobs = 0
    let unchangedJobs = 0

    for (const apecJob of apecJobs) {
      try {
        // Check if job already exists
        const existingJob = await prisma.job.findUnique({
          where: { apecId: apecJob.id },
        })

        if (existingJob) {
          // Update existing job
          const hasChanges =
            existingJob.title !== apecJob.title ||
            existingJob.status !== apecJob.status.toUpperCase() ||
            existingJob.views !== apecJob.views ||
            existingJob.applications !== apecJob.applications

          if (hasChanges) {
            await prisma.job.update({
              where: { apecId: apecJob.id },
              data: {
                title: apecJob.title,
                status: apecJob.status.toUpperCase(),
                views: apecJob.views,
                applications: apecJob.applications,
                updatedAt: new Date(),
              },
            })
            updatedJobs++
            console.log(`[Cron] Updated job: ${apecJob.title}`)
          } else {
            unchangedJobs++
          }
        } else {
          // Create new job
          await prisma.job.create({
            data: {
              apecId: apecJob.id,
              title: apecJob.title,
              description: `Auto-imported from APEC on ${new Date().toLocaleDateString('fr-FR')}`,
              status: apecJob.status.toUpperCase(),
              views: apecJob.views,
              applications: apecJob.applications,
              publishedAt: new Date(apecJob.publishedDate),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })
          newJobs++
          console.log(`[Cron] Created new job: ${apecJob.title}`)
        }
      } catch (error) {
        console.error(`[Cron] Error syncing job ${apecJob.id}:`, error)
      }
    }

    const duration = Date.now() - startTime
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      stats: {
        fetched: apecJobs.length,
        new: newJobs,
        updated: updatedJobs,
        unchanged: unchangedJobs,
      },
    }

    console.log('[Cron] Sync completed:', summary)

    return NextResponse.json(summary)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[Cron] Sync failed:', error)

    // Always close browser on error
    try {
      await apecService.close()
    } catch (closeError) {
      console.error('[Cron] Failed to close browser:', closeError)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
