import { StatsCards } from '@/components/dashboard/StatsCards'
import { RecentJobs } from '@/components/dashboard/RecentJobs'
import { SyncHistory } from '@/components/dashboard/SyncHistory'
import { SyncButton } from '@/components/dashboard/SyncButton'
import { prisma } from '@/lib/db/prisma'

async function getDashboardStats() {
  const [totalJobs, publishedJobs, draftJobs, totalViews, totalApplications] = await Promise.all([
    prisma.job.count({ where: { deletedAt: null } }),
    prisma.job.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
    prisma.job.count({ where: { status: 'DRAFT', deletedAt: null } }),
    prisma.job.aggregate({ _sum: { views: true }, where: { deletedAt: null } }),
    prisma.job.aggregate({ _sum: { applications: true }, where: { deletedAt: null } }),
  ])

  const recentJobs = await prisma.job.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const syncHistory = await prisma.syncHistory.findMany({
    orderBy: { startedAt: 'desc' },
    take: 10,
  })

  return {
    totalJobs,
    publishedJobs,
    draftJobs,
    totalViews: totalViews._sum.views || 0,
    totalApplications: totalApplications._sum.applications || 0,
    recentJobs,
    syncHistory,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-600">
            Vue d'ensemble de vos annonces APEC
          </p>
        </div>
        <div>
          <SyncButton />
        </div>
      </div>

      <StatsCards
        totalJobs={stats.totalJobs}
        publishedJobs={stats.publishedJobs}
        draftJobs={stats.draftJobs}
        totalViews={stats.totalViews}
        totalApplications={stats.totalApplications}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentJobs jobs={stats.recentJobs} />
        <SyncHistory history={stats.syncHistory} />
      </div>
    </div>
  )
}

export const revalidate = 60 // Revalidate every 60 seconds
