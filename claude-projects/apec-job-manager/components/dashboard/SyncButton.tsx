'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface SyncStats {
  created: number
  updated: number
  deleted: number
  unchanged: number
  errors: string[]
}

export function SyncButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const handleSync = async () => {
    setIsLoading(true)
    setError(null)
    setMessage(null)
    setStats(null)
    const start = Date.now()
    setStartTime(start)

    // Update elapsed time every second
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    try {
      const response = await fetch('/api/jobs/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'full' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erreur lors de la synchronisation')
      }

      // Success
      setMessage(data.message || 'Synchronisation réussie!')
      setStats(data.data?.stats || null)

      // Refresh dashboard data
      router.refresh()
    } catch (err) {
      console.error('Sync error:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      clearInterval(interval)
      setIsLoading(false)
      setStartTime(null)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSync}
        isLoading={isLoading}
        disabled={isLoading}
        className="relative"
      >
        <ArrowPathIcon className="h-5 w-5 mr-2" />
        {isLoading ? `Synchronisation en cours... ${elapsed}s` : 'Synchroniser APEC'}
      </Button>

      {message && stats && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">{message}</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-green-700">Créées:</span>{' '}
              <span className="font-semibold text-green-900">{stats.created}</span>
            </div>
            <div>
              <span className="text-green-700">Mises à jour:</span>{' '}
              <span className="font-semibold text-green-900">{stats.updated}</span>
            </div>
            <div>
              <span className="text-green-700">Inchangées:</span>{' '}
              <span className="font-semibold text-green-900">{stats.unchanged}</span>
            </div>
            <div>
              <span className="text-green-700">Erreurs:</span>{' '}
              <span className="font-semibold text-green-900">{stats.errors.length}</span>
            </div>
          </div>
          {stats.errors.length > 0 && (
            <div className="mt-2 text-xs text-red-600">
              {stats.errors.join(', ')}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-1">Erreur de synchronisation</h4>
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-xs text-red-600 mt-2">
            Vérifiez vos credentials APEC dans les variables d'environnement Vercel
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-gray-600">
          <p>⏱️ Temps écoulé: {elapsed}s</p>
          <p className="text-xs text-gray-500 mt-1">
            La synchronisation peut prendre entre 10 et 40 secondes
          </p>
        </div>
      )}
    </div>
  )
}
