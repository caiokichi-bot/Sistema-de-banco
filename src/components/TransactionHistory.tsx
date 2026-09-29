import React, { useState } from 'react';
import { BankAccount, BankTransaction } from '../types/bank.ts';
import { formatBRL } from '../services/bankService.ts';
import { ArrowDownRight, ArrowUpRight, Search, FileText, Download, Receipt, Filter } from 'lucide-react';

interface TransactionHistoryProps {
  account: BankAccount;
  transactions: BankTransaction[];
  onSelectReceipt: (tx: BankTransaction) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  account,
  transactions,
  onSelectReceipt,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.description.toLowerCase().includes(query) ||
      tx.category.toLowerCase().includes(query) ||
      tx.amount.toString().includes(query)
    );
  });

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['ID', 'Data/Hora', 'Tipo', 'Valor', 'Saldo Anterior', 'Saldo Posterior', 'Descrição', 'Categoria'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      new Date(tx.created_at).toLocaleString('pt-BR'),
      tx.type === 'deposit' ? 'Depósito' : 'Saque',
      tx.amount.toFixed(2),
      tx.balance_before.toFixed(2),
      tx.balance_after.toFixed(2),
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.category.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_nexus_${account.account_number}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Extrato da Conta</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Conta <span className="font-mono text-slate-300 font-semibold">{account.account_number}</span> · {account.client_name}
          </p>
        </div>

        {/* Filter Segmented Control & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('deposit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                filterType === 'deposit'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Depósitos</span>
            </button>
            <button
              onClick={() => setFilterType('withdraw')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                filterType === 'withdraw'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Saques</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            title="Exportar Extrato em CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por descrição, valor ou categoria..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">Nenhuma transação encontrada</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Não há registros com os filtros atuais. Realize um depósito ou saque para movimentar a conta.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onOpenDeposit}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                Fazer Depósito
              </button>
              <button
                onClick={onOpenWithdraw}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Realizar Saque
              </button>
            </div>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isDeposit = tx.type === 'deposit';
            const formattedDate = new Date(tx.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const formattedTime = new Date(tx.created_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={tx.id}
                className="group p-4 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isDeposit
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isDeposit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">{tx.description}</h3>
                    {/* Unboxed metadata with typographic separators */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{tx.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{formattedDate} às {formattedTime}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Resulting Balance & Receipt CTA */}
                <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-base font-bold font-mono tabular-nums block ${
                        isDeposit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isDeposit ? '+' : '-'} {formatBRL(tx.amount)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono tabular-nums block">
                      Saldo: {formatBRL(tx.balance_after)}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectReceipt(tx)}
                    className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                    title="Ver comprovante detalhado"
                  >
                    <Receipt className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
