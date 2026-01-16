import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { useImport } from '../hooks/useImport';
import FileUpload from '../components/FileUpload';

export default function Import() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { importing, error, result, uploadFile, reset } = useImport();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedAccountId) {
      return;
    }

    try {
      await uploadFile(selectedFile, selectedAccountId, autoCategorize);
    } catch (err) {
      // Error is handled by hook
    }
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setSelectedAccountId('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Importer des transactions</h2>
        <p className="text-gray-600 mt-1">Importez vos transactions depuis un fichier CSV</p>
      </div>

      {!result ? (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Selection */}
            <div>
              <label htmlFor="account" className="input-label">
                Compte destination *
              </label>
              {accountsLoading ? (
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              ) : accounts.length > 0 ? (
                <select
                  id="account"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Sélectionner un compte...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.bank})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-600">
                  Aucun compte disponible.{' '}
                  <a href="/accounts" className="text-primary-600 hover:text-primary-700 font-medium">
                    Créer un compte
                  </a>
                </p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="input-label">Fichier CSV *</label>
              <FileUpload
                onFileSelected={handleFileSelected}
                disabled={importing || !selectedAccountId}
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Fichier sélectionné: <span className="font-medium">{selectedFile.name}</span>
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-md">
                <p className="text-sm text-danger-800">{error.message}</p>
              </div>
            )}

            {/* Options */}
            <div className="flex items-center gap-2">
              <input
                id="autoCategorize"
                type="checkbox"
                checked={autoCategorize}
                onChange={(e) => setAutoCategorize(e.target.checked)}
                disabled={importing}
                className="w-4 h-4 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="autoCategorize" className="text-sm text-gray-700 cursor-pointer">
                Catégoriser automatiquement les transactions
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 justify-end">
              <button
                type="reset"
                onClick={handleReset}
                disabled={importing}
                className="btn-secondary disabled:opacity-50"
              >
                Réinitialiser
              </button>
              <button
                type="submit"
                disabled={importing || !selectedFile || !selectedAccountId}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? '⏳ Importation en cours...' : '📤 Importer'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900">Import réussi!</h3>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Importées</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">
                  {result.imported_count}
                </p>
              </div>
              <div className="bg-accent-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Ignorées</p>
                <p className="text-2xl font-bold text-accent-600 mt-1">
                  {result.skipped_count}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {result.imported_count + result.skipped_count}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-6 p-4 bg-danger-50 border border-danger-200 rounded-md text-left">
                <p className="text-sm font-medium text-danger-800 mb-2">Erreurs rencontrées:</p>
                <ul className="text-sm text-danger-700 space-y-1">
                  {result.errors.slice(0, 5).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>... et {result.errors.length - 5} autres erreurs</li>
                  )}
                </ul>
              </div>
            )}

            <div className="mt-6 flex gap-2 justify-center">
              <button onClick={handleReset} className="btn-secondary">
                Importer un autre fichier
              </button>
              <a href="/transactions" className="btn-primary">
                Voir les transactions
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Format Help */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Format attendu du fichier CSV</h3>
        <p className="text-sm text-blue-800 mb-3">
          Votre fichier CSV doit contenir les colonnes suivantes (format LCL):
        </p>
        <div className="bg-white rounded p-3 font-mono text-xs text-gray-700 overflow-x-auto">
          <p>Date;Date valeur;Libellé;Débit;Crédit</p>
          <p>15/01/2025;15/01/2025;CB CARREFOUR;42,50;</p>
          <p>20/01/2025;20/01/2025;VIR SEPA CAF;;2400,00</p>
        </div>
        <p className="text-xs text-blue-700 mt-3">
          • Les montants doivent être au format français (virgule pour séparateur décimal)
          • Les dates au format DD/MM/YYYY
        </p>
      </div>
    </div>
  );
}
