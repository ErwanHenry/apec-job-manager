import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency, formatAccountType } from '../utils/formatters';
import { CreateAccountRequest } from '../api/types';

export default function Accounts() {
  const { accounts, loading, createAccount } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateAccountRequest>({
    name: '',
    bank: '',
    type: 'checking',
    initial_balance: 0,
    currency: 'EUR',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await createAccount(formData);
      setFormData({
        name: '',
        bank: '',
        type: 'checking',
        initial_balance: 0,
        currency: 'EUR',
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'initial_balance' ? parseFloat(value) : value,
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comptes bancaires</h2>
          <p className="text-gray-600 mt-1">Gérezdérez vos comptes et vos soldes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? '✕ Fermer' : '+ Nouveau compte'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouveau compte</h3>
          {error && (
            <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-md">
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="name" className="input-label">
                  Nom du compte *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: LCL Courant"
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bank" className="input-label">
                  Banque *
                </label>
                <input
                  id="bank"
                  name="bank"
                  type="text"
                  value={formData.bank}
                  onChange={handleInputChange}
                  placeholder="ex: LCL"
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type" className="input-label">
                  Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="checking">Compte courant</option>
                  <option value="savings">Compte épargne</option>
                  <option value="investment">Compte investissement</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="initial_balance" className="input-label">
                  Solde initial (€) *
                </label>
                <input
                  id="initial_balance"
                  name="initial_balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div key={account.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{account.bank}</p>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{account.name}</h3>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatAccountType(account.type)}
                    </p>
                  </div>
                  <div className="text-2xl">
                    {account.type === 'checking' && '🏦'}
                    {account.type === 'savings' && '🏧'}
                    {account.type === 'investment' && '📈'}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Solde</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      account.initial_balance >= 0
                        ? 'text-primary-600'
                        : 'text-danger-600'
                    }`}>
                      {formatCurrency(account.initial_balance, account.currency)}
                    </p>
                  </div>
                </div>

                {account.is_active ? (
                  <p className="text-xs text-primary-600 font-medium mt-2">✓ Actif</p>
                ) : (
                  <p className="text-xs text-gray-500 font-medium mt-2">✗ Inactif</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-lg text-gray-600 mb-4">Aucun compte créé pour le moment</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Créer votre premier compte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
