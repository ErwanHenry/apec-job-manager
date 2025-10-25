import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalJobs,
      publishedJobs,
      draftJobs,
      pausedJobs,
      expiredJobs,
      totalViews,
      totalApplications,
      recentJobs,
      syncHistory,
    ] = await Promise.all([
      prisma.job.count({ where: { deletedAt: null } }),
      prisma.job.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      prisma.job.count({ where: { status: 'DRAFT', deletedAt: null } }),
      prisma.job.count({ where: { status: 'PAUSED', deletedAt: null } }),
      prisma.job.count({ where: { status: 'EXPIRED', deletedAt: null } }),
      prisma.job.aggregate({ _sum: { views: true }, where: { deletedAt: null } }),
      prisma.job.aggregate({ _sum: { applications: true }, where: { deletedAt: null } }),
      prisma.job.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.syncHistory.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({
      stats: {
        totalJobs,
        publishedJobs,
        draftJobs,
        pausedJobs,
        expiredJobs,
        totalViews: totalViews._sum.views || 0,
        totalApplications: totalApplications._sum.applications || 0,
      },
      recentJobs,
      syncHistory,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
