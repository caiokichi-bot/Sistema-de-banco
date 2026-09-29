export type AccountType = 'corrente' | 'poupanca';

export interface BankAccount {
  id: string;
  account_number: string;
  agency: string;
  client_name: string;
  document: string;
  balance: number;
  account_type: AccountType;
  pix_key?: string;
  created_at: string;
}

export type TransactionType = 'deposit' | 'withdraw';

export interface BankTransaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  category: string;
  created_at: string;
  status: 'completed' | 'failed';
}

export interface TransactionResult {
  success: boolean;
  message: string;
  transaction?: BankTransaction;
  new_balance?: number;
  error_code?: 'INSUFFICIENT_FUNDS' | 'INVALID_AMOUNT' | 'ACCOUNT_NOT_FOUND' | 'DATABASE_ERROR';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
