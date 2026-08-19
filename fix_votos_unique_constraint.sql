-- =========================================================================
-- FIX: RESTRICAO DE UNICIDADE DA TABELA VOTOS (POR INDICATIVO AO INVES DE TESE)
-- Executar no Editor SQL do Supabase
-- =========================================================================

-- 1. Remover a restrição antiga baseada em (tese_id, cpf) se ela existir
ALTER TABLE public.votos DROP CONSTRAINT IF EXISTS votos_tese_cpf_unique;
ALTER TABLE public.votos DROP CONSTRAINT IF EXISTS votos_indicativo_cpf_unique;

-- 2. Garantir que a coluna indicativo_id existe na tabela votos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'votos' 
        AND column_name = 'indicativo_id'
    ) THEN
        ALTER TABLE public.votos ADD COLUMN indicativo_id BIGINT REFERENCES public.indicativos(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Criar a nova restrição de unicidade por (indicativo_id, cpf)
-- Permitindo que o mesmo CPF vote em múltiplos indicativos da mesma tese,
-- mas impedindo votos duplicados no MESMO indicativo.
ALTER TABLE public.votos ADD CONSTRAINT votos_indicativo_cpf_unique UNIQUE (indicativo_id, cpf);
