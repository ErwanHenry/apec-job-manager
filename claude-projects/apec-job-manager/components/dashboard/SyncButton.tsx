'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export function SyncButton() {
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/cron/sync-jobs', {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de synchronisation')
      }

      setSuccess(true)
      router.refresh()

      // Show stats
      if (data.stats) {
        console.log('Sync completed:', data.stats)
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        className="relative"
      >
        <ArrowPathIcon className={`h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Synchronisation...' : 'Synchroniser APEC'}
      </Button>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600">
          ✓ Synchronisation réussie !
        </div>
      )}
    </div>
  )
}
