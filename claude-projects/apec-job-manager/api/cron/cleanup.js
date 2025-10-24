/**
 * Vercel Cron Job: Database Cleanup
 * Schedule: Daily at 2:00 AM (0 2 * * *)
 *
 * This endpoint cleans up old data to maintain database health
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verify authorization
 */
function verifyAuthorization(req) {
  const authHeader = req.headers.authorization;

  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }

  if (process.env.VERCEL === '1') {
    return req.headers['x-vercel-cron'] === '1';
  }

  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

/**
 * Cleanup old sync history (>90 days)
 */
async function cleanupSyncHistory(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.syncHistory.deleteMany({
    where: {
      completedAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`Deleted ${result.count} old sync history records (>${daysToKeep} days)`);
  return result.count;
}

/**
 * Cleanup old reports (>180 days)
 */
async function cleanupOldReports(daysToKeep = 180) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.report.deleteMany({
    where: {
      generatedAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`Deleted ${result.count} old reports (>${daysToKeep} days)`);
  return result.count;
}

/**
 * Cleanup old audit logs (>365 days)
 */
async function cleanupAuditLogs(daysToKeep = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`Deleted ${result.count} old audit logs (>${daysToKeep} days)`);
  return result.count;
}

/**
 * Cleanup soft-deleted jobs (>30 days)
 */
async function cleanupDeletedJobs(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.job.deleteMany({
    where: {
      status: 'DELETED',
      deletedAt: {
        not: null,
        lt: cutoffDate,
      },
    },
  });

  console.log(`Permanently deleted ${result.count} soft-deleted jobs (>${daysToKeep} days)`);
  return result.count;
}

/**
 * Archive old expired jobs
 */
async function archiveExpiredJobs() {
  const now = new Date();

  // Update expired jobs that are still marked as PUBLISHED
  const result = await prisma.job.updateMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        not: null,
        // Jobs published more than 60 days ago
        lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  console.log(`Archived ${result.count} expired jobs`);
  return result.count;
}

/**
 * Analyze database and vacuum (PostgreSQL specific)
 */
async function optimizeDatabase() {
  try {
    // Get table sizes
    const result = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;

    console.log('Database table sizes:', result);

    // Note: VACUUM cannot be run inside a transaction
    // Vercel Postgres may have restrictions on VACUUM
    // This is informational only

    return result;
  } catch (error) {
    console.warn('Could not optimize database:', error.message);
    return null;
  }
}

/**
 * Generate cleanup summary
 */
function generateCleanupSummary(results) {
  const totalDeleted = Object.values(results).reduce((sum, val) =>
    typeof val === 'number' ? sum + val : sum, 0
  );

  return {
    totalRecordsDeleted: totalDeleted,
    breakdown: {
      syncHistory: results.syncHistory || 0,
      reports: results.reports || 0,
      auditLogs: results.auditLogs || 0,
      deletedJobs: results.deletedJobs || 0,
      expiredJobs: results.expiredJobs || 0,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create audit log for cleanup
 */
async function logCleanup(summary) {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'database_cleanup',
        entity: 'system',
        changes: summary,
        ipAddress: 'vercel-cron',
        userAgent: 'vercel-cron-job',
      },
    });
  } catch (error) {
    console.warn('Could not create cleanup audit log:', error.message);
  }
}

/**
 * Main cleanup function
 */
async function performCleanup() {
  const startTime = Date.now();
  const results = {};

  console.log('Starting database cleanup...');

  try {
    // Run cleanup tasks in parallel
    [
      results.syncHistory,
      results.reports,
      results.auditLogs,
      results.deletedJobs,
      results.expiredJobs,
    ] = await Promise.all([
      cleanupSyncHistory(90),
      cleanupOldReports(180),
      cleanupAuditLogs(365),
      cleanupDeletedJobs(30),
      archiveExpiredJobs(),
    ]);

    // Optimize database (sequential)
    results.optimization = await optimizeDatabase();

    // Generate summary
    const summary = generateCleanupSummary(results);
    summary.duration = Date.now() - startTime;

    // Log the cleanup
    await logCleanup(summary);

    console.log('Database cleanup completed:', summary);

    return summary;

  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAuthorization(req)) {
    console.warn('Unauthorized cleanup attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const summary = await performCleanup();

    res.status(200).json({
      success: true,
      message: 'Database cleanup completed',
      ...summary,
    });

  } catch (error) {
    console.error('Cleanup error:', error);

    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    await prisma.$disconnect();
  }
}
