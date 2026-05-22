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

-- =====================================================================
-- Caso prefira manter o RLS ativo por algum motivo, você precisaria criar 
-- políticas explícitas permitindo ALL (todas as operações) para public:
--
-- CREATE POLICY "Permitir tudo para anon" ON config FOR ALL TO anon USING (true) WITH CHECK (true);
-- =====================================================================
