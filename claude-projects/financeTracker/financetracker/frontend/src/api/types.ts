/**
 * API Type Definitions matching backend DTOs
 */

// Account types
export interface Account {
  id: string;
  name: string;
  bank: string;
  type: 'checking' | 'savings' | 'investment';
  initial_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountRequest {
  name: string;
  bank: string;
  type: 'checking' | 'savings' | 'investment';
  initial_balance: number;
  currency?: string;
}

// Transaction types
export interface Transaction {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  description: string;
  category_id?: string;
  category_confidence?: number;
  is_recurring: boolean;
  tags: string[];
  notes: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TransactionFilters {
  account_id?: string;
  date_from?: string;
  date_to?: string;
  category_id?: string;
  page?: number;
  size?: number;
}

// Category types
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer' | 'savings';
  parent_id?: string;
  icon?: string;
  color?: string;
  budget_default?: number;
  children?: Category[];
}

// Projection types
export interface ProjectionPoint {
  date: string;
  balance: number;
}

export interface ProjectionResult {
  scenario: 'pessimistic' | 'realistic' | 'optimistic';
  starting_balance: number;
  ending_balance: number;
  min_balance: number;
  max_balance: number;
  average_balance: number;
  points: ProjectionPoint[];
}

export interface ProjectionResponse {
  pessimistic: ProjectionResult;
  realistic: ProjectionResult;
  optimistic: ProjectionResult;
}

// Import types
export interface ImportResult {
  imported_count: number;
  skipped_count: number;
  errors: string[];
  timestamp: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  size: number;
}

// Error response
export interface ErrorResponse {
  detail: string;
  status_code: number;
}
