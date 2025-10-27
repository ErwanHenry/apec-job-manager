'use client'

import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { ApecImportModal } from '@/components/ApecImportModal'
import { useRouter } from 'next/navigation'

export function SyncButton() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleImportSuccess = () => {
    setIsModalOpen(false)
    // Refresh dashboard data
    router.refresh()
  }

  return (
    <>
      <ApecImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <Button
        onClick={() => setIsModalOpen(true)}
        className="relative"
      >
        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
        Importer APEC
      </Button>
    </>
  )
}
