import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import TransactionCard from '../components/TransactionCard';
import Pagination from '../components/Pagination';
import { formatDateISO } from '../utils/formatters';

export default function Transactions() {
  const {
    transactions,
    loading,
    pagination,
    setPage,
    setPageSize,
    setFilters,
  } = useTransactions();
  const { accounts } = useAccounts();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Handle date range filter
  const handleApplyFilters = () => {
    const filters: Record<string, unknown> = {};
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    if (selectedAccount) filters.account_id = selectedAccount;
    setFilters(filters);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedAccount('');
    setSearchTerm('');
    setFilters({});
  };

  // Local search on description (client-side for simplicity)
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    return transactions.filter((t) =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <p className="text-gray-600 mt-1">Retrouvez toutes vos transactions et appliquez des filtres</p>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="form-group">
            <label htmlFor="dateFrom" className="input-label">
              Date de début
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateTo" className="input-label">
              Date de fin
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="account" className="input-label">
              Compte
            </label>
            <select
              id="account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="input-field"
            >
              <option value="">Tous les comptes</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="search" className="input-label">
              Recherche
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Libellé..."
              className="input-field"
            />
          </div>

          <div className="flex gap-2 items-end">
            <button onClick={handleApplyFilters} className="btn-primary flex-1">
              Filtrer
            </button>
            <button onClick={handleResetFilters} className="btn-secondary">
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              pageSize={pagination.size}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Aucune transaction trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Essayez d'ajuster vos filtres ou d'importer des transactions</p>
          </div>
        )}
      </div>
    </div>
  );
}
