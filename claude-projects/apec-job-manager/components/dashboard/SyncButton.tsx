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
      const response = await fetch('/api/jobs/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'full' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erreur de synchronisation')
      }

      setSuccess(true)
      router.refresh()

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
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
