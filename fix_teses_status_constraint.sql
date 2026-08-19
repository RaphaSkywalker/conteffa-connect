-- ==============================================================================
-- AJUSTE DE RESTRIÇÃO CHECK: SUPABASE TABELAS TESES E INDICATIVOS
-- Execute este script no SQL Editor do Supabase para aceitar o status 'Liberada' e 'Concluída'
-- ==============================================================================

-- 1. Atualizar a restrição de CHECK para a tabela 'teses'
ALTER TABLE public.teses DROP CONSTRAINT IF EXISTS teses_status_check;

ALTER TABLE public.teses ADD CONSTRAINT teses_status_check
CHECK (status IN ('Aguardando', 'Em Oficina', 'Concluída', 'Liberada', 'Em votação', 'Encerrada'));

-- 2. Atualizar a restrição de CHECK para a tabela 'indicativos'
ALTER TABLE public.indicativos DROP CONSTRAINT IF EXISTS indicativos_status_check;

ALTER TABLE public.indicativos ADD CONSTRAINT indicativos_status_check
CHECK (status IN ('Aguardando', 'Em Oficina', 'Concluída', 'Liberada', 'Em votação', 'Encerrada'));
