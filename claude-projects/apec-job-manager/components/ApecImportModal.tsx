'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { XMarkIcon, ArrowTopRightOnSquareIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

interface ApecImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ApecImportModal({ isOpen, onClose, onSuccess }: ApecImportModalProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    created: number
    updated: number
    unchanged: number
    errors: number
  } | null>(null)

  if (!isOpen) return null

  const bookmarkletCode = `javascript:(function(){var s=document.createElement('script');s.src='${window.location.origin}/apec-extractor-bookmarklet.js';document.body.appendChild(s);})()`

  const consoleCode = `(async function() {
  const response = await fetch('${window.location.origin}/apec-extractor-bookmarklet.js');
  const code = await response.text();
  eval(code);
})();`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const openApecAndImport = () => {
    // Ouvrir APEC dans une nouvelle fenêtre
    const apecWindow = window.open(
      'https://www.apec.fr/recruteur/mon-espace/mes-offres.html',
      '_blank',
      'width=1200,height=800'
    )

    if (apecWindow) {
      // Instructions pour l'utilisateur
      alert(
        'Une fois connecté à l\'APEC et sur la page "Mes offres":\n\n' +
        '1. Ouvrez la console du navigateur (F12)\n' +
        '2. Collez le code ci-dessous\n' +
        '3. Appuyez sur Entrée\n\n' +
        'Le code a été copié dans votre presse-papier !'
      )
      copyToClipboard(consoleCode)
    }
  }

  const createBookmarklet = () => {
    alert(
      'Pour créer le bookmarklet :\n\n' +
      '1. Créez un nouveau favori dans votre navigateur\n' +
      '2. Nommez-le "Importer APEC"\n' +
      '3. Collez le code ci-dessous comme URL\n\n' +
      'Ensuite, connectez-vous à l\'APEC, allez sur "Mes offres" et cliquez sur le favori !\n\n' +
      'Le code a été copié dans votre presse-papier !'
    )
    copyToClipboard(bookmarkletCode)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Importer vos offres APEC
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Success Message */}
            {importResult && (
              <div className={`p-4 rounded-lg ${
                importResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className="font-semibold mb-2">
                  {importResult.success ? '✅ Import réussi !' : '❌ Erreur d\'import'}
                </h3>
                {importResult.success && (
                  <div className="text-sm space-y-1">
                    <p>• {importResult.created} offre(s) créée(s)</p>
                    <p>• {importResult.updated} offre(s) mise(s) à jour</p>
                    <p>• {importResult.unchanged} offre(s) inchangée(s)</p>
                    {importResult.errors > 0 && (
                      <p className="text-red-600">• {importResult.errors} erreur(s)</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Important :</strong> Pour importer vos offres depuis l'APEC, vous devez
                être connecté à votre compte APEC. Choisissez l'une des méthodes ci-dessous.
              </p>
            </div>

            {/* Option 1: Ouvrir APEC */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-apec-blue text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Méthode rapide (Console)
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Ouvre automatiquement la page APEC. Vous devrez copier-coller un code dans
                    la console du navigateur (F12).
                  </p>
                  <Button
                    onClick={openApecAndImport}
                    variant="primary"
                    className="w-full sm:w-auto"
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                    Ouvrir APEC et copier le code
                  </Button>
                </div>
              </div>
            </div>

            {/* Option 2: Bookmarklet */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-apec-blue text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Méthode permanente (Bookmarklet)
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Créez un favori dans votre navigateur pour importer vos offres en un clic
                    à chaque fois.
                  </p>
                  <Button
                    onClick={createBookmarklet}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                    Copier le code du bookmarklet
                  </Button>
                </div>
              </div>
            </div>

            {/* Option 3: Code manuel */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-apec-blue text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Code pour la console
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Copiez ce code et collez-le dans la console du navigateur (F12) sur la page
                    "Mes offres" de l'APEC.
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {consoleCode}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(consoleCode)}
                      className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                      {isCopied ? '✓ Copié' : 'Copier'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">📋 Instructions détaillées</h4>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Connectez-vous à votre compte APEC</li>
                <li>Allez sur la page "Mes offres"</li>
                <li>Utilisez l'une des méthodes ci-dessus</li>
                <li>Une fenêtre apparaîtra pour confirmer l'import</li>
                <li>Vos offres seront automatiquement importées ici</li>
              </ol>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
