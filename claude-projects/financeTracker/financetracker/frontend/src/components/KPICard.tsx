import { formatCurrency } from '../utils/formatters';

interface KPICardProps {
  title: string;
  value: number;
  currency?: string;
  icon?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  loading?: boolean;
  className?: string;
}

export default function KPICard({
  title,
  value,
  currency = 'EUR',
  icon,
  trend,
  loading = false,
  className = '',
}: KPICardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mt-2" />
          ) : (
            <p className={`text-2xl font-bold mt-2 ${value >= 0 ? 'text-primary-600' : 'text-danger-600'}`}>
              {formatCurrency(value, currency)}
            </p>
          )}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend.direction === 'up'
                ? 'bg-primary-100 text-primary-800'
                : trend.direction === 'down'
                  ? 'bg-danger-100 text-danger-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}{' '}
            {trend.value.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
