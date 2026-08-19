-- ==============================================================================
-- MIGRAÇÃO DE BANCO DE DADOS: ESTRUTURA TESES -> INDICATIVOS E SALAS DE OFICINA
-- ==============================================================================

-- 1. Atualizar Tabela de Teses (adicionar colunas de controle de oficina se necessário)
ALTER TABLE public.teses ADD COLUMN IF NOT EXISTS em_oficina BOOLEAN DEFAULT false;
ALTER TABLE public.teses ADD COLUMN IF NOT EXISTS oficina_concluida BOOLEAN DEFAULT false;

-- 2. Criar Tabela de Indicativos
CREATE TABLE IF NOT EXISTS public.indicativos (
    id BIGSERIAL PRIMARY KEY,
    tese_id BIGINT NOT NULL REFERENCES public.teses(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL DEFAULT 1,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tempo_votacao INTEGER NOT NULL DEFAULT 180,
    qr_code TEXT,
    slug TEXT,
    status TEXT NOT NULL DEFAULT 'Aguardando' CHECK (status IN ('Aguardando', 'Em votação', 'Encerrada')),
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Criar Tabela de Usuários das Salas de Oficina
CREATE TABLE IF NOT EXISTS public.oficina_usuarios (
    id BIGSERIAL PRIMARY KEY,
    tese_id BIGINT NOT NULL REFERENCES public.teses(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nome_operador TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Atualizar Tabela de Votos para referenciar 'indicativo_id'
ALTER TABLE public.votos ADD COLUMN IF NOT EXISTS indicativo_id BIGINT REFERENCES public.indicativos(id) ON DELETE CASCADE;

-- Criar índice e restrição única para voto por indicativo e CPF
CREATE INDEX IF NOT EXISTS idx_votos_indicativo_id ON public.votos(indicativo_id);
CREATE INDEX IF NOT EXISTS idx_indicativos_tese_id ON public.indicativos(tese_id);
CREATE INDEX IF NOT EXISTS idx_indicativos_status ON public.indicativos(status);

-- Remover restrição antiga de unicidade em teses se existir e adicionar no indicativo
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'votos_indicativo_cpf_unique'
    ) THEN
        ALTER TABLE public.votos DROP CONSTRAINT votos_indicativo_cpf_unique;
    END IF;
    
    -- Tentar adicionar constraint se não existir
    BEGIN
        ALTER TABLE public.votos ADD CONSTRAINT votos_indicativo_cpf_unique UNIQUE (indicativo_id, cpf);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- 5. Habilitar Segurança por Linha (RLS)
ALTER TABLE public.indicativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oficina_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Permitir leitura pública de indicativos" ON public.indicativos;
CREATE POLICY "Permitir leitura pública de indicativos" ON public.indicativos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento de indicativos" ON public.indicativos;
CREATE POLICY "Permitir gerenciamento de indicativos" ON public.indicativos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso a oficina_usuarios" ON public.oficina_usuarios;
CREATE POLICY "Permitir acesso a oficina_usuarios" ON public.oficina_usuarios FOR ALL USING (true) WITH CHECK (true);

-- Permissões
GRANT ALL ON TABLE public.indicativos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.oficina_usuarios TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Configurar Supabase Realtime para indicativos e usuarios
ALTER TABLE public.indicativos REPLICA IDENTITY FULL;
ALTER TABLE public.oficina_usuarios REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'indicativos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.indicativos;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'oficina_usuarios'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.oficina_usuarios;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
