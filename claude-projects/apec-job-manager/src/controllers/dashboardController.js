const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalJobs,
      publishedJobs,
      draftJobs,
      totalViews,
      totalApplications,
      recentJobs,
      jobsLast30Days
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'PUBLISHED' } }),
      prisma.job.count({ where: { status: 'DRAFT' } }),
      prisma.job.aggregate({ _sum: { views: true } }),
      prisma.job.aggregate({ _sum: { applications: true } }),
      prisma.job.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.job.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          createdAt: true
        }
      })
    ]);

    // Calculate daily stats for the last 30 days
    const dailyStats = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = 0;
    }

    jobsLast30Days.forEach(job => {
      const dateKey = job.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateKey] !== undefined) {
        dailyStats[dateKey]++;
      }
    });

    res.json({
      status: 'success',
      data: {
        stats: {
          totalJobs,
          publishedJobs,
          draftJobs,
          totalViews: totalViews._sum.views || 0,
          totalApplications: totalApplications._sum.applications || 0,
          jobsLast30Days: recentJobs,
          avgViewsPerJob: totalJobs > 0 ? Math.round((totalViews._sum.views || 0) / totalJobs) : 0,
          avgApplicationsPerJob: totalJobs > 0 ? Math.round((totalApplications._sum.applications || 0) / totalJobs) : 0
        },
        dailyStats: Object.entries(dailyStats).map(([date, count]) => ({ date, count })).reverse()
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [recentJobs, recentSyncs, recentAudits] = await Promise.all([
      prisma.job.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.syncHistory.findMany({
        take: limit,
        orderBy: { startedAt: 'desc' }
      }),
      prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      status: 'success',
      data: {
        recentJobs,
        recentSyncs,
        recentAudits
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPerformance = async (req, res, next) => {
  try {
    const topJobs = await prisma.job.findMany({
      where: {
        status: 'PUBLISHED'
      },
      orderBy: [
        { applications: 'desc' },
        { views: 'desc' }
      ],
      take: 10,
      select: {
        id: true,
        title: true,
        views: true,
        applications: true,
        publishedAt: true
      }
    });

    const conversionRate = topJobs.reduce((acc, job) => {
      if (job.views > 0) {
        return acc + (job.applications / job.views);
      }
      return acc;
    }, 0) / topJobs.length;

    res.json({
      status: 'success',
      data: {
        topJobs,
        avgConversionRate: (conversionRate * 100).toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
};
