import React from 'react';
import { BankAccount } from '../types/bank.ts';
import { Database, Plus, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  accounts: BankAccount[];
  selectedAccount: BankAccount | null;
  onSelectAccount: (account: BankAccount) => void;
  onOpenNewAccount: () => void;
  onOpenSupabase: () => void;
  isSupabaseConnected: boolean;
  activeTab: 'overview' | 'deposit' | 'withdraw' | 'history';
  setActiveTab: (tab: 'overview' | 'deposit' | 'withdraw' | 'history') => void;
}

export const Header: React.FC<HeaderProps> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  onOpenNewAccount,
  onOpenSupabase,
  isSupabaseConnected,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Zone 1: Single text wordmark & Brand mark */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
              <span className="font-mono">N</span>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">Nexus Bank</span>
              <span className="text-xs text-slate-400 block -mt-0.5">Sistema de Gestão Financeira</span>
            </div>
          </div>

          {/* Mobile Supabase toggle */}
          <div className="md:hidden">
            <button
              onClick={onOpenSupabase}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                isSupabaseConnected
                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                  : 'border-amber-500/30 bg-amber-950/40 text-amber-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSupabaseConnected ? 'Supabase' : 'Configurar DB'}</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
            }`}
          >
            <span>+</span> Depósito
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'withdraw'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
            }`}
          >
            <span>-</span> Saque
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Extrato
          </button>
        </nav>

        {/* Zone 3: Account Selector & Database Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Account Selector */}
          <div className="relative group min-w-[200px]">
            <select
              aria-label="Selecionar Conta Bancária"
              value={selectedAccount?.id || ''}
              onChange={(e) => {
                const found = accounts.find((a) => a.id === e.target.value);
                if (found) onSelectAccount(found);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium appearance-none cursor-pointer hover:border-slate-700 focus:outline-none focus:border-emerald-500 pr-8 transition-colors"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-slate-900 text-slate-200">
                  {acc.client_name} (Cc: {acc.account_number})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* New Account Button */}
          <button
            onClick={onOpenNewAccount}
            title="Criar nova conta de cliente"
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Nova Conta</span>
          </button>

          {/* Supabase Status Button */}
          <button
            onClick={onOpenSupabase}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
              isSupabaseConnected
                ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/60'
                : 'border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-950/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Configurar Supabase'}</span>
            {isSupabaseConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
