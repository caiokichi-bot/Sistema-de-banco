import React, { useState, useEffect, useCallback } from 'react';
import { BankAccount, BankTransaction } from './types/bank.ts';
import { BankService } from './services/bankService.ts';
import { getSupabaseClient, testSupabaseConnection } from './lib/supabase.ts';
import { Header } from './components/Header.tsx';
import { BalanceCard } from './components/BalanceCard.tsx';
import { DepositForm } from './components/DepositForm.tsx';
import { WithdrawForm } from './components/WithdrawForm.tsx';
import { TransactionHistory } from './components/TransactionHistory.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';
import { NewAccountModal } from './components/NewAccountModal.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import {
  Database,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');

  // Modals
  const [activeReceipt, setActiveReceipt] = useState<BankTransaction | null>(null);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Banner dismiss
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  // Fetch accounts and check database connection
  const loadData = useCallback(async (preferredAccountId?: string) => {
    setLoading(true);
    try {
      const { accounts: accList, isSupabase } = await BankService.getAccounts();
      setAccounts(accList);
      setIsSupabaseConnected(isSupabase);

      let current: BankAccount | null = selectedAccount;
      if (preferredAccountId) {
        current = accList.find((a) => a.id === preferredAccountId) || accList[0] || null;
      } else if (!current || !accList.some((a) => a.id === current?.id)) {
        current = accList[0] || null;
      } else {
        const currentId = current.id;
        current = accList.find((a) => a.id === currentId) || current;
      }
      setSelectedAccount(current);

      if (current) {
        const txs = await BankService.getTransactions(current.id);
        setTransactions(txs);
      }
    } catch (err) {
      console.error('Erro ao carregar dados bancários:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    loadData();
    // Check Supabase connection asynchronously
    testSupabaseConnection().then((res) => {
      setIsSupabaseConnected(res.success && !!getSupabaseClient());
    });
  }, []);

  // When selected account changes, load its transactions
  const handleSelectAccount = async (account: BankAccount) => {
    setSelectedAccount(account);
    const txs = await BankService.getTransactions(account.id);
    setTransactions(txs);
  };

  // Callback on successful deposit
  const handleDepositSuccess = (transaction: BankTransaction, newBalance: number) => {
    if (selectedAccount) {
      const updated = { ...selectedAccount, balance: newBalance };
      setSelectedAccount(updated);
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setTransactions((prev) => [transaction, ...prev]);
    }
    setActiveReceipt(transaction);
    setActiveTab('overview');
  };

  // Callback on successful withdrawal
  const handleWithdrawSuccess = (transaction: BankTransaction, newBalance: number) => {
    if (selectedAccount) {
      const updated = { ...selectedAccount, balance: newBalance };
      setSelectedAccount(updated);
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setTransactions((prev) => [transaction, ...prev]);
    }
    setActiveReceipt(transaction);
    setActiveTab('overview');
  };

  // Callback on new account created
  const handleNewAccountSuccess = (newAccount: BankAccount) => {
    setIsNewAccountOpen(false);
    loadData(newAccount.id);
    setActiveTab('overview');
  };

  // Metrics
  const totalDeposits = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'withdraw')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        accounts={accounts}
        selectedAccount={selectedAccount}
        onSelectAccount={handleSelectAccount}
        onOpenNewAccount={() => setIsNewAccountOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Database Connection Notice Banner */}
      {!bannerDismissed && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {isSupabaseConnected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">
                    <strong className="text-emerald-400 font-semibold">Supabase Conectado:</strong> Suas contas, depósitos, saques e saldos estão salvos e sincronizados diretamente no banco de dados na nuvem.
                  </span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-300">
                    <strong className="text-amber-400 font-semibold">Modo Local (Pronto para Supabase):</strong> O sistema bancário está 100% funcional. Conecte sua URL e Chave Anon do Supabase para persistência online imediata.
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2"
              >
                {isSupabaseConnected ? 'Ver Esquema SQL' : 'Conectar ao Supabase'}
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-slate-500 hover:text-slate-400 text-xs"
              >
                Dispensar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {loading && !selectedAccount ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm">Carregando sistema bancário...</p>
          </div>
        ) : !selectedAccount ? (
          <div className="text-center py-20">
            <h2 className="text-lg font-bold text-white mb-2">Nenhuma conta bancária cadastrada</h2>
            <p className="text-sm text-slate-400 mb-4">Crie sua primeira conta para começar a operar.</p>
            <button
              onClick={() => setIsNewAccountOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
            >
              Criar Conta Bancária
            </button>
          </div>
        ) : (
          <>
            {/* Tab: Overview (Visão Geral) */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in">
                {/* Balance & Account Hero Card */}
                <BalanceCard
                  account={selectedAccount}
                  totalDeposits={totalDeposits}
                  totalWithdrawals={totalWithdrawals}
                  onOpenDeposit={() => setActiveTab('deposit')}
                  onOpenWithdraw={() => setActiveTab('withdraw')}
                  onViewHistory={() => setActiveTab('history')}
                />

                {/* Quick Transaction History Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Últimas Movimentações</span>
                      <span className="text-xs font-normal text-slate-500">
                        (Mostrando até 5 transações mais recentes)
                      </span>
                    </h3>

                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Ver todas as transações &rarr;
                    </button>
                  </div>

                  <TransactionHistory
                    account={selectedAccount}
                    transactions={transactions.slice(0, 5)}
                    onSelectReceipt={(tx) => setActiveReceipt(tx)}
                    onOpenDeposit={() => setActiveTab('deposit')}
                    onOpenWithdraw={() => setActiveTab('withdraw')}
                  />
                </div>
              </div>
            )}

            {/* Tab: Deposit (Depósito) */}
            {activeTab === 'deposit' && (
              <div className="animate-fade-in">
                <DepositForm
                  account={selectedAccount}
                  onSuccess={handleDepositSuccess}
                  onCancel={() => setActiveTab('overview')}
                />
              </div>
            )}

            {/* Tab: Withdraw (Saque com verificação rigorosa de saldo) */}
            {activeTab === 'withdraw' && (
              <div className="animate-fade-in">
                <WithdrawForm
                  account={selectedAccount}
                  onSuccess={handleWithdrawSuccess}
                  onCancel={() => setActiveTab('overview')}
                />
              </div>
            )}

            {/* Tab: Full Statement History */}
            {activeTab === 'history' && (
              <div className="animate-fade-in">
                <TransactionHistory
                  account={selectedAccount}
                  transactions={transactions}
                  onSelectReceipt={(tx) => setActiveReceipt(tx)}
                  onOpenDeposit={() => setActiveTab('deposit')}
                  onOpenWithdraw={() => setActiveTab('withdraw')}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Nexus Bank</span>
            <span aria-hidden="true">·</span>
            <span>Sistema Bancário & Controle Financeiro</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Validação Estrita de Saldo</span>
            <span aria-hidden="true">·</span>
            <span>Pronto para Supabase PostgreSQL</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {activeReceipt && selectedAccount && (
        <ReceiptModal
          transaction={activeReceipt}
          account={selectedAccount}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {isNewAccountOpen && (
        <NewAccountModal
          onSuccess={handleNewAccountSuccess}
          onClose={() => setIsNewAccountOpen(false)}
        />
      )}

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onRefreshData={() => loadData(selectedAccount?.id)}
      />
    </div>
  );
}
