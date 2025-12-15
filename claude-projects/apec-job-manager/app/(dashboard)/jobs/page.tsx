'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { ApecImportModal } from '@/components/ApecImportModal'
import { Job } from '@prisma/client'
import { JobStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

const statusColors: Record<string, string> = {
  DRAFT: 'apec-badge-gray',
  PUBLISHED: 'apec-badge-green',
  PAUSED: 'apec-badge-orange',
  EXPIRED: 'apec-badge-red',
  DELETED: 'apec-badge-red',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  PAUSED: 'En pause',
  EXPIRED: 'Expiré',
  DELETED: 'Supprimé',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/jobs?${params}`)
      const data = await response.json()

      if (data.data) {
        setJobs(data.data)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleImportSuccess = () => {
    setIsImportModalOpen(false)
    fetchJobs()
  }

  return (
    <div className="space-y-6">
      {/* Import Modal */}
      <ApecImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annonces</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gérez vos annonces APEC
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsImportModalOpen(true)}
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Importer APEC
          </Button>
          <Link href="/jobs/new">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouvelle annonce
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une annonce..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as JobStatus | '')}
              className="apec-input"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="PAUSED">En pause</option>
              <option value="EXPIRED">Expiré</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Jobs List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-apec-blue border-r-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune annonce trouvée</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {job.location && (
                        <span className="flex items-center">
                          📍 {job.location}
                        </span>
                      )}
                      {job.contractType && (
                        <span className="flex items-center">
                          📄 {job.contractType}
                        </span>
                      )}
                      {job.salary && (
                        <span className="flex items-center">
                          💰 {job.salary}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(job.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      <span>👁️ {job.views} vues</span>
                      <span>📝 {job.applications} candidatures</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={clsx(statusColors[job.status])}>
                      {statusLabels[job.status]}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Précédent
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-700">
            Page {page} sur {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
