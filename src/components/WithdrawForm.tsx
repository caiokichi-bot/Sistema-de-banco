import React, { useState } from 'react';
import { BankAccount, BankTransaction } from '../types/bank.ts';
import { BankService, formatBRL } from '../services/bankService.ts';
import { ArrowUpRight, AlertTriangle, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';

interface WithdrawFormProps {
  account: BankAccount;
  onSuccess: (transaction: BankTransaction, newBalance: number) => void;
  onCancel: () => void;
}

const WITHDRAW_PRESETS = [20, 50, 100, 200, 500, 1000];

const WITHDRAW_CATEGORIES = [
  'Saque Caixa 24h',
  'Saque Agência Física',
  'Transferência Pix',
  'Pagamento de Boleto',
  'Transferência TED/DOC',
  'Outros',
];

export const WithdrawForm: React.FC<WithdrawFormProps> = ({ account, onSuccess, onCancel }) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<string>('Saque Caixa 24h');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numericAmount = parseFloat(amountStr.replace(',', '.')) || 0;
  const isOverdrawn = numericAmount > account.balance;
  const projectedBalance = account.balance - numericAmount;

  const handleSetExact = (value: number) => {
    setAmountStr(value.toFixed(2));
    setErrorMessage(null);
  };

  const handleWithdrawAll = () => {
    setAmountStr(account.balance.toFixed(2));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validação estrita: valor positivo
    if (numericAmount <= 0) {
      setErrorMessage('O valor do saque deve ser maior que zero (R$ 0,00).');
      return;
    }

    // 2. Validação estrita: saldo suficiente (requisito crítico do usuário)
    if (numericAmount > account.balance) {
      const deficit = Number((numericAmount - account.balance).toFixed(2));
      setErrorMessage(
        `Erro de Saldo Insuficiente! O valor solicitado para saque (${formatBRL(numericAmount)}) é MAIOR que o saldo disponível em sua conta (${formatBRL(account.balance)}). Faltam ${formatBRL(deficit)} para possibilitar este saque.`
      );
      return;
    }

    setLoading(true);
    try {
      const result = await BankService.withdraw({
        account_id: account.id,
        amount: numericAmount,
        description: description.trim() || `Saque via ${category}`,
        category,
      });

      if (result.success && result.transaction && result.new_balance !== undefined) {
        onSuccess(result.transaction, result.new_balance);
      } else {
        // Exibe o erro de saque retornado pelo serviço bancário
        setErrorMessage(result.message || 'Falha ao processar o saque.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao realizar o saque.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 max-w-2xl mx-auto shadow-xl">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Realizar Saque</h2>
            <p className="text-xs text-slate-400">
              Debitando da conta <span className="font-mono text-slate-300 font-medium">{account.account_number}</span> ({account.client_name})
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block">Saldo Disponível</span>
          <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
            {formatBRL(account.balance)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dynamic Warning Banner if amount > balance */}
        {isOverdrawn && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3 animate-shake">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-200 block text-base">Saque Negado: Saldo Insuficiente!</span>
              <p className="text-xs text-rose-300/90 mt-1">
                Você está tentando sacar <strong className="text-rose-100 font-mono">{formatBRL(numericAmount)}</strong>, mas seu saldo atual é de apenas{' '}
                <strong className="text-emerald-300 font-mono">{formatBRL(account.balance)}</strong>.
              </p>
              <p className="text-xs text-rose-400 mt-1 font-mono">
                Déficit necessário: {formatBRL(numericAmount - account.balance)}
              </p>
            </div>
          </div>
        )}

        {/* Generic Error Alert */}
        {errorMessage && !isOverdrawn && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Erro na Operação</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="withdraw-amount-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Valor do Saque (R$)
            </label>
            <button
              type="button"
              onClick={handleWithdrawAll}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              Sacar Saldo Total ({formatBRL(account.balance)})
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-lg pointer-events-none">
              R$
            </span>
            <input
              id="withdraw-amount-input"
              type="number"
              step="0.01"
              min="0.01"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="0,00"
              autoFocus
              className={`w-full bg-slate-950 border rounded-xl pl-14 pr-4 py-3.5 text-2xl font-bold font-mono tabular-nums placeholder:text-slate-700 focus:outline-none transition-colors ${
                isOverdrawn
                  ? 'border-rose-500 text-rose-400 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-800 text-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              }`}
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="block text-xs font-medium text-slate-400 mb-2">Valores rápidos pré-definidos:</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {WITHDRAW_PRESETS.map((val) => {
              const exceeds = val > account.balance;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSetExact(val)}
                  className={`py-2 px-2 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                    numericAmount === val
                      ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                      : exceeds
                      ? 'border-slate-800/60 bg-slate-950/40 text-slate-500 hover:text-slate-400'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                  title={exceeds ? `Valor maior que o saldo atual de ${formatBRL(account.balance)}` : undefined}
                >
                  R$ {val}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="withdraw-method-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Canal / Tipo de Saque
            </label>
            <select
              id="withdraw-method-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors"
            >
              {WITHDRAW_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="withdraw-desc-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Motivo / Observação (Opcional)
            </label>
            <input
              id="withdraw-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Despesas pessoais, Pagamento..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
        </div>

        {/* Live Balance Projection */}
        {numericAmount > 0 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Saldo Atual:</span>
              <span className="font-mono tabular-nums text-slate-300">{formatBRL(account.balance)}</span>
            </div>
            <div className="flex justify-between text-rose-400 font-medium">
              <span>Valor do Débito (Saque):</span>
              <span className="font-mono tabular-nums">- {formatBRL(numericAmount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Saldo Restante Previsto:</span>
              <span
                className={`font-mono tabular-nums ${
                  isOverdrawn ? 'text-rose-400 font-bold' : 'text-slate-200'
                }`}
              >
                {isOverdrawn ? `Negativo (${formatBRL(projectedBalance)})` : formatBRL(projectedBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading || numericAmount <= 0 || isOverdrawn}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all active:scale-[0.99] ${
              isOverdrawn
                ? 'bg-rose-900/60 opacity-60 cursor-not-allowed border border-rose-700/50'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span>Processando...</span>
            ) : isOverdrawn ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-300" />
                <span>Saldo Insuficiente</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Saque</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
