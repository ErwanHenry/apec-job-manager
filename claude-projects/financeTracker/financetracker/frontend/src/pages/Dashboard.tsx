import { useEffect, useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useProjection } from '../hooks/useProjection';
import KPICard from '../components/KPICard';
import TransactionCard from '../components/TransactionCard';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { projection, loading: projectionLoading } = useProjection(6);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    if (accounts.length > 0) {
      const total = accounts.reduce((sum, account) => sum + account.initial_balance, 0);
      setTotalBalance(total);
    }
  }, [accounts]);

  const recentTransactions = transactions.slice(0, 5);
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const expensesThisMonth = transactions
    .filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === thisMonth &&
        date.getFullYear() === thisYear &&
        t.amount < 0
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeThisMonth = transactions
    .filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === thisMonth &&
        date.getFullYear() === thisYear &&
        t.amount > 0
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const projectionData = projection?.realistic;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bienvenue dans FinanceTracker</h2>
        <p className="text-gray-600 mt-1">Vue d'ensemble de votre situation financière</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Solde total"
          value={totalBalance}
          icon="💰"
          loading={accountsLoading}
        />
        <KPICard
          title="Revenus (ce mois)"
          value={incomeThisMonth}
          icon="📈"
          loading={transactionsLoading}
        />
        <KPICard
          title="Dépenses (ce mois)"
          value={expensesThisMonth}
          icon="📉"
          loading={transactionsLoading}
        />
        <KPICard
          title="Projection (fin période)"
          value={projectionData?.ending_balance || 0}
          icon="🔮"
          loading={projectionLoading}
        />
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transactions récentes</h3>
          <a href="/transactions" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Voir tous →
          </a>
        </div>

        {transactionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : recentTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {recentTransactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune transaction pour le moment</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/import"
          className="card group hover:shadow-md transition-all cursor-pointer"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">📤</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Importer des transactions</h3>
            <p className="text-sm text-gray-500 mt-1">Depuis un fichier CSV</p>
          </div>
        </a>

        <a
          href="/accounts"
          className="card group hover:shadow-md transition-all cursor-pointer"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🏦</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Gérer les comptes</h3>
            <p className="text-sm text-gray-500 mt-1">{accounts.length} compte(s)</p>
          </div>
        </a>

        <a
          href="/projection"
          className="card group hover:shadow-md transition-all cursor-pointer"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Voir la projection</h3>
            <p className="text-sm text-gray-500 mt-1">6 mois d'avance</p>
          </div>
        </a>
      </div>
    </div>
  );
}
