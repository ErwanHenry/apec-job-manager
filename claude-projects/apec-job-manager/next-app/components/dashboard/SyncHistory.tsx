import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { SyncHistory as SyncHistoryType } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface SyncHistoryProps {
  history: SyncHistoryType[]
}

const statusIcons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  pending: ClockIcon,
}

const statusColors = {
  success: 'text-apec-green',
  error: 'text-apec-red',
  pending: 'text-apec-orange',
}

export function SyncHistory({ history }: SyncHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique de synchronisation</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucune synchronisation récente
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((sync) => {
              const Icon = statusIcons[sync.status as keyof typeof statusIcons] || ClockIcon
              return (
                <div
                  key={sync.id}
                  className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg"
                >
                  <Icon
                    className={clsx(
                      'h-5 w-5 flex-shrink-0 mt-0.5',
                      statusColors[sync.status as keyof typeof statusColors] || 'text-gray-400'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {sync.syncType}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Créées: {sync.jobsCreated} • Mises à jour: {sync.jobsUpdated} • Supprimées: {sync.jobsDeleted}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(sync.startedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                      {sync.duration && ` • ${(sync.duration / 1000).toFixed(1)}s`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
