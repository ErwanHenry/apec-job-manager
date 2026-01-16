import { Transaction } from '../api/types';
import { formatCurrency, formatDateShort, getAmountClass } from '../utils/formatters';

interface TransactionCardProps {
  transaction: Transaction;
  showAccount?: boolean;
  onCategoryChange?: (categoryId: string) => void;
}

export default function TransactionCard({
  transaction,
  showAccount = false,
}: TransactionCardProps) {
  const amountClass = getAmountClass(transaction.amount);

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDateShort(transaction.date)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {transaction.category_id && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            Catégorisé
          </span>
        )}
        <p className={`text-sm font-semibold ${amountClass} min-w-[100px] text-right`}>
          {formatCurrency(transaction.amount, 'EUR')}
        </p>
      </div>
    </div>
  );
}
