import React, { useRef } from 'react';
import { BankAccount, BankTransaction } from '../types/bank.ts';
import { formatBRL } from '../services/bankService.ts';
import { CheckCircle2, X, Printer, ShieldCheck, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface ReceiptModalProps {
  transaction: BankTransaction;
  account: BankAccount;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, account, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const isDeposit = transaction.type === 'deposit';

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(transaction.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = new Date(transaction.created_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Comprovante Oficial de Operação
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 bg-slate-900 text-slate-100">
          {/* Bank Brand & Status */}
          <div className="text-center pb-4 border-b border-dashed border-slate-800">
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
                isDeposit
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isDeposit ? <ArrowDownRight className="w-7 h-7" /> : <ArrowUpRight className="w-7 h-7" />}
            </div>

            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block mb-1">
              Transação Realizada com Sucesso
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isDeposit ? 'Comprovante de Depósito' : 'Comprovante de Saque'}
            </h2>
            <div className="text-3xl font-extrabold font-mono tabular-nums mt-3 text-white">
              {isDeposit ? '+ ' : '- '}
              {formatBRL(transaction.amount)}
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Instituição:</span>
              <span className="text-slate-200 font-semibold">Nexus Bank S.A. (Código 492)</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Titular da Conta:</span>
              <span className="text-slate-200 font-semibold">{account.client_name}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">CPF:</span>
              <span className="text-slate-300 font-mono">{account.document}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Agência / Conta:</span>
              <span className="text-slate-200 font-mono">
                Ag {account.agency} · Conta {account.account_number}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Canal / Categoria:</span>
              <span className="text-slate-200">{transaction.category}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Descrição / Motivo:</span>
              <span className="text-slate-200">{transaction.description}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Data e Hora:</span>
              <span className="text-slate-200 font-mono">
                {formattedDate} às {formattedTime}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Saldo Anterior:</span>
              <span className="text-slate-300 font-mono tabular-nums">
                {formatBRL(transaction.balance_before)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-semibold">Saldo Atualizado:</span>
              <span className="text-emerald-400 font-bold font-mono tabular-nums">
                {formatBRL(transaction.balance_after)}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 block mb-1">Código de Autenticação Digital:</span>
              <span className="text-slate-400 font-mono text-[11px] block break-all bg-slate-950 p-2 rounded-lg border border-slate-800 select-all">
                {transaction.id.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Concluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
