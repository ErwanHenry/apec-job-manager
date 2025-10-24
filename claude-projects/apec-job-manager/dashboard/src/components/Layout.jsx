import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  BriefcaseIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: HomeIcon },
  { name: 'Annonces', href: '/jobs', icon: BriefcaseIcon },
  { name: 'Rapports', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon }
]

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-apec-blue">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold text-white">APEC Job Manager</h1>
        </div>
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-apec-lightblue text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
