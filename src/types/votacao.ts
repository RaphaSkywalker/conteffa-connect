export type TeseStatus = 'Aguardando' | 'Em votação' | 'Encerrada';

export type VotoTipo = 'SIM' | 'NAO' | 'ABSTER';

export interface Tese {
    id: number | string;
    numero: number;
    titulo: string;
    descricao?: string;
    tempo_votacao: number; // em segundos
    qr_code?: string;
    slug?: string;
    status: TeseStatus;
    data_inicio?: string | null;
    data_fim?: string | null;
    criado_em?: string;
    atualizado_em?: string;
}

export interface Voto {
    id?: number | string;
    tese_id: number | string;
    inscrito_id?: number | string | null;
    cpf: string;
    voto: VotoTipo;
    ip?: string;
    user_agent?: string;
    data_hora?: string;
}

export interface VotacaoStats {
    tese_id: number | string;
    total_inscritos: number;
    total_votantes: number;
    percentual_participacao: number;
    total_sim: number;
    total_nao: number;
    total_abster: number;
    percentual_sim: number;
    percentual_nao: number;
    percentual_abster: number;
}

export interface InscritoValidado {
    id: number | string;
    nomeCompleto: string;
    cpf: string;
    cargo?: string;
    ateffa?: string;
}
