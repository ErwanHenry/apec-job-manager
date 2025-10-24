/**
 * Vercel Cron Job: Daily Report
 * Schedule: Daily at 8:00 AM (0 8 * * *)
 *
 * This endpoint generates and sends daily performance reports via email
 */

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

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
 * Generate daily report data
 */
async function generateDailyReport() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  // Get statistics for yesterday
  const [totalJobs, publishedJobs, newJobs, syncHistory] = await Promise.all([
    // Total jobs
    prisma.job.count(),

    // Published jobs
    prisma.job.count({
      where: { status: 'PUBLISHED' }
    }),

    // Jobs created yesterday
    prisma.job.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: todayStart,
        }
      }
    }),

    // Latest sync
    prisma.syncHistory.findFirst({
      where: {
        completedAt: {
          gte: yesterday,
        }
      },
      orderBy: {
        completedAt: 'desc',
      }
    }),
  ]);

  // Calculate total views and applications (last 24h)
  const recentJobs = await prisma.job.findMany({
    where: {
      updatedAt: {
        gte: yesterday,
      }
    },
    select: {
      views: true,
      applications: true,
    }
  });

  const totalViews = recentJobs.reduce((sum, job) => sum + job.views, 0);
  const totalApplications = recentJobs.reduce((sum, job) => sum + job.applications, 0);

  return {
    date: yesterday.toLocaleDateString('fr-FR'),
    totalJobs,
    publishedJobs,
    draftJobs: totalJobs - publishedJobs,
    newJobs,
    totalViews,
    totalApplications,
    conversionRate: totalViews > 0 ? ((totalApplications / totalViews) * 100).toFixed(2) : 0,
    lastSync: syncHistory ? {
      timestamp: syncHistory.completedAt.toLocaleString('fr-FR'),
      status: syncHistory.status,
      duration: syncHistory.duration,
      jobsCreated: syncHistory.jobsCreated,
      jobsUpdated: syncHistory.jobsUpdated,
    } : null,
  };
}

/**
 * Generate HTML email template
 */
function generateEmailHTML(reportData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; }
    .metric-card { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4F46E5; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
    .metric-value { font-size: 32px; font-weight: bold; color: #111827; margin: 5px 0; }
    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .status-success { background: #d1fae5; color: #065f46; }
    .status-failed { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Rapport Quotidien APEC</h1>
      <p>${reportData.date}</p>
    </div>

    <div class="content">
      <h2>Métriques Clés</h2>

      <div class="metric-card">
        <div class="metric-label">Total des Offres</div>
        <div class="metric-value">${reportData.totalJobs}</div>
        <small>${reportData.publishedJobs} publiées • ${reportData.draftJobs} brouillons</small>
      </div>

      <div class="metric-card">
        <div class="metric-label">Nouvelles Offres (24h)</div>
        <div class="metric-value">${reportData.newJobs}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Vues (24h)</div>
        <div class="metric-value">${reportData.totalViews}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Candidatures (24h)</div>
        <div class="metric-value">${reportData.totalApplications}</div>
        <small>Taux de conversion: ${reportData.conversionRate}%</small>
      </div>

      ${reportData.lastSync ? `
      <h2>Dernière Synchronisation</h2>
      <div class="metric-card">
        <div class="metric-label">Statut</div>
        <span class="status-badge ${reportData.lastSync.status === 'completed' ? 'status-success' : 'status-failed'}">
          ${reportData.lastSync.status === 'completed' ? '✓ Succès' : '✗ Échec'}
        </span>
        <p><small>${reportData.lastSync.timestamp}</small></p>
        <p>
          <strong>${reportData.lastSync.jobsCreated}</strong> créées •
          <strong>${reportData.lastSync.jobsUpdated}</strong> mises à jour •
          Durée: <strong>${(reportData.lastSync.duration / 1000).toFixed(1)}s</strong>
        </p>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>Généré automatiquement par APEC Job Manager</p>
      <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send email via SMTP
 */
async function sendEmail(reportData) {
  // Check if email is enabled
  if (process.env.REPORT_EMAIL_ENABLED !== 'true') {
    console.log('Email reporting is disabled');
    return { sent: false, reason: 'disabled' };
  }

  // Check SMTP configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP not configured, skipping email');
    return { sent: false, reason: 'not_configured' };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Send email
  const recipients = process.env.REPORT_EMAIL_RECIPIENTS || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `"APEC Job Manager" <${process.env.SMTP_USER}>`,
    to: recipients,
    subject: `📊 Rapport APEC - ${reportData.date}`,
    html: generateEmailHTML(reportData),
  });

  console.log('Email sent:', info.messageId);

  return {
    sent: true,
    messageId: info.messageId,
    recipients,
  };
}

/**
 * Save report to database
 */
async function saveReport(reportData) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return await prisma.report.create({
    data: {
      type: 'DAILY',
      period: reportData.date,
      startDate: yesterday,
      endDate: todayStart,
      data: reportData,
    },
  });
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAuthorization(req)) {
    console.warn('Unauthorized cron attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Generating daily report...');

    // Generate report
    const reportData = await generateDailyReport();

    // Save to database
    const savedReport = await saveReport(reportData);

    // Send email
    const emailResult = await sendEmail(reportData);

    console.log('Daily report generated successfully');

    res.status(200).json({
      success: true,
      report: reportData,
      saved: true,
      reportId: savedReport.id,
      email: emailResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Daily report error:', error);

    res.status(500).json({
      error: 'Report generation failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    await prisma.$disconnect();
  }
}
