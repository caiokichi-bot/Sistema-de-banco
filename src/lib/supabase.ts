import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_SUPABASE_URL = 'nexus_bank_supabase_url';
const STORAGE_KEY_SUPABASE_ANON_KEY = 'nexus_bank_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // First check localStorage for user-provided configuration
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SUPABASE_URL) : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SUPABASE_ANON_KEY) : null;

  if (storedUrl && storedKey) {
    return { url: storedUrl.trim(), anonKey: storedKey.trim() };
  }

  // Fallback to Vite environment variables
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  return {
    url: envUrl.trim(),
    anonKey: envKey.trim(),
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
      localStorage.setItem(STORAGE_KEY_SUPABASE_ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
      localStorage.removeItem(STORAGE_KEY_SUPABASE_ANON_KEY);
    }
  }
  // Reset cached client
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || url.includes('your-project') || anonKey.includes('your-anon')) {
    return null;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
      },
    });
    return cachedClient;
  } catch (error) {
    console.error('Erro ao inicializar cliente Supabase:', error);
    return null;
  }
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string }> {
  try {
    let client: SupabaseClient | null;
    if (url && anonKey) {
      client = createClient(url.trim(), anonKey.trim(), { auth: { persistSession: false } });
    } else {
      client = getSupabaseClient();
    }

    if (!client) {
      return {
        success: false,
        message: 'Credenciais do Supabase ausentes ou incompletas (URL e Chave Anon necessárias).',
      };
    }

    // Try a lightweight query
    const { error } = await client.from('accounts').select('id').limit(1);

    if (error) {
      // Check if it's a table not found error (which means connection worked, but schema is missing)
      if (error.code === '42P01' || error.message.includes('relation "public.accounts" does not exist') || error.message.includes('not found')) {
        return {
          success: true,
          message: 'Conexão com o Supabase estabelecida! Note que as tabelas ainda não foram criadas. Copie e execute o script SQL abaixo no SQL Editor do Supabase.',
        };
      }
      return {
        success: false,
        message: `Falha na conexão: ${error.message} (Código: ${error.code || 'Desconhecido'})`,
      };
    }

    return {
      success: true,
      message: 'Conexão com o Supabase validada com sucesso! As tabelas estão prontas.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao testar conexão: ${err.message || 'Verifique sua URL e Chave Anon.'}`,
    };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- NEXUS BANK - SCRIPT DE CRIAÇÃO DO BANCO DE DADOS NO SUPABASE
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- ==============================================================================

-- 1. Criar tabela de contas bancárias
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT UNIQUE NOT NULL,
  agency TEXT NOT NULL DEFAULT '0001',
  client_name TEXT NOT NULL,
  document TEXT NOT NULL,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  account_type TEXT NOT NULL DEFAULT 'corrente',
  pix_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criar tabela de transações bancárias
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  balance_before NUMERIC(15, 2) NOT NULL,
  balance_after NUMERIC(15, 2) NOT NULL CHECK (balance_after >= 0),
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed'
);

-- 3. Índices para performance em buscas e extratos
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 4. Habilitar Segurança por Linha (RLS)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas para permitir leitura e escrita com a chave anon
DROP POLICY IF EXISTS "Permitir acesso completo a contas" ON public.accounts;
CREATE POLICY "Permitir acesso completo a contas" ON public.accounts
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a transacoes" ON public.transactions;
CREATE POLICY "Permitir acesso completo a transacoes" ON public.transactions
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Inserir conta inicial de demonstração
INSERT INTO public.accounts (account_number, agency, client_name, document, balance, account_type, pix_key)
VALUES 
  ('04289-7', '0001', 'Caio Silva', '384.921.804-12', 3500.00, 'corrente', 'caio.silva@nexusbank.com.br'),
  ('18503-4', '0001', 'Ana Clara Souza', '412.873.190-88', 1250.50, 'poupanca', 'anaclara@nexusbank.com.br')
ON CONFLICT (account_number) DO NOTHING;
`;
