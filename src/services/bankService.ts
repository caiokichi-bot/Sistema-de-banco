import { BankAccount, BankTransaction, TransactionResult } from '../types/bank.ts';
import { getSupabaseClient } from '../lib/supabase.ts';

const LOCAL_STORAGE_ACCOUNTS_KEY = 'nexus_bank_accounts';
const LOCAL_STORAGE_TRANSACTIONS_KEY = 'nexus_bank_transactions';

// Seed initial default accounts
const DEFAULT_ACCOUNTS: BankAccount[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    account_number: '04289-7',
    agency: '0001',
    client_name: 'Caio Silva',
    document: '384.921.804-12',
    balance: 3500.0,
    account_type: 'corrente',
    pix_key: 'caio.silva@nexusbank.com.br',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    account_number: '18503-4',
    agency: '0001',
    client_name: 'Ana Clara Souza',
    document: '412.873.190-88',
    balance: 1250.5,
    account_type: 'poupanca',
    pix_key: 'anaclara@nexusbank.com.br',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

// Seed initial transactions
const DEFAULT_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'tx-seed-1',
    account_id: '11111111-1111-4111-8111-111111111111',
    type: 'deposit',
    amount: 3000.0,
    balance_before: 0.0,
    balance_after: 3000.0,
    description: 'Depósito Inicial / Abertura de Conta',
    category: 'Depósito em Dinheiro',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    status: 'completed',
  },
  {
    id: 'tx-seed-2',
    account_id: '11111111-1111-4111-8111-111111111111',
    type: 'deposit',
    amount: 800.0,
    balance_before: 3000.0,
    balance_after: 3800.0,
    description: 'Pix Recebido - Transferência de Clientes',
    category: 'Transferência Pix',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: 'completed',
  },
  {
    id: 'tx-seed-3',
    account_id: '11111111-1111-4111-8111-111111111111',
    type: 'withdraw',
    amount: 300.0,
    balance_before: 3800.0,
    balance_after: 3500.0,
    description: 'Saque Terminal 24 Horas - Shopping',
    category: 'Saque Caixa 24h',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'completed',
  },
];

// Helpers for Local Storage
function getLocalAccounts(): BankAccount[] {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNTS;
  const stored = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

function saveLocalAccounts(accounts: BankAccount[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

function getLocalTransactions(): BankTransaction[] {
  if (typeof window === 'undefined') return DEFAULT_TRANSACTIONS;
  const stored = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
    return DEFAULT_TRANSACTIONS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_TRANSACTIONS;
  }
}

function saveLocalTransactions(transactions: BankTransaction[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
  }
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export class BankService {
  /**
   * Busca todas as contas bancárias (Supabase ou Local)
   */
  static async getAccounts(): Promise<{ accounts: BankAccount[]; isSupabase: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('Erro ao consultar Supabase accounts, usando modo local:', error.message);
          return { accounts: getLocalAccounts(), isSupabase: false, error: error.message };
        }

        if (data && data.length > 0) {
          // Map numeric balance safely
          const accounts: BankAccount[] = data.map((acc: any) => ({
            id: acc.id,
            account_number: acc.account_number,
            agency: acc.agency,
            client_name: acc.client_name,
            document: acc.document,
            balance: Number(acc.balance),
            account_type: acc.account_type,
            pix_key: acc.pix_key,
            created_at: acc.created_at,
          }));
          return { accounts, isSupabase: true };
        } else {
          // Supabase table is empty, seed it with initial accounts
          console.info('Tabela accounts no Supabase está vazia. Inserindo contas padrão...');
          const initial = getLocalAccounts();
          await supabase.from('accounts').insert(
            initial.map((a) => ({
              id: a.id,
              account_number: a.account_number,
              agency: a.agency,
              client_name: a.client_name,
              document: a.document,
              balance: a.balance,
              account_type: a.account_type,
              pix_key: a.pix_key,
              created_at: a.created_at,
            }))
          );
          return { accounts: initial, isSupabase: true };
        }
      } catch (err: any) {
        console.warn('Falha na requisição ao Supabase:', err);
        return { accounts: getLocalAccounts(), isSupabase: false, error: err.message };
      }
    }

    return { accounts: getLocalAccounts(), isSupabase: false };
  }

  /**
   * Busca uma conta pelo ID
   */
  static async getAccountById(accountId: string): Promise<BankAccount | null> {
    const { accounts } = await this.getAccounts();
    return accounts.find((a) => a.id === accountId) || null;
  }

  /**
   * Cria uma nova conta bancária
   */
  static async createAccount(params: {
    client_name: string;
    document: string;
    initial_balance: number;
    account_type: 'corrente' | 'poupanca';
    pix_key?: string;
  }): Promise<{ success: boolean; account?: BankAccount; message: string }> {
    const supabase = getSupabaseClient();
    const newId = crypto.randomUUID();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const checkDigit = Math.floor(Math.random() * 10);
    const account_number = `${randomNum}-${checkDigit}`;

    const newAccount: BankAccount = {
      id: newId,
      account_number,
      agency: '0001',
      client_name: params.client_name.trim(),
      document: params.document.trim(),
      balance: Math.max(0, params.initial_balance),
      account_type: params.account_type,
      pix_key: params.pix_key?.trim() || `${params.document.replace(/\D/g, '')}@nexusbank.com.br`,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('accounts').insert({
          id: newAccount.id,
          account_number: newAccount.account_number,
          agency: newAccount.agency,
          client_name: newAccount.client_name,
          document: newAccount.document,
          balance: newAccount.balance,
          account_type: newAccount.account_type,
          pix_key: newAccount.pix_key,
          created_at: newAccount.created_at,
        });

        if (error) {
          console.error('Erro ao criar conta no Supabase:', error);
          throw new Error(error.message);
        }

        // Se houver depósito inicial, registra a transação
        if (newAccount.balance > 0) {
          await supabase.from('transactions').insert({
            id: crypto.randomUUID(),
            account_id: newAccount.id,
            type: 'deposit',
            amount: newAccount.balance,
            balance_before: 0,
            balance_after: newAccount.balance,
            description: 'Depósito Inicial de Abertura',
            category: 'Abertura de Conta',
            created_at: newAccount.created_at,
            status: 'completed',
          });
        }
      } catch (err: any) {
        // Fallback local
        console.warn('Salvando localmente devido a erro no Supabase:', err);
      }
    }

    // Always update local cache
    const local = getLocalAccounts();
    local.push(newAccount);
    saveLocalAccounts(local);

    if (newAccount.balance > 0) {
      const txs = getLocalTransactions();
      txs.unshift({
        id: crypto.randomUUID(),
        account_id: newAccount.id,
        type: 'deposit',
        amount: newAccount.balance,
        balance_before: 0,
        balance_after: newAccount.balance,
        description: 'Depósito Inicial de Abertura',
        category: 'Abertura de Conta',
        created_at: newAccount.created_at,
        status: 'completed',
      });
      saveLocalTransactions(txs);
    }

    return {
      success: true,
      account: newAccount,
      message: `Conta nº ${account_number} criada com sucesso para ${newAccount.client_name}!`,
    };
  }

  /**
   * Realiza um Depósito
   */
  static async deposit(params: {
    account_id: string;
    amount: number;
    description?: string;
    category?: string;
  }): Promise<TransactionResult> {
    const { account_id, amount, description = 'Depósito em Conta Corrente', category = 'Depósito em Dinheiro' } = params;

    if (amount <= 0 || isNaN(amount)) {
      return {
        success: false,
        error_code: 'INVALID_AMOUNT',
        message: 'O valor do depósito deve ser maior que zero (R$ 0,00).',
      };
    }

    const account = await this.getAccountById(account_id);
    if (!account) {
      return {
        success: false,
        error_code: 'ACCOUNT_NOT_FOUND',
        message: 'Conta bancária de destino não foi localizada no sistema.',
      };
    }

    const previousBalance = account.balance;
    const newBalance = Number((previousBalance + amount).toFixed(2));
    const transactionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const transaction: BankTransaction = {
      id: transactionId,
      account_id,
      type: 'deposit',
      amount,
      balance_before: previousBalance,
      balance_after: newBalance,
      description,
      category,
      created_at: timestamp,
      status: 'completed',
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Atualiza o saldo no Supabase
        const { error: accError } = await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', account_id);

        if (accError) throw new Error(accError.message);

        // Insere a transação no Supabase
        const { error: txError } = await supabase.from('transactions').insert({
          id: transaction.id,
          account_id: transaction.account_id,
          type: transaction.type,
          amount: transaction.amount,
          balance_before: transaction.balance_before,
          balance_after: transaction.balance_after,
          description: transaction.description,
          category: transaction.category,
          created_at: transaction.created_at,
          status: 'completed',
        });

        if (txError) throw new Error(txError.message);
      } catch (err: any) {
        console.warn('Erro ao persistir no Supabase, registrando localmente:', err.message);
      }
    }

    // Atualiza localmente
    const localAccounts = getLocalAccounts();
    const accIndex = localAccounts.findIndex((a) => a.id === account_id);
    if (accIndex >= 0) {
      localAccounts[accIndex].balance = newBalance;
      saveLocalAccounts(localAccounts);
    }

    const localTxs = getLocalTransactions();
    localTxs.unshift(transaction);
    saveLocalTransactions(localTxs);

    return {
      success: true,
      message: `Depósito de ${formatBRL(amount)} realizado com sucesso! Novo saldo: ${formatBRL(newBalance)}.`,
      transaction,
      new_balance: newBalance,
    };
  }

  /**
   * Realiza um Saque com verificação rigorosa de saldo!
   * Caso o saque seja maior que o saldo, retorna um erro explícito e cancela a operação.
   */
  static async withdraw(params: {
    account_id: string;
    amount: number;
    description?: string;
    category?: string;
  }): Promise<TransactionResult> {
    const { account_id, amount, description = 'Saque em Terminal Bancário', category = 'Saque Caixa 24h' } = params;

    if (amount <= 0 || isNaN(amount)) {
      return {
        success: false,
        error_code: 'INVALID_AMOUNT',
        message: 'O valor do saque deve ser estritamente maior que zero (R$ 0,00).',
      };
    }

    const account = await this.getAccountById(account_id);
    if (!account) {
      return {
        success: false,
        error_code: 'ACCOUNT_NOT_FOUND',
        message: 'Conta de origem não encontrada.',
      };
    }

    // VERIFICAÇÃO CRÍTICA DE SALDO
    if (amount > account.balance) {
      const deficit = Number((amount - account.balance).toFixed(2));
      return {
        success: false,
        error_code: 'INSUFFICIENT_FUNDS',
        message: `Operação cancelada: Saldo insuficiente! O valor solicitado para saque (${formatBRL(amount)}) é maior que seu saldo atual (${formatBRL(account.balance)}). Faltam ${formatBRL(deficit)} para cobrir este saque.`,
      };
    }

    const previousBalance = account.balance;
    const newBalance = Number((previousBalance - amount).toFixed(2));
    const transactionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const transaction: BankTransaction = {
      id: transactionId,
      account_id,
      type: 'withdraw',
      amount,
      balance_before: previousBalance,
      balance_after: newBalance,
      description,
      category,
      created_at: timestamp,
      status: 'completed',
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Atualiza o saldo no Supabase
        const { error: accError } = await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', account_id);

        if (accError) throw new Error(accError.message);

        // Insere a transação no Supabase
        const { error: txError } = await supabase.from('transactions').insert({
          id: transaction.id,
          account_id: transaction.account_id,
          type: transaction.type,
          amount: transaction.amount,
          balance_before: transaction.balance_before,
          balance_after: transaction.balance_after,
          description: transaction.description,
          category: transaction.category,
          created_at: transaction.created_at,
          status: 'completed',
        });

        if (txError) throw new Error(txError.message);
      } catch (err: any) {
        console.warn('Erro ao debitar no Supabase, registrando localmente:', err.message);
      }
    }

    // Atualiza localmente
    const localAccounts = getLocalAccounts();
    const accIndex = localAccounts.findIndex((a) => a.id === account_id);
    if (accIndex >= 0) {
      localAccounts[accIndex].balance = newBalance;
      saveLocalAccounts(localAccounts);
    }

    const localTxs = getLocalTransactions();
    localTxs.unshift(transaction);
    saveLocalTransactions(localTxs);

    return {
      success: true,
      message: `Saque de ${formatBRL(amount)} efetuado com sucesso! Saldo restante: ${formatBRL(newBalance)}.`,
      transaction,
      new_balance: newBalance,
    };
  }

  /**
   * Obtém extrato / histórico de transações de uma conta
   */
  static async getTransactions(accountId: string): Promise<BankTransaction[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((t: any) => ({
            id: t.id,
            account_id: t.account_id,
            type: t.type,
            amount: Number(t.amount),
            balance_before: Number(t.balance_before),
            balance_after: Number(t.balance_after),
            description: t.description,
            category: t.category,
            created_at: t.created_at,
            status: t.status || 'completed',
          }));
        }
      } catch (err) {
        console.warn('Falha ao ler transações do Supabase, buscando locais:', err);
      }
    }

    const local = getLocalTransactions();
    return local
      .filter((t) => t.account_id === accountId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Sincroniza dados locais para o Supabase
   */
  static async syncLocalToSupabase(): Promise<{ success: boolean; message: string; syncedAccounts: number; syncedTransactions: number }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        message: 'Cliente Supabase não configurado. Forneça URL e Chave Anon primeiro.',
        syncedAccounts: 0,
        syncedTransactions: 0,
      };
    }

    try {
      const localAccounts = getLocalAccounts();
      const localTxs = getLocalTransactions();

      // Upsert accounts
      let accCount = 0;
      for (const acc of localAccounts) {
        const { error } = await supabase.from('accounts').upsert({
          id: acc.id,
          account_number: acc.account_number,
          agency: acc.agency,
          client_name: acc.client_name,
          document: acc.document,
          balance: acc.balance,
          account_type: acc.account_type,
          pix_key: acc.pix_key,
          created_at: acc.created_at,
        });
        if (!error) accCount++;
      }

      // Upsert transactions
      let txCount = 0;
      for (const tx of localTxs) {
        const { error } = await supabase.from('transactions').upsert({
          id: tx.id,
          account_id: tx.account_id,
          type: tx.type,
          amount: tx.amount,
          balance_before: tx.balance_before,
          balance_after: tx.balance_after,
          description: tx.description,
          category: tx.category,
          created_at: tx.created_at,
          status: tx.status,
        });
        if (!error) txCount++;
      }

      return {
        success: true,
        message: `Sincronização concluída com sucesso! ${accCount} contas e ${txCount} transações enviadas para o Supabase.`,
        syncedAccounts: accCount,
        syncedTransactions: txCount,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erro durante sincronização: ${err.message}`,
        syncedAccounts: 0,
        syncedTransactions: 0,
      };
    }
  }
}
