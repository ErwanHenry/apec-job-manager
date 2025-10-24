const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class ReportService {
  /**
   * Generate daily report
   */
  async generateDailyReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.generateReport('DAILY', today, tomorrow);
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.generateReport('WEEKLY', weekAgo, today);
  }

  /**
   * Generate monthly report
   */
  async generateMonthlyReport() {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return this.generateReport('MONTHLY', monthAgo, today);
  }

  /**
   * Generate custom period report
   */
  async generateCustomReport(startDate, endDate) {
    return this.generateReport('CUSTOM', startDate, endDate);
  }

  /**
   * Core report generation logic
   */
  async generateReport(type, startDate, endDate) {
    try {
      logger.info(`Generating ${type} report from ${startDate} to ${endDate}`);

      const [
        jobsCreated,
        jobsUpdated,
        jobsDeleted,
        totalViews,
        totalApplications,
        syncHistory,
        topPerformingJobs
      ] = await Promise.all([
        prisma.job.count({
          where: {
            createdAt: { gte: startDate, lt: endDate }
          }
        }),
        prisma.job.count({
          where: {
            updatedAt: { gte: startDate, lt: endDate },
            createdAt: { lt: startDate }
          }
        }),
        prisma.job.count({
          where: {
            deletedAt: { gte: startDate, lt: endDate }
          }
        }),
        prisma.job.aggregate({
          where: {
            publishedAt: { gte: startDate, lt: endDate }
          },
          _sum: { views: true }
        }),
        prisma.job.aggregate({
          where: {
            publishedAt: { gte: startDate, lt: endDate }
          },
          _sum: { applications: true }
        }),
        prisma.syncHistory.findMany({
          where: {
            startedAt: { gte: startDate, lt: endDate }
          },
          orderBy: { startedAt: 'desc' }
        }),
        prisma.job.findMany({
          where: {
            publishedAt: { gte: startDate, lt: endDate }
          },
          orderBy: [
            { applications: 'desc' },
            { views: 'desc' }
          ],
          take: 10
        })
      ]);

      const reportData = {
        period: {
          type,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        summary: {
          jobsCreated,
          jobsUpdated,
          jobsDeleted,
          totalViews: totalViews._sum.views || 0,
          totalApplications: totalApplications._sum.applications || 0,
          avgViewsPerJob: jobsCreated > 0 ? Math.round((totalViews._sum.views || 0) / jobsCreated) : 0,
          avgApplicationsPerJob: jobsCreated > 0 ? Math.round((totalApplications._sum.applications || 0) / jobsCreated) : 0
        },
        syncHistory: {
          total: syncHistory.length,
          successful: syncHistory.filter(s => s.status === 'SUCCESS').length,
          failed: syncHistory.filter(s => s.status === 'FAILED').length
        },
        topPerformingJobs: topPerformingJobs.map(job => ({
          id: job.id,
          title: job.title,
          views: job.views,
          applications: job.applications,
          conversionRate: job.views > 0 ? ((job.applications / job.views) * 100).toFixed(2) : 0
        }))
      };

      // Save report to database
      const report = await prisma.report.create({
        data: {
          type,
          period: `${type.toLowerCase()}-${startDate.toISOString().split('T')[0]}`,
          startDate,
          endDate,
          data: reportData
        }
      });

      logger.info(`Report generated successfully: ${report.id}`);
      return report;
    } catch (error) {
      logger.error('Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Export report to file
   */
  async exportReport(report, format = 'pdf') {
    try {
      const exportDir = path.join(__dirname, '../../exports');
      await fs.mkdir(exportDir, { recursive: true });

      const filename = `report-${report.id}.${format}`;
      const filepath = path.join(exportDir, filename);

      if (format === 'json') {
        await fs.writeFile(filepath, JSON.stringify(report.data, null, 2));
      } else if (format === 'csv') {
        const csv = this.convertToCSV(report.data);
        await fs.writeFile(filepath, csv);
      } else if (format === 'pdf') {
        // Placeholder: implement PDF generation with libraries like pdfkit
        const content = `APEC Job Manager Report\n\nPeriod: ${report.period}\nGenerated: ${report.generatedAt}\n\n${JSON.stringify(report.data, null, 2)}`;
        await fs.writeFile(filepath, content);
      }

      // Update report with export info
      await prisma.report.update({
        where: { id: report.id },
        data: {
          exportedAt: new Date(),
          exportFormat: format
        }
      });

      logger.info(`Report exported: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error('Failed to export report:', error);
      throw error;
    }
  }

  /**
   * Convert report data to CSV
   */
  convertToCSV(data) {
    const rows = [
      ['Metric', 'Value'],
      ['Jobs Created', data.summary.jobsCreated],
      ['Jobs Updated', data.summary.jobsUpdated],
      ['Jobs Deleted', data.summary.jobsDeleted],
      ['Total Views', data.summary.totalViews],
      ['Total Applications', data.summary.totalApplications],
      ['Avg Views per Job', data.summary.avgViewsPerJob],
      ['Avg Applications per Job', data.summary.avgApplicationsPerJob]
    ];

    return rows.map(row => row.join(',')).join('\n');
  }
}

module.exports = new ReportService();
