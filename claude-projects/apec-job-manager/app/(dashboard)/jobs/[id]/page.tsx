'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

interface Job {
  id: string
  apecId: string | null
  title: string
  description: string | null
  location: string | null
  contractType: string | null
  salary: string | null
  experienceLevel: string | null
  skills: string | null
  status: string
  views: number
  applications: number
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

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

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement de l\'annonce')
      }

      setJob(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      router.push('/jobs')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur de suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-apec-blue border-r-transparent" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Retour aux annonces
        </Link>
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'Annonce introuvable'}</p>
          </div>
        </Card>
      </div>
    )
  }

  const skills = job.skills ? JSON.parse(job.skills) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Retour aux annonces
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <span className={clsx(statusColors[job.status])}>
              {statusLabels[job.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Créée {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: fr })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/jobs/${job.id}/edit`}>
            <Button variant="secondary">
              <PencilIcon className="h-5 w-5 mr-2" />
              Modifier
            </Button>
          </Link>
          <Button
            variant="secondary"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Vues</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{job.views}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Candidatures</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{job.applications}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Taux de conversion</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {job.views > 0 ? ((job.applications / job.views) * 100).toFixed(1) : 0}%
          </div>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <div className="prose prose-sm max-w-none text-gray-700">
              {job.description || <span className="text-gray-400 italic">Aucune description</span>}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {job.location && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Localisation</dt>
                  <dd className="text-sm text-gray-900 mt-1">{job.location}</dd>
                </div>
              )}
              {job.contractType && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Type de contrat</dt>
                  <dd className="text-sm text-gray-900 mt-1">{job.contractType}</dd>
                </div>
              )}
              {job.salary && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Salaire</dt>
                  <dd className="text-sm text-gray-900 mt-1">{job.salary}</dd>
                </div>
              )}
              {job.experienceLevel && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Expérience</dt>
                  <dd className="text-sm text-gray-900 mt-1">{job.experienceLevel}</dd>
                </div>
              )}
              {job.apecId && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">ID APEC</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-mono">{job.apecId}</dd>
                </div>
              )}
              {job.publishedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Date de publication</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {new Date(job.publishedAt).toLocaleDateString('fr-FR')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Compétences requises</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-apec-blue bg-opacity-10 text-apec-blue"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
