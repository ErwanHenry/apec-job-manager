import { prisma } from '@/lib/db/prisma'
import { Job, JobStatus } from '@prisma/client'
import { apecService } from './apecServicePlaywright'

interface SyncResult {
  success: boolean
  stats: {
    created: number
    updated: number
    deleted: number
    unchanged: number
    errors: string[]
  }
  duration: number
}

export class ApecSyncService {
  async syncJobs(type: 'full' | 'incremental' = 'full'): Promise<SyncResult> {
    const startTime = Date.now()
    const stats = {
      created: 0,
      updated: 0,
      deleted: 0,
      unchanged: 0,
      errors: [] as string[],
    }

    // Create sync history record
    const syncHistory = await prisma.syncHistory.create({
      data: {
        syncType: type,
        status: 'pending',
        startedAt: new Date(),
      },
    })

    try {
      // Initialize and authenticate with APEC
      console.log('[ApecSyncService] Initializing APEC service...')
      await apecService.initialize()
      await apecService.authenticate()

      // Scrape jobs from APEC
      console.log('[ApecSyncService] Fetching jobs from APEC...')
      const apecJobs = await apecService.getAllJobs(100) // Fetch up to 100 jobs

      // Convert APEC jobs to our format
      const jobs = apecJobs.map(apecJob => ({
        apecId: apecJob.id,
        title: apecJob.title,
        description: `Status: ${apecJob.status}`,
        location: null,
        contractType: null,
        salary: null,
        status: apecJob.status === 'published' ? JobStatus.PUBLISHED : JobStatus.DRAFT,
        views: apecJob.views,
        applications: apecJob.applications,
        publishedAt: apecJob.publishedDate ? new Date(apecJob.publishedDate) : null,
      }))

      console.log(`[ApecSyncService] Found ${jobs.length} jobs on APEC`)

      // Process each job
      for (const jobData of jobs) {
        try {
          const existingJob = await prisma.job.findUnique({
            where: { apecId: jobData.apecId },
          })

          if (existingJob) {
            // Check if job needs update
            const needsUpdate = this.jobNeedsUpdate(existingJob, jobData)
            if (needsUpdate) {
              await prisma.job.update({
                where: { id: existingJob.id },
                data: {
                  ...jobData,
                  lastSyncAt: new Date(),
                },
              })
              stats.updated++
            } else {
              stats.unchanged++
            }
          } else {
            // Create new job
            await prisma.job.create({
              data: {
                ...jobData,
                lastSyncAt: new Date(),
              },
            })
            stats.created++
          }
        } catch (error) {
          console.error(`Error processing job ${jobData.apecId}:`, error)
          stats.errors.push(`Job ${jobData.apecId}: ${error}`)
        }
      }

      const duration = Date.now() - startTime

      // Update sync history
      await prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: 'success',
          jobsCreated: stats.created,
          jobsUpdated: stats.updated,
          jobsDeleted: stats.deleted,
          jobsUnchanged: stats.unchanged,
          errors: stats.errors,
          completedAt: new Date(),
          duration,
        },
      })

      return {
        success: true,
        stats,
        duration,
      }
    } catch (error) {
      console.error('Sync error:', error)
      const duration = Date.now() - startTime

      // Update sync history with error
      await prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: 'error',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          completedAt: new Date(),
          duration,
        },
      })

      throw error
    } finally {
      // Always close the browser
      await apecService.close()
    }
  }


  private jobNeedsUpdate(existing: Job, newData: any): boolean {
    return (
      existing.title !== newData.title ||
      existing.description !== newData.description ||
      existing.location !== newData.location ||
      existing.contractType !== newData.contractType ||
      existing.salary !== newData.salary
    )
  }

  async getSyncStatus() {
    const lastSync = await prisma.syncHistory.findFirst({
      orderBy: { startedAt: 'desc' },
    })

    const isAutoSyncEnabled = process.env.AUTO_SYNC_ENABLED === 'true'
    const cronSchedule = process.env.SYNC_CRON_SCHEDULE || '0 */6 * * *'

    return {
      lastSync,
      autoSyncEnabled: isAutoSyncEnabled,
      cronSchedule,
    }
  }
}
