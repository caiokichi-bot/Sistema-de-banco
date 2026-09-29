import React, { useState } from 'react';
import { BankAccount, BankTransaction } from '../types/bank.ts';
import { BankService, formatBRL } from '../services/bankService.ts';
import { ArrowDownRight, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface DepositFormProps {
  account: BankAccount;
  onSuccess: (transaction: BankTransaction, newBalance: number) => void;
  onCancel: () => void;
}

const DEPOSIT_PRESETS = [50, 100, 200, 500, 1000, 2500];

const DEPOSIT_CATEGORIES = [
  'Depósito em Dinheiro',
  'Transferência Pix',
  'Transferência TED/DOC',
  'Salário / Proventos',
  'Boleto Bancário',
  'Outros',
];

export const DepositForm: React.FC<DepositFormProps> = ({ account, onSuccess, onCancel }) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<string>('Depósito em Dinheiro');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numericAmount = parseFloat(amountStr.replace(',', '.')) || 0;
  const projectedBalance = account.balance + numericAmount;

  const handleAddPreset = (value: number) => {
    const current = numericAmount;
    const next = (current + value).toFixed(2);
    setAmountStr(next);
    setErrorMessage(null);
  };

  const handleSetExact = (value: number) => {
    setAmountStr(value.toFixed(2));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (numericAmount <= 0) {
      setErrorMessage('Por favor, informe um valor válido e maior que R$ 0,00 para depósito.');
      return;
    }

    setLoading(true);
    try {
      const result = await BankService.deposit({
        account_id: account.id,
        amount: numericAmount,
        description: description.trim() || `Depósito via ${category}`,
        category,
      });

      if (result.success && result.transaction && result.new_balance !== undefined) {
        onSuccess(result.transaction, result.new_balance);
      } else {
        setErrorMessage(result.message || 'Falha ao processar o depósito.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro inesperado ao realizar o depósito.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 max-w-2xl mx-auto shadow-xl">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Efetuar Depósito</h2>
            <p className="text-xs text-slate-400">
              Creditando na conta <span className="font-mono text-slate-300 font-medium">{account.account_number}</span> ({account.client_name})
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block">Saldo Atual</span>
          <span className="text-sm font-bold text-white font-mono tabular-nums">
            {formatBRL(account.balance)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Atenção</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label htmlFor="deposit-amount-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Valor do Depósito (R$)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-lg pointer-events-none">
              R$
            </span>
            <input
              id="deposit-amount-input"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-14 pr-4 py-3.5 text-2xl font-bold font-mono tabular-nums text-emerald-400 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="block text-xs font-medium text-slate-400 mb-2">Valores rápidos pré-definidos:</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {DEPOSIT_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSetExact(val)}
                className={`py-2 px-2 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                  numericAmount === val
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                +{val}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deposit-method-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Forma / Origem
            </label>
            <select
              id="deposit-method-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {DEPOSIT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="deposit-desc-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Descrição / Observação (Opcional)
            </label>
            <input
              id="deposit-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pagamento de serviços, Depósito mensal..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
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
            <div className="flex justify-between text-emerald-400 font-medium">
              <span>Valor do Depósito:</span>
              <span className="font-mono tabular-nums">+ {formatBRL(numericAmount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Saldo Após o Depósito:</span>
              <span className="font-mono tabular-nums text-emerald-400">{formatBRL(projectedBalance)}</span>
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
            disabled={loading || numericAmount <= 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.99]"
          >
            {loading ? (
              <span>Processando...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Depósito</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
