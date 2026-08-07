-- ==============================================================================
-- MIGRAÇÃO & AJUSTE: MÓDULO DE VOTAÇÃO ONLINE POR QR CODE (CONTEFFA)
-- ==============================================================================

-- 1. Criar Tabela de Teses (se não existir)
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

-- 2. Criar Tabela de Votos (se não existir)
CREATE TABLE IF NOT EXISTS public.votos (
    id BIGSERIAL PRIMARY KEY,
    tese_id BIGINT NOT NULL REFERENCES public.teses(id) ON DELETE CASCADE,
    inscrito_id TEXT,
    cpf TEXT NOT NULL,
    voto TEXT NOT NULL CHECK (voto IN ('SIM', 'NAO', 'ABSTER')),
    ip TEXT,
    user_agent TEXT,
    data_hora TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT votos_tese_cpf_unique UNIQUE (tese_id, cpf)
);

-- 3. Atualizar coluna 'inscrito_id' para TEXT caso a tabela já tenha sido criada como BIGINT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'votos' AND column_name = 'inscrito_id' AND data_type != 'text'
    ) THEN
        ALTER TABLE public.votos ALTER COLUMN inscrito_id TYPE TEXT USING inscrito_id::text;
    END IF;
END $$;

-- 4. Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_teses_numero ON public.teses(numero);
CREATE INDEX IF NOT EXISTS idx_teses_status ON public.teses(status);
CREATE INDEX IF NOT EXISTS idx_votos_tese_id ON public.votos(tese_id);
CREATE INDEX IF NOT EXISTS idx_votos_cpf ON public.votos(cpf);

-- 5. Habilitar Segurança por Linha (RLS)
ALTER TABLE public.teses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Segurança (RLS) para 'teses'
DROP POLICY IF EXISTS "Permitir leitura pública de teses" ON public.teses;
CREATE POLICY "Permitir leitura pública de teses" 
ON public.teses FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento de teses por todos" ON public.teses;
CREATE POLICY "Permitir gerenciamento de teses por todos" 
ON public.teses FOR ALL 
USING (true) 
WITH CHECK (true);

-- 7. Políticas de Segurança (RLS) para 'votos'
DROP POLICY IF EXISTS "Permitir leitura de votos para contagem" ON public.votos;
CREATE POLICY "Permitir leitura de votos para contagem" 
ON public.votos FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir inserção de voto único" ON public.votos;
CREATE POLICY "Permitir inserção de voto único" 
ON public.votos FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir deleção de votos" ON public.votos;
CREATE POLICY "Permitir deleção de votos" 
ON public.votos FOR DELETE 
USING (true);

-- 8. Conceder Permissões para os Papeis Públicos e Autenticados
GRANT ALL ON TABLE public.teses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.votos TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 9. Configurar Replica Identity para Supabase Realtime
ALTER TABLE public.teses REPLICA IDENTITY FULL;
ALTER TABLE public.votos REPLICA IDENTITY FULL;

-- 10. Publicação em Tempo Real (Supabase Realtime)
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
        NULL;
END $$;
