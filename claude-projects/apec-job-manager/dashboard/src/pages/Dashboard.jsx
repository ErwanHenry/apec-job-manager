import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BriefcaseIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const StatCard = ({ title, value, icon: Icon, change, changeType }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 text-apec-blue" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {change && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {changeType === 'increase' ? '+' : '-'}{change}%
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats')
      setStats(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Tableau de bord</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total des annonces"
          value={stats?.stats.totalJobs || 0}
          icon={BriefcaseIcon}
        />
        <StatCard
          title="Annonces publiées"
          value={stats?.stats.publishedJobs || 0}
          icon={DocumentTextIcon}
        />
        <StatCard
          title="Vues totales"
          value={stats?.stats.totalViews || 0}
          icon={EyeIcon}
        />
        <StatCard
          title="Candidatures"
          value={stats?.stats.totalApplications || 0}
          icon={ArrowTrendingUpIcon}
        />
      </div>

      {/* Chart */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Évolution des annonces (30 derniers jours)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats?.dailyStats || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#0051A5"
              strokeWidth={2}
              name="Annonces créées"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Métriques clés</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Vues moyennes par annonce</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {stats?.stats.avgViewsPerJob || 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Candidatures moyennes par annonce</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {stats?.stats.avgApplicationsPerJob || 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Annonces ce mois-ci</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {stats?.stats.jobsLast30Days || 0}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">État des annonces</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Publiées</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        stats?.stats.totalJobs > 0
                          ? (stats?.stats.publishedJobs / stats?.stats.totalJobs) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {stats?.stats.publishedJobs || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Brouillons</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{
                      width: `${
                        stats?.stats.totalJobs > 0
                          ? (stats?.stats.draftJobs / stats?.stats.totalJobs) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {stats?.stats.draftJobs || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
