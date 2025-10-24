import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Job } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

interface RecentJobsProps {
  jobs: Job[]
}

const statusColors = {
  DRAFT: 'apec-badge-gray',
  PUBLISHED: 'apec-badge-green',
  PAUSED: 'apec-badge-orange',
  EXPIRED: 'apec-badge-red',
  DELETED: 'apec-badge-red',
}

const statusLabels = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  PAUSED: 'En pause',
  EXPIRED: 'Expiré',
  DELETED: 'Supprimé',
}

export function RecentJobs({ jobs }: RecentJobsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Annonces récentes</CardTitle>
          <Link
            href="/jobs"
            className="text-sm font-medium text-apec-blue hover:text-apec-blue-dark"
          >
            Voir tout
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucune annonce récente
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {job.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {job.location} • {job.contractType}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(job.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <span className={clsx('ml-2', statusColors[job.status])}>
                    {statusLabels[job.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
