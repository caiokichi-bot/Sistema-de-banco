import React, { useState } from 'react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase.ts';
import { BankService } from '../services/bankService.ts';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  UploadCloud,
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose, onRefreshData }) => {
  if (!isOpen) return null;

  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
    loading?: boolean;
  }>({ tested: false });
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');

  const handleTestConnection = async () => {
    setTestStatus({ tested: false, loading: true });
    setSyncResult(null);

    const result = await testSupabaseConnection(url, anonKey);
    setTestStatus({
      tested: true,
      success: result.success,
      message: result.message,
      loading: false,
    });
  };

  const handleSaveCredentials = () => {
    saveSupabaseCredentials(url, anonKey);
    setTestStatus({
      tested: true,
      success: true,
      message: 'Credenciais salvas com sucesso! Recarregando contas...',
    });
    onRefreshData();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      // First save credentials
      saveSupabaseCredentials(url, anonKey);
      const res = await BankService.syncLocalToSupabase();
      setSyncResult(res);
      if (res.success) {
        onRefreshData();
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'Erro ao sincronizar dados.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Integração com Supabase</h2>
              <span className="text-xs text-slate-400 block -mt-0.5">
                Persistência em nuvem das contas, saldos, saques e depósitos
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Configurar Credenciais
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>2. Script SQL do Banco</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'config' ? (
            <>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
                <span className="font-semibold text-white block">Como conectar ao seu Supabase:</span>
                <p>
                  1. Acesse o painel do seu projeto no{' '}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>
                  .
                </p>
                <p>
                  2. Vá em <strong>Project Settings &gt; API</strong> e copie a <strong>Project URL</strong> e a{' '}
                  <strong>anon public key</strong>.
                </p>
                <p>
                  3. Cole as credenciais abaixo e clique em <strong>Salvar e Testar</strong>.
                </p>
              </div>

              {/* Status Message */}
              {testStatus.tested && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
                    testStatus.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block">{testStatus.success ? 'Conexão Estabelecida' : 'Aviso de Conexão'}</span>
                    <span>{testStatus.message}</span>
                  </div>
                </div>
              )}

              {syncResult && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
                    syncResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{syncResult.message}</span>
                </div>
              )}

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Supabase Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzabcdefghijklm.supabase.co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Supabase Anon Public API Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus.loading || !url}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {testStatus.loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    <span>Testar Conexão</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={syncing || !url || !anonKey}
                    title="Exporta dados locais para o Supabase"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-300 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{syncing ? 'Sincronizando...' : 'Sincronizar Dados Locais'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveCredentials}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Salvar Credenciais</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Esquema das Tabelas no Supabase</h3>
                  <p className="text-xs text-slate-400">
                    Copie o script abaixo e execute no <strong>SQL Editor</strong> do Supabase para criar as tabelas de contas e transações com RLS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-96 overflow-y-auto leading-relaxed select-all">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
