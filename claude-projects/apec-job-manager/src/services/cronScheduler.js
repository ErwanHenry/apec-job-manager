const cron = require('node-cron');
const apecService = require('./apecService');
const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CronScheduler {
  constructor() {
    this.tasks = [];
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    // Auto-sync jobs every 6 hours
    const syncTask = cron.schedule(process.env.AUTO_SYNC_CRON || '0 */6 * * *', async () => {
      logger.info('Starting automatic job synchronization...');
      try {
        const syncReport = await apecService.syncJobs();

        // Save sync history
        await prisma.syncHistory.create({
          data: {
            syncType: 'AUTOMATIC',
            status: 'SUCCESS',
            jobsCreated: syncReport.created,
            jobsUpdated: syncReport.updated,
            jobsDeleted: syncReport.deleted,
            jobsUnchanged: syncReport.unchanged,
            errors: syncReport.errors,
            completedAt: new Date()
          }
        });

        logger.info('Automatic synchronization completed successfully');
      } catch (error) {
        logger.error('Automatic synchronization failed:', error);

        await prisma.syncHistory.create({
          data: {
            syncType: 'AUTOMATIC',
            status: 'FAILED',
            errors: [error.message],
            completedAt: new Date()
          }
        });
      }
    });

    this.tasks.push(syncTask);
    logger.info('Cron scheduler started');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    this.tasks.forEach(task => task.stop());
    logger.info('Cron scheduler stopped');
  }
}

module.exports = new CronScheduler();
