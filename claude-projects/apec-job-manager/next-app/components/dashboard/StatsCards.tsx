import { Card } from '@/components/ui/Card'
import {
  BriefcaseIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  EyeIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

interface StatsCardsProps {
  totalJobs: number
  publishedJobs: number
  draftJobs: number
  totalViews: number
  totalApplications: number
}

const stats = (props: StatsCardsProps) => [
  {
    name: 'Total des annonces',
    value: props.totalJobs,
    icon: BriefcaseIcon,
    bgColor: 'bg-apec-blue',
    change: null,
  },
  {
    name: 'Annonces publiées',
    value: props.publishedJobs,
    icon: CheckCircleIcon,
    bgColor: 'bg-apec-green',
    change: null,
  },
  {
    name: 'Brouillons',
    value: props.draftJobs,
    icon: DocumentTextIcon,
    bgColor: 'bg-apec-orange',
    change: null,
  },
  {
    name: 'Vues totales',
    value: props.totalViews,
    icon: EyeIcon,
    bgColor: 'bg-purple-600',
    change: null,
  },
  {
    name: 'Candidatures',
    value: props.totalApplications,
    icon: UserGroupIcon,
    bgColor: 'bg-pink-600',
    change: null,
  },
]

export function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {stats(props).map((stat) => (
        <Card key={stat.name} hover className="overflow-hidden">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${stat.bgColor}`}>
              <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stat.value.toLocaleString()}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
