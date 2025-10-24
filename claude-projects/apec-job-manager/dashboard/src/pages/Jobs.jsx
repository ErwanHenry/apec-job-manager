import { useEffect, useState } from 'react'
import axios from 'axios'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const statusColors = {
  PUBLISHED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PAUSED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-red-100 text-red-800',
  DELETED: 'bg-red-100 text-red-800'
}

const statusLabels = {
  PUBLISHED: 'Publiée',
  DRAFT: 'Brouillon',
  PAUSED: 'En pause',
  EXPIRED: 'Expirée',
  DELETED: 'Supprimée'
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs?limit=100')
      setJobs(response.data.data.jobs)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await axios.post('/api/jobs/sync')
      await fetchJobs()
      alert('Synchronisation réussie!')
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Échec de la synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Annonces d'emploi</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de toutes vos annonces APEC
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-apec-blue hover:bg-apec-lightblue"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Nouvelle annonce
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {jobs.map((job) => (
            <li key={job.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-apec-blue truncate">
                      {job.title}
                    </h3>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>{job.location || 'Localisation non spécifiée'}</span>
                      <span className="mx-2">•</span>
                      <span>{job.contractType || 'Type non spécifié'}</span>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[job.status]}`}>
                      {statusLabels[job.status]}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Vues:</span>
                    <span className="ml-1 font-semibold text-gray-900">{job.views}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Candidatures:</span>
                    <span className="ml-1 font-semibold text-gray-900">{job.applications}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Taux:</span>
                    <span className="ml-1 font-semibold text-gray-900">
                      {job.views > 0 ? ((job.applications / job.views) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Publiée le:</span>
                    <span className="ml-1 font-semibold text-gray-900">
                      {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
