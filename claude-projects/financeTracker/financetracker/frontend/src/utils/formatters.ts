/**
 * Formatting utilities for display
 */

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format large numbers with K/M/B suffix
 */
export function formatCompact(amount: number, currency: string = 'EUR'): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M€`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K€`;
  }
  return formatCurrency(amount, currency);
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format date to short format (DD/MM/YYYY)
 */
export function formatDateShort(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Determine if amount is positive (income) or negative (expense)
 */
export function getAmountClass(amount: number): string {
  if (amount > 0) return 'text-primary-600 font-semibold';
  if (amount < 0) return 'text-danger-600 font-semibold';
  return 'text-gray-500';
}

/**
 * Get amount color class for UI
 */
export function getAmountBgClass(amount: number): string {
  if (amount > 0) return 'bg-primary-50';
  if (amount < 0) return 'bg-danger-50';
  return 'bg-gray-50';
}

/**
 * Format category type to display name
 */
export function formatCategoryType(type: string): string {
  const typeMap: Record<string, string> = {
    income: 'Revenus',
    expense: 'Dépenses',
    transfer: 'Transferts',
    savings: 'Épargne',
  };
  return typeMap[type] || type;
}

/**
 * Format account type to display name
 */
export function formatAccountType(type: string): string {
  const typeMap: Record<string, string> = {
    checking: 'Compte courant',
    savings: 'Compte épargne',
    investment: 'Compte investissement',
  };
  return typeMap[type] || type;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Shorten description to N characters
 */
export function truncate(text: string, length: number = 50): string {
  return text.length > length ? `${text.substring(0, length)}...` : text;
}
