'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  FileText, 
  Calendar, 
  Eye, 
  TrendingUp, 
  MessageCircle,
  Download,
  Settings,
  BarChart3,
  Activity
} from 'lucide-react'

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalEvents: number
  upcomingEvents: number
  totalViews: number
  monthlyViews: number
  totalSubscribers: number
  newSubscribers: number
  comments: number
}

interface RecentActivity {
  id: string
  type: 'post' | 'event' | 'comment' | 'subscriber'
  title: string
  time: string
  author?: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 6,
    publishedPosts: 5,
    draftPosts: 1,
    totalEvents: 6,
    upcomingEvents: 4,
    totalViews: 12450,
    monthlyViews: 2340,
    totalSubscribers: 1250,
    newSubscribers: 45,
    comments: 23
  })

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'post',
      title: 'Nouvel article publié: "Secrets du Pan Bagnat"',
      time: '2 heures',
      author: 'Marie Dubois'
    },
    {
      id: '2',
      type: 'event',
      title: 'Nouvel événement créé: "Festival 2025"',
      time: '5 heures',
      author: 'Admin'
    },
    {
      id: '3',
      type: 'comment',
      title: 'Nouveau commentaire sur "Histoire du Pan Bagnat"',
      time: '1 jour',
    },
    {
      id: '4',
      type: 'subscriber',
      title: '12 nouveaux abonnés newsletter',
      time: '2 jours',
    }
  ])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileText className="w-4 h-4 text-blue-500" />
      case 'event': return <Calendar className="w-4 h-4 text-green-500" />
      case 'comment': return <MessageCircle className="w-4 h-4 text-yellow-500" />
      case 'subscriber': return <Users className="w-4 h-4 text-purple-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const StatCard = ({ icon, title, value, subtitle, trend }: {
    icon: React.ReactNode
    title: string
    value: string | number
    subtitle?: string
    trend?: { value: number; isPositive: boolean }
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-gray-100 rounded-lg">
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${!trend.isPositive ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-1">Aperçu de l&apos;activité du site Pan Bagnat</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
          <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-nice-blue rounded-md hover:bg-blue-700">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FileText className="w-6 h-6 text-blue-600" />}
          title="Articles"
          value={stats.totalPosts}
          subtitle={`${stats.publishedPosts} publiés, ${stats.draftPosts} brouillon`}
          trend={{ value: 12, isPositive: true }}
        />
        
        <StatCard
          icon={<Calendar className="w-6 h-6 text-green-600" />}
          title="Événements"
          value={stats.totalEvents}
          subtitle={`${stats.upcomingEvents} à venir`}
          trend={{ value: 8, isPositive: true }}
        />
        
        <StatCard
          icon={<Eye className="w-6 h-6 text-purple-600" />}
          title="Vues totales"
          value={stats.totalViews.toLocaleString()}
          subtitle={`${stats.monthlyViews} ce mois`}
          trend={{ value: 15, isPositive: true }}
        />
        
        <StatCard
          icon={<Users className="w-6 h-6 text-orange-600" />}
          title="Abonnés"
          value={stats.totalSubscribers.toLocaleString()}
          subtitle={`+${stats.newSubscribers} nouveaux`}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Trafic du Site</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm font-medium text-nice-blue bg-blue-50 rounded-md">
                7 jours
              </button>
              <button className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                30 jours
              </button>
              <button className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                90 jours
              </button>
            </div>
          </div>
          
          {/* Simple chart placeholder */}
          <div className="h-64 bg-gradient-to-t from-blue-50 to-white rounded-lg flex items-end justify-between p-4">
            {[65, 45, 78, 52, 89, 67, 95].map((height, index) => (
              <div
                key={index}
                className="bg-nice-blue rounded-t-sm w-8 transition-all hover:bg-blue-700 cursor-pointer"
                style={{ height: `${height}%` }}
                title={`${height} vues`}
              />
            ))}
          </div>
          
          <div className="flex justify-between mt-4 text-sm text-gray-500">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mer</span>
            <span>Jeu</span>
            <span>Ven</span>
            <span>Sam</span>
            <span>Dim</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Activité Récente</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span>Il y a {activity.time}</span>
                    {activity.author && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{activity.author}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 text-sm font-medium text-nice-blue hover:underline">
            Voir toute l&apos;activité
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions Rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FileText className="w-5 h-5 mr-2" />
            Nouvel Article
          </button>
          <button className="flex items-center justify-center p-4 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <Calendar className="w-5 h-5 mr-2" />
            Nouvel Événement
          </button>
          <button className="flex items-center justify-center p-4 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <BarChart3 className="w-5 h-5 mr-2" />
            Voir Analytics
          </button>
          <button className="flex items-center justify-center p-4 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5 mr-2" />
            Paramètres
          </button>
        </div>
      </div>
    </div>
  )
}