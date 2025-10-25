'use client'

import { useSession, signOut } from 'next-auth/react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

export function Header() {
  const { data: session } = useSession()

  return (
    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
      <button
        type="button"
        className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-apec-blue lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Bienvenue, {session?.user?.name || 'Utilisateur'}
          </h1>
        </div>

        <div className="ml-4 flex items-center gap-x-4">
          {/* Notifications */}
          <button
            type="button"
            className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-apec-blue focus:ring-offset-2"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-apec-red ring-2 ring-white" />
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-x-2 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-apec-blue focus:ring-offset-2">
              <span className="sr-only">Open user menu</span>
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <span className="hidden lg:flex lg:items-center">
                <span className="text-sm font-semibold text-gray-900">
                  {session?.user?.name}
                </span>
              </span>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{session?.user?.name}</p>
                      <p className="text-xs text-gray-500">{session?.user?.email}</p>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => signOut()}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Se déconnecter
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  )
}
