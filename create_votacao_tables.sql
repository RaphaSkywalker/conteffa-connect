-- ==============================================================================
-- MIGRAÇÃO: MÓDULO DE VOTAÇÃO ONLINE POR QR CODE (CONTEFFA)
-- ==============================================================================

-- 1. Criar Tabela de Teses
CREATE TABLE IF NOT EXISTS public.teses (
    id BIGSERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tempo_votacao INTEGER NOT NULL DEFAULT 180, -- tempo em segundos
    qr_code TEXT,
    slug TEXT,
    status TEXT NOT NULL DEFAULT 'Aguardando' CHECK (status IN ('Aguardando', 'Em votação', 'Encerrada')),
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar Tabela de Votos
CREATE TABLE IF NOT EXISTS public.votos (
    id BIGSERIAL PRIMARY KEY,
    tese_id BIGINT NOT NULL REFERENCES public.teses(id) ON DELETE CASCADE,
    inscrito_id BIGINT,
    cpf TEXT NOT NULL,
    voto TEXT NOT NULL CHECK (voto IN ('SIM', 'NAO', 'ABSTER')),
    ip TEXT,
    user_agent TEXT,
    data_hora TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT votos_tese_cpf_unique UNIQUE (tese_id, cpf)
);

-- 3. Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_teses_numero ON public.teses(numero);
CREATE INDEX IF NOT EXISTS idx_teses_status ON public.teses(status);
CREATE INDEX IF NOT EXISTS idx_votos_tese_id ON public.votos(tese_id);
CREATE INDEX IF NOT EXISTS idx_votos_cpf ON public.votos(cpf);

-- 4. Habilitar Segurança por Linha (RLS)
ALTER TABLE public.teses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS) para 'teses'
DROP POLICY IF EXISTS "Permitir leitura pública de teses" ON public.teses;
CREATE POLICY "Permitir leitura pública de teses" 
ON public.teses FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento de teses por todos" ON public.teses;
CREATE POLICY "Permitir gerenciamento de teses por todos" 
ON public.teses FOR ALL 
USING (true) 
WITH CHECK (true);

-- 6. Políticas de Segurança (RLS) para 'votos'
DROP POLICY IF EXISTS "Permitir leitura de votos para contagem" ON public.votos;
CREATE POLICY "Permitir leitura de votos para contagem" 
ON public.votos FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir inserção de voto único" ON public.votos;
CREATE POLICY "Permitir inserção de voto único" 
ON public.votos FOR INSERT 
WITH CHECK (true);

-- 7. Publicação em Tempo Real (Supabase Realtime)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'teses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.teses;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'votos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.votos;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Caso a publicação já contenha as tabelas
END $$;
