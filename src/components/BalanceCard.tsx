import React, { useState } from 'react';
import { BankAccount } from '../types/bank.ts';
import { formatBRL } from '../services/bankService.ts';
import { Eye, EyeOff, ArrowDownRight, ArrowUpRight, Copy, Check, ShieldCheck, CreditCard } from 'lucide-react';

interface BalanceCardProps {
  account: BankAccount;
  totalDeposits: number;
  totalWithdrawals: number;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onViewHistory: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  account,
  totalDeposits,
  totalWithdrawals,
  onOpenDeposit,
  onOpenWithdraw,
  onViewHistory,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [copiedPix, setCopiedPix] = useState(false);

  const handleCopyPix = () => {
    if (account.pix_key) {
      navigator.clipboard.writeText(account.pix_key);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Bank Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6">
          {/* Top Bar: Bank Brand & Account Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  {account.account_type === 'corrente' ? 'Conta Corrente Digital' : 'Conta Poupança'}
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">{account.client_name}</h2>
              </div>
            </div>

            {/* Account Identifiers */}
            <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
              <div className="bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
                <span className="text-slate-500 mr-1.5">AG:</span>
                <span className="text-slate-200">{account.agency}</span>
              </div>
              <div className="bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
                <span className="text-slate-500 mr-1.5">CONTA:</span>
                <span className="text-emerald-400 font-medium">{account.account_number}</span>
              </div>
            </div>
          </div>

          {/* Center Area: Primary Balance ("Ver Saldo") */}
          <div className="my-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Saldo Disponível</span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
                title={showBalance ? 'Ocultar saldo' : 'Exibir saldo'}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-baseline gap-3">
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight tabular-nums font-mono">
                {showBalance ? formatBRL(account.balance) : '••••••••'}
              </div>
              {showBalance && (
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Disponível para saque</span>
                </div>
              )}
            </div>

            {/* Pix Key Info */}
            {account.pix_key && (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <span>Chave Pix:</span>
                <span className="font-mono text-slate-300 select-all">{account.pix_key}</span>
                <button
                  onClick={handleCopyPix}
                  className="p-1 hover:text-white transition-colors"
                  title="Copiar Chave Pix"
                >
                  {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={onOpenDeposit}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.99]"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-100" />
              <span>Fazer Depósito</span>
            </button>

            <button
              onClick={onOpenWithdraw}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-sm font-semibold shadow-lg shadow-rose-950/50 transition-all active:scale-[0.99]"
            >
              <ArrowUpRight className="w-4 h-4 text-rose-100" />
              <span>Realizar Saque</span>
            </button>

            <button
              onClick={onViewHistory}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700/80 transition-all"
            >
              <span>Ver Extrato Completo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row: Deposits vs Withdrawals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Deposited */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total de Entradas (Depósitos)</span>
            <span className="text-xl font-bold text-emerald-400 tabular-nums font-mono mt-1 block">
              {showBalance ? `+ ${formatBRL(totalDeposits)}` : '••••••••'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total de Saídas (Saques)</span>
            <span className="text-xl font-bold text-rose-400 tabular-nums font-mono mt-1 block">
              {showBalance ? `- ${formatBRL(totalWithdrawals)}` : '••••••••'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Account Details & Document */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Titular da Conta</span>
            <span className="text-sm font-semibold text-slate-200 mt-0.5 block truncate max-w-[180px]">
              {account.client_name}
            </span>
            <span className="text-xs text-slate-400 font-mono mt-0.5 block">
              CPF: {account.document}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
