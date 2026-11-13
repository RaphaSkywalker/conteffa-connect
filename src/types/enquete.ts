export type EnqueteTipo = 'individual' | 'disputa';

export type EnqueteStatus = 'Aguardando' | 'Em votação' | 'Encerrada';

export type EnqueteVotoTipo = 'SIM' | 'NAO';

export interface EnqueteOpcao {
    id: number;
    enquete_id: number;
    titulo: string;
    ordem: number;
}

export interface Enquete {
    id: number;
    titulo: string;
    descricao?: string | null;
    tipo: EnqueteTipo;
    status: EnqueteStatus;
    data_inicio?: string | null;
    data_fim?: string | null;
    criado_em?: string;
    opcoes: EnqueteOpcao[];
}

export interface EnqueteInput {
    id?: number;
    titulo: string;
    descricao?: string;
    tipo: EnqueteTipo;
    opcoes: { id?: number; titulo: string }[];
}

export interface EnqueteVotoInput {
    opcao_id: number;
    /** SIM/NAO na enquete individual; null na disputa */
    voto: EnqueteVotoTipo | null;
}

export interface OpcaoResultado {
    opcao_id: number;
    titulo: string;
    sim: number;
    nao: number;
    total: number;
    percentual_sim: number;
    percentual_nao: number;
    /** Participação da opção no total de votos (usado na disputa) */
    percentual: number;
}

export interface EnqueteResultados {
    total_votantes: number;
    total_inscritos: number;
    percentual_participacao: number;
    opcoes: OpcaoResultado[];
}

