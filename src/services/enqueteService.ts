import { supabase } from "@/lib/supabase";
import { getClientIP, getTotalInscritosCount } from "@/services/votacaoService";
import {
    Enquete,
    EnqueteInput,
    EnqueteResultados,
    EnqueteStatus,
    EnqueteVotoInput,
} from "@/types/enquete";

const ENQUETE_SELECT = "*, opcoes:enquete_opcoes(*)";

const sortOpcoes = (enquete: Enquete): Enquete => ({
    ...enquete,
    opcoes: [...(enquete.opcoes || [])].sort((a, b) => a.ordem - b.ordem),
});

// ==========================================
// CRUD DE ENQUETES
// ==========================================

export const getEnquetes = async (): Promise<Enquete[]> => {
    const { data, error } = await supabase
        .from("enquetes")
        .select(ENQUETE_SELECT)
        .order("criado_em", { ascending: false });

    if (error) throw error;
    return (data || []).map(sortOpcoes);
};

export const getEnqueteById = async (id: number | string): Promise<Enquete | null> => {
    const { data, error } = await supabase
        .from("enquetes")
        .select(ENQUETE_SELECT)
        .eq("id", Number(id))
        .maybeSingle();

    if (error) throw error;
    return data ? sortOpcoes(data) : null;
};

export const saveEnquete = async (input: EnqueteInput): Promise<void> => {
    const payload = {
        titulo: input.titulo.trim(),
        descricao: input.descricao?.trim() || null,
        tipo: input.tipo,
    };

    let enqueteId = input.id;

    if (enqueteId) {
        const { error } = await supabase.from("enquetes").update(payload).eq("id", enqueteId);
        if (error) throw error;
    } else {
        const { data, error } = await supabase.from("enquetes").insert([payload]).select("id").single();
        if (error) throw error;
        enqueteId = data.id;
    }

    const opcoes = input.opcoes
        .map((o, idx) => ({ ...o, titulo: o.titulo.trim(), ordem: idx + 1 }))
        .filter((o) => o.titulo);

    // Remover opções excluídas no formulário
    const keepIds = opcoes.filter((o) => o.id).map((o) => o.id as number);
    let deleteQuery = supabase.from("enquete_opcoes").delete().eq("enquete_id", enqueteId);
    if (keepIds.length > 0) {
        deleteQuery = deleteQuery.not("id", "in", `(${keepIds.join(",")})`);
    }
    const { error: delError } = await deleteQuery;
    if (delError) throw delError;

    for (const opcao of opcoes) {
        const row = { enquete_id: enqueteId, titulo: opcao.titulo, ordem: opcao.ordem };
        const { error } = opcao.id
            ? await supabase.from("enquete_opcoes").update(row).eq("id", opcao.id)
            : await supabase.from("enquete_opcoes").insert([row]);
        if (error) throw error;
    }
};

export const deleteEnquete = async (id: number): Promise<void> => {
    const { error } = await supabase.from("enquetes").delete().eq("id", id);
    if (error) throw error;
};

const updateStatus = async (id: number, status: EnqueteStatus, extra: Record<string, unknown>) => {
    const { error } = await supabase.from("enquetes").update({ status, ...extra }).eq("id", id);
    if (error) throw error;
};

export const iniciarEnquete = (id: number) =>
    updateStatus(id, "Em votação", { data_inicio: new Date().toISOString(), data_fim: null });

export const encerrarEnquete = (id: number) =>
    updateStatus(id, "Encerrada", { data_fim: new Date().toISOString() });

export const zerarVotosEnquete = async (id: number): Promise<void> => {
    const { error } = await supabase.from("enquete_votos").delete().eq("enquete_id", id);
    if (error) throw error;
    await updateStatus(id, "Aguardando", { data_inicio: null, data_fim: null });
};

// ==========================================
// VOTOS
// ==========================================

/** Retorna os IDs das opções em que o IP já votou nesta enquete */
export const getOpcoesVotadasPorIp = async (enqueteId: number, rawIp: string): Promise<number[]> => {
    const cleanIp = (rawIp || "").trim();
    if (!cleanIp) return [];

    const { data, error } = await supabase
        .from("enquete_votos")
        .select("opcao_id")
        .eq("enquete_id", enqueteId)
        .eq("cpf", cleanIp);

    if (error) throw error;
    return (data || []).map((v) => v.opcao_id);
};

export const getOpcoesVotadasPorCpf = getOpcoesVotadasPorIp;

export const submitVotosEnquete = async (params: {
    enqueteId: number;
    ip?: string;
    cpf?: string;
    inscritoId?: string | number | null;
    votos: EnqueteVotoInput[];
}): Promise<{ success: boolean; message: string }> => {
    const clientIp = (params.ip || params.cpf || await getClientIP()).trim();
    const enquete = await getEnqueteById(params.enqueteId);

    if (!enquete) return { success: false, message: "Enquete não encontrada." };
    if (enquete.status !== "Em votação") {
        return {
            success: false,
            message: enquete.status === "Encerrada"
                ? "Esta enquete já foi encerrada."
                : "A votação desta enquete ainda não foi iniciada.",
        };
    }
    if (params.votos.length === 0) return { success: false, message: "Nenhum voto selecionado." };

    const isDisputa = enquete.tipo === "disputa";
    if (isDisputa && params.votos.length !== 1) {
        return { success: false, message: "Na disputa é permitido escolher apenas uma opção." };
    }

    const jaVotadas = await getOpcoesVotadasPorIp(enquete.id, clientIp);
    if (isDisputa && jaVotadas.length > 0) {
        return { success: false, message: "Você já votou neste processo. Não é permitido votar mais de uma vez com o mesmo IP." };
    }
    const pendentes = params.votos.filter((v) => !jaVotadas.includes(v.opcao_id));
    if (pendentes.length === 0) {
        return { success: false, message: "Você já votou neste processo. Não é permitido votar mais de uma vez com o mesmo IP." };
    }

    const rows = pendentes.map((v) => ({
        enquete_id: enquete.id,
        opcao_id: v.opcao_id,
        cpf: clientIp,
        inscrito_id: params.inscritoId ? String(params.inscritoId) : null,
        voto: isDisputa ? null : v.voto,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    }));

    const { error } = await supabase.from("enquete_votos").insert(rows);
    if (error) {
        if (error.code === "23505") {
            return { success: false, message: "Você já votou neste processo. Não é permitido votar mais de uma vez com o mesmo IP." };
        }
        console.error("Erro ao registrar voto da enquete:", error);
        return { success: false, message: "Não foi possível registrar seu voto. Tente novamente." };
    }

    return { success: true, message: "Seu voto foi registrado com sucesso. Obrigado por participar!" };
};

// ==========================================
// RESULTADOS
// ==========================================

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

export const getEnqueteResultados = async (
    enquete: Enquete,
    totalInscritosCache?: number
): Promise<EnqueteResultados> => {
    const [{ data, error }, totalInscritos] = await Promise.all([
        supabase.from("enquete_votos").select("opcao_id, voto, cpf").eq("enquete_id", enquete.id),
        totalInscritosCache !== undefined ? Promise.resolve(totalInscritosCache) : getTotalInscritosCount(),
    ]);
    if (error) throw error;

    const votos = data || [];
    const totalVotantes = new Set(votos.map((v) => v.cpf)).size;
    const totalVotos = votos.length;

    const opcoes = enquete.opcoes.map((o) => {
        const daOpcao = votos.filter((v) => v.opcao_id === o.id);
        const sim = daOpcao.filter((v) => v.voto === "SIM").length;
        const nao = daOpcao.filter((v) => v.voto === "NAO").length;
        const total = daOpcao.length;
        return {
            opcao_id: o.id,
            titulo: o.titulo,
            sim,
            nao,
            total,
            percentual_sim: pct(sim, total),
            percentual_nao: pct(nao, total),
            percentual: pct(total, totalVotos),
        };
    });

    return {
        total_votantes: totalVotantes,
        total_inscritos: totalInscritos,
        percentual_participacao: Math.min(100, pct(totalVotantes, totalInscritos)),
        opcoes,
    };
};

// ==========================================
// REALTIME
// ==========================================

export const subscribeToEnquetesRealtime = (onChange: () => void) => {
    const channel = supabase.channel("enquetes_realtime_" + Math.random().toString(36).slice(2, 7));
    ["enquetes", "enquete_opcoes", "enquete_votos"].forEach((table) => {
        channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
    });
    channel.subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const getEnqueteVotarUrl = (baseUrl: string, id: number) => `${baseUrl}/enquete/votar/${id}`;
export const getEnquetePainelUrl = (baseUrl: string, id: number) => `${baseUrl}/enquete/${id}`;

