/**
 * Shared APEC Job Sync Helper
 *
 * This helper contains the core sync logic used by both:
 * - Manual sync (via dashboard button with NextAuth)
 * - Automatic sync (via Vercel Cron with CRON_SECRET)
 */

import { apecService } from '@/lib/services/apecServicePlaywright'
import { prisma } from '@/lib/db/prisma'
import { JobStatus } from '@/lib/types'

interface SyncResult {
  success: boolean
  timestamp: string
  duration: string
  stats: {
    fetched: number
    new: number
    updated: number
    unchanged: number
  }
  error?: string
}

/**
 * Perform APEC job synchronization
 * @returns Sync result with stats
 */
export async function performApecSync(): Promise<SyncResult> {
  const startTime = Date.now()

  try {
    console.log('[JobSyncHelper] Starting APEC job sync...')

    // Initialize browser and authenticate
    await apecService.initialize()
    console.log('[JobSyncHelper] Browser initialized')

    await apecService.authenticate()
    console.log('[JobSyncHelper] Authentication successful')

    // Fetch jobs from APEC
    const apecJobs = await apecService.getAllJobs(100)
    console.log(`[JobSyncHelper] Fetched ${apecJobs.length} jobs from APEC`)

    // Close browser immediately after scraping
    await apecService.close()
    console.log('[JobSyncHelper] Browser closed')

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
                status: apecJob.status.toUpperCase() as JobStatus,
                views: apecJob.views,
                applications: apecJob.applications,
                updatedAt: new Date(),
              },
            })
            updatedJobs++
            console.log(`[JobSyncHelper] Updated job: ${apecJob.title}`)
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
              status: apecJob.status.toUpperCase() as JobStatus,
              views: apecJob.views,
              applications: apecJob.applications,
              publishedAt: new Date(apecJob.publishedDate),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })
          newJobs++
          console.log(`[JobSyncHelper] Created new job: ${apecJob.title}`)
        }
      } catch (error) {
        console.error(`[JobSyncHelper] Error syncing job ${apecJob.id}:`, error)
      }
    }

    const duration = Date.now() - startTime
    const result: SyncResult = {
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

    console.log('[JobSyncHelper] Sync completed:', result)

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[JobSyncHelper] Sync failed:', error)

    // Always close browser on error
    try {
      await apecService.close()
    } catch (closeError) {
      console.error('[JobSyncHelper] Failed to close browser:', closeError)
    }

    return {
      success: false,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      stats: {
        fetched: 0,
        new: 0,
        updated: 0,
        unchanged: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
