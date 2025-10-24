/**
 * Vercel Cron Job: Auto-sync with APEC
 * Schedule: Every 6 hours (0 */6 * * *)
 *
 * This endpoint is called automatically by Vercel Cron
 * Documentation: https://vercel.com/docs/cron-jobs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verify that the request comes from Vercel Cron
 */
function verifyAuthorization(req) {
  // Vercel Cron sets a special authorization header
  const authHeader = req.headers.authorization;

  if (process.env.CRON_SECRET) {
    // Custom secret verification
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }

  // In production on Vercel, trust the Vercel Cron header
  if (process.env.VERCEL === '1') {
    return req.headers['x-vercel-cron'] === '1';
  }

  // Development mode - allow all requests
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

/**
 * Main sync function
 */
async function syncWithApec() {
  const startTime = Date.now();

  try {
    console.log('Starting APEC sync...');

    // TODO: Replace with actual APEC API integration
    // For now, this is a placeholder that simulates the sync

    const syncResult = {
      jobsCreated: 0,
      jobsUpdated: 0,
      jobsDeleted: 0,
      jobsUnchanged: 0,
      errors: [],
    };

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Record sync in history
    const duration = Date.now() - startTime;

    await prisma.syncHistory.create({
      data: {
        syncType: 'auto',
        status: 'completed',
        jobsCreated: syncResult.jobsCreated,
        jobsUpdated: syncResult.jobsUpdated,
        jobsDeleted: syncResult.jobsDeleted,
        jobsUnchanged: syncResult.jobsUnchanged,
        errors: syncResult.errors,
        completedAt: new Date(),
        duration,
      },
    });

    console.log('APEC sync completed:', syncResult);

    return {
      success: true,
      ...syncResult,
      duration,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('APEC sync failed:', error);

    // Record failed sync
    await prisma.syncHistory.create({
      data: {
        syncType: 'auto',
        status: 'failed',
        jobsCreated: 0,
        jobsUpdated: 0,
        jobsDeleted: 0,
        jobsUnchanged: 0,
        errors: [error.message],
        completedAt: new Date(),
        duration: Date.now() - startTime,
      },
    });

    throw error;
  }
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authorization
  if (!verifyAuthorization(req)) {
    console.warn('Unauthorized cron attempt from:', req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await syncWithApec();

    res.status(200).json({
      message: 'Sync completed successfully',
      ...result,
    });

  } catch (error) {
    console.error('Cron sync error:', error);

    res.status(500).json({
      error: 'Sync failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    await prisma.$disconnect();
  }
}
