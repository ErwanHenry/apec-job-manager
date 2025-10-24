'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
  HomeIcon,
  BriefcaseIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Annonces', href: '/jobs', icon: BriefcaseIcon },
  { name: 'Rapports', href: '/reports', icon: ChartBarIcon },
  { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-apec-blue overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="h-6 w-6 text-apec-blue" />
              </div>
              <span className="ml-3 text-xl font-bold text-white">
                APEC Manager
              </span>
            </div>
          </div>

          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    isActive
                      ? 'bg-apec-blue-dark text-white'
                      : 'text-apec-blue-100 hover:bg-apec-blue-dark hover:text-white',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon
                    className={clsx(
                      isActive
                        ? 'text-white'
                        : 'text-apec-blue-200 group-hover:text-white',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="flex-shrink-0 flex border-t border-apec-blue-dark p-4">
            <div className="flex items-center w-full">
              <div className="text-sm text-white">
                <p className="font-medium">APEC Job Manager</p>
                <p className="text-apec-blue-200 text-xs">v2.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
