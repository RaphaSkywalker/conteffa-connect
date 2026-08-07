-- =====================================================================
-- SCRIPT DE AJUSTE DE SEGURANÇA (RLS) NO SUPABASE
-- Execute este script no SQL Editor do seu painel do Supabase.
-- =====================================================================

-- Como o sistema utiliza um controle de login customizado (lendo a tabela public.users)
-- em vez do sistema de autenticação nativo do Supabase (Auth/JWT), todas as requisições 
-- do painel administrativo chegam ao Supabase com o papel (role) 'anon' (anônimo).
--
-- As tabelas abaixo estão com RLS (Row Level Security) ativado, o que impede que o 
-- papel 'anon' faça alterações (UPDATE/DELETE). Desativar o RLS ou liberar as permissões 
-- para 'anon' é necessário para que as atualizações funcionem e fiquem salvas.

-- Opção recomendada para compatibilidade com a arquitetura atual do projeto:
-- Desativar RLS nas tabelas gerenciadas pelo painel admin.

ALTER TABLE config DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
ALTER TABLE speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE programming DISABLE ROW LEVEL SECURITY;
ALTER TABLE albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Garantir que a tabela config possui a chave de regimento (opcional)
INSERT INTO config (key, value) VALUES ('regimento_interno', '{}') ON CONFLICT (key) DO NOTHING;

-- =====================================================================
-- COLUNAS DE ANEXOS PARA A TABELA DE NOTÍCIAS (NEWS)
-- =====================================================================
ALTER TABLE news ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS attachments text;

-- =====================================================================
-- COLUNAS PARA A TABELA DE PALESTRANTES (SPEAKERS)
-- =====================================================================
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS cargo text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS photo text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS twitter text;

-- =====================================================================
-- COLUNAS PARA A TABELA DE COMISSÃO / CONVIDADOS (GUESTS)
-- =====================================================================
ALTER TABLE guests ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS cargo text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS photo text;

-- =====================================================================
-- COLUNAS PARA A TABELA DE PROGRAMAÇÃO (PROGRAMMING)
-- =====================================================================
ALTER TABLE programming ADD COLUMN IF NOT EXISTS date text;
ALTER TABLE programming ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE programming ADD COLUMN IF NOT EXISTS items text;

-- =====================================================================
-- Caso prefira manter o RLS ativo por algum motivo, você precisaria criar 
-- políticas explícitas permitindo ALL (todas as operações) para public:
--
-- CREATE POLICY "Permitir tudo para anon" ON config FOR ALL TO anon USING (true) WITH CHECK (true);
-- =====================================================================
