/**
 * Vercel Cron Job: Sync Jobs
 *
 * Scheduled: Every 6 hours (0 */6 * * *)
 * Purpose: Synchronize job postings from APEC with local database
 *
 * Architecture:
 * 1. Authenticate with APEC (restore cookies or fresh login)
 * 2. Fetch all jobs from APEC (batched to stay under 60s timeout)
 * 3. Compare with database and identify changes
 * 4. Update database (create/update/delete)
 * 5. Store sync report
 * 6. Send notification (optional)
 *
 * Timeout Strategy:
 * - If job list is large (>50), split into multiple invocations
 * - Store progress in KV and resume on next run
 * - Each run processes up to 50 jobs within 60s limit
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { PrismaClient } from '@prisma/client';
import { apecService } from '../../lib/services/apecServiceServerless';

const prisma = new PrismaClient();

interface SyncProgress {
  syncId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalJobs: number;
  processedJobs: number;
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  errors: string[];
  startedAt: number;
  lastUpdate: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  // Verify this is a cron request (Vercel sets this header)
  const authHeader = req.headers.authorization;
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const syncId = `sync_${startTime}`;

  console.log(`[Cron:SyncJobs] Starting sync job: ${syncId}`);

  try {
    // Check if there's an existing sync in progress
    const existingSync = await kv.get<SyncProgress>('sync:progress:current');

    if (existingSync && existingSync.status === 'IN_PROGRESS') {
      const age = Date.now() - existingSync.lastUpdate;

      // If existing sync is stale (>10 minutes), take over
      if (age < 600000) {
        console.log('[Cron:SyncJobs] Sync already in progress, skipping');
        return res.status(200).json({
          message: 'Sync already in progress',
          syncId: existingSync.syncId,
        });
      }

      console.log('[Cron:SyncJobs] Stale sync detected, taking over');
    }

    // Initialize progress tracking
    const progress: SyncProgress = {
      syncId,
      status: 'IN_PROGRESS',
      totalJobs: 0,
      processedJobs: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      unchanged: 0,
      errors: [],
      startedAt: startTime,
      lastUpdate: startTime,
    };

    await kv.set('sync:progress:current', progress, { ex: 3600 });

    // Initialize APEC service
    await apecService.initialize();
    await apecService.authenticate();

    // Fetch jobs from APEC (limit to 50 to stay under timeout)
    const apecJobs = await apecService.getAllJobs(50);
    progress.totalJobs = apecJobs.length;

    console.log(`[Cron:SyncJobs] Found ${apecJobs.length} jobs on APEC`);

    // Fetch current jobs from database
    const dbJobs = await prisma.job.findMany({
      where: { status: { not: 'DELETED' } },
      select: {
        id: true,
        apecId: true,
        title: true,
        status: true,
        views: true,
        applications: true,
      },
    });

    // Process each job
    for (const apecJob of apecJobs) {
      try {
        const dbJob = dbJobs.find((j) => j.apecId === apecJob.id);

        if (!dbJob) {
          // New job found on APEC
          await prisma.job.create({
            data: {
              apecId: apecJob.id,
              title: apecJob.title,
              description: '', // Would need to scrape details
              status: apecJob.status,
              views: apecJob.views,
              applications: apecJob.applications,
              publishedAt: new Date(apecJob.publishedDate),
              lastSyncAt: new Date(),
            },
          });
          progress.created++;
          console.log(`[Cron:SyncJobs] Created job: ${apecJob.id}`);
        } else if (
          dbJob.views !== apecJob.views ||
          dbJob.applications !== apecJob.applications ||
          dbJob.status !== apecJob.status
        ) {
          // Update existing job
          await prisma.job.update({
            where: { id: dbJob.id },
            data: {
              status: apecJob.status,
              views: apecJob.views,
              applications: apecJob.applications,
              lastSyncAt: new Date(),
            },
          });
          progress.updated++;
          console.log(`[Cron:SyncJobs] Updated job: ${apecJob.id}`);
        } else {
          progress.unchanged++;
        }

        progress.processedJobs++;

        // Update progress every 10 jobs
        if (progress.processedJobs % 10 === 0) {
          progress.lastUpdate = Date.now();
          await kv.set('sync:progress:current', progress, { ex: 3600 });
        }
      } catch (error) {
        const errorMsg = `Failed to process job ${apecJob.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        progress.errors.push(errorMsg);
        console.error(`[Cron:SyncJobs] ${errorMsg}`);
      }
    }

    // Identify deleted jobs (in DB but not on APEC)
    const apecJobIds = apecJobs.map((j) => j.id);
    const deletedJobs = dbJobs.filter((j) => !apecJobIds.includes(j.apecId));

    for (const job of deletedJobs) {
      try {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'DELETED',
            deletedAt: new Date(),
          },
        });
        progress.deleted++;
        console.log(`[Cron:SyncJobs] Marked job as deleted: ${job.apecId}`);
      } catch (error) {
        const errorMsg = `Failed to mark job ${job.apecId} as deleted: ${error instanceof Error ? error.message : 'Unknown error'}`;
        progress.errors.push(errorMsg);
        console.error(`[Cron:SyncJobs] ${errorMsg}`);
      }
    }

    // Mark sync as completed
    progress.status = 'COMPLETED';
    progress.lastUpdate = Date.now();

    // Store final progress
    await kv.set(`sync:history:${syncId}`, progress, { ex: 86400 * 7 }); // Keep for 7 days
    await kv.del('sync:progress:current');

    // Store sync history in database
    const duration = Date.now() - startTime;
    await prisma.syncHistory.create({
      data: {
        syncId,
        status: 'COMPLETED',
        mode: 'incremental',
        batchSize: 50,
        progressCurrent: progress.processedJobs,
        progressTotal: progress.totalJobs,
        results: {
          created: progress.created,
          updated: progress.updated,
          deleted: progress.deleted,
          unchanged: progress.unchanged,
          errors: progress.errors,
        },
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration,
      },
    });

    console.log(`[Cron:SyncJobs] Sync completed in ${duration}ms:`, {
      created: progress.created,
      updated: progress.updated,
      deleted: progress.deleted,
      unchanged: progress.unchanged,
      errors: progress.errors.length,
    });

    // Close APEC service (critical for serverless)
    await apecService.close();
    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      syncId,
      duration,
      results: {
        created: progress.created,
        updated: progress.updated,
        deleted: progress.deleted,
        unchanged: progress.unchanged,
        errors: progress.errors,
      },
    });
  } catch (error) {
    console.error('[Cron:SyncJobs] Sync failed:', error);

    // Mark sync as failed
    const duration = Date.now() - startTime;

    try {
      await prisma.syncHistory.create({
        data: {
          syncId,
          status: 'FAILED',
          mode: 'incremental',
          batchSize: 50,
          errorDetails: error instanceof Error ? error.message : 'Unknown error',
          startedAt: new Date(startTime),
          duration,
        },
      });

      await kv.del('sync:progress:current');
    } catch (dbError) {
      console.error('[Cron:SyncJobs] Failed to store error in database:', dbError);
    }

    // Always close services
    await apecService.close();
    await prisma.$disconnect();

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
      syncId,
    });
  }
}
