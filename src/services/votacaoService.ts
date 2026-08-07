import { supabase } from "@/lib/supabase";
import { Tese, Voto, VotacaoStats, InscritoValidado, VotoTipo } from "@/types/votacao";

// Helper: Normalizar CPF para apenas dígitos
export const normalizeCPF = (cpf: string): string => {
    return (cpf || "").replace(/\D/g, "");
};

// Helper: Aplicar máscara padrão de CPF
export const maskCPF = (value: string): string => {
    return (value || "")
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
};

// Helper: Obter URL base da aplicação
export const getBaseAppUrl = (): string => {
    if (typeof window !== "undefined" && window.location && window.location.origin) {
        return window.location.origin;
    }
    return "https://conteffa.anteffa.org.br";
};

// LocalStorage Keys
const LS_TESES_KEY = "conteffa_teses_votacao";
const LS_VOTOS_KEY = "conteffa_votos_votacao";
const LS_INSCRICOES_KEY = "conteffa_inscricoes";

// ==========================================
// 1. AUTENTICAÇÃO E VALIDAÇÃO DE INSCRITOS
// ==========================================

export const validateInscritoByCPF = async (rawCpf: string): Promise<InscritoValidado | null> => {
    const cleanCpf = normalizeCPF(rawCpf);
    if (!cleanCpf || cleanCpf.length !== 11) return null;

    try {
        // 1. Tentar buscar no Supabase
        const { data: dbData, error } = await supabase
            .from('registrations')
            .select('id, nomeCompleto, full_name, cpf, cargo, ateffa');

        if (!error && dbData && dbData.length > 0) {
            const found = dbData.find((item: any) => normalizeCPF(item.cpf) === cleanCpf);
            if (found) {
                return {
                    id: found.id,
                    nomeCompleto: found.nomeCompleto || found.full_name || "Participante Inscrito",
                    cpf: found.cpf,
                    cargo: found.cargo,
                    ateffa: found.ateffa
                };
            }
        }
    } catch (err) {
        console.warn("Aviso ao buscar inscrito no Supabase, tentando fallback local:", err);
    }

    // 2. Fallback: LocalStorage
    try {
        const saved = localStorage.getItem(LS_INSCRICOES_KEY);
        if (saved) {
            const localList = JSON.parse(saved);
            const found = localList.find((item: any) => normalizeCPF(item.cpf) === cleanCpf);
            if (found) {
                return {
                    id: found.id,
                    nomeCompleto: found.nomeCompleto || found.full_name || "Participante Inscrito",
                    cpf: found.cpf,
                    cargo: found.cargo,
                    ateffa: found.ateffa
                };
            }
        }
    } catch (err) {
        console.error("Erro ao validar no localStorage:", err);
    }

    return null;
};

export const getTotalInscritosCount = async (): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('registrations')
            .select('id', { count: 'exact', head: true });

        if (!error && typeof count === 'number' && count > 0) {
            return count;
        }
    } catch (err) {
        console.warn("Erro ao contar inscritos no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_INSCRICOES_KEY);
        if (saved) {
            const list = JSON.parse(saved);
            return list.length || 0;
        }
    } catch (e) {}

    return 0;
};

// ==========================================
// 2. GESTÃO DE TESES (CRUD & STATUS)
// ==========================================

export const getTeses = async (): Promise<Tese[]> => {
    try {
        const { data, error } = await supabase
            .from('teses')
            .select('*')
            .order('numero', { ascending: true });

        if (!error && data) {
            // Salva cache local
            localStorage.setItem(LS_TESES_KEY, JSON.stringify(data));
            return data;
        }
    } catch (err) {
        console.warn("Erro ao buscar teses no Supabase, usando cache:", err);
    }

    // Fallback LocalStorage
    try {
        const saved = localStorage.getItem(LS_TESES_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [];
};

export const getTeseById = async (idOrSlug: string | number): Promise<Tese | null> => {
    const isNumeric = !isNaN(Number(idOrSlug));

    try {
        let query = supabase.from('teses').select('*');
        if (isNumeric) {
            query = query.eq('id', Number(idOrSlug));
        } else {
            query = query.eq('slug', String(idOrSlug));
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) return data;
    } catch (err) {
        console.warn("Erro ao buscar tese por id/slug no Supabase:", err);
    }

    // Fallback LocalStorage
    try {
        const saved = localStorage.getItem(LS_TESES_KEY);
        if (saved) {
            const list: Tese[] = JSON.parse(saved);
            return list.find(t => String(t.id) === String(idOrSlug) || t.slug === String(idOrSlug)) || null;
        }
    } catch (e) {}

    return null;
};

export const saveTese = async (tese: Partial<Tese>): Promise<Tese> => {
    const baseUrl = getBaseAppUrl();
    const numero = Number(tese.numero) || 1;
    const slug = tese.slug || `tese-${numero}`;
    const qrTargetUrl = `${baseUrl}/votar/${tese.id || numero}`;

    const payload = {
        numero,
        titulo: tese.titulo || "",
        descricao: tese.descricao || "",
        tempo_votacao: Number(tese.tempo_votacao) || 180,
        qr_code: qrTargetUrl,
        slug,
        status: tese.status || 'Aguardando',
        data_inicio: tese.data_inicio || null,
        data_fim: tese.data_fim || null,
        atualizado_em: new Date().toISOString()
    };

    let resultTese: Tese | null = null;

    try {
        if (tese.id) {
            const { data, error } = await supabase
                .from('teses')
                .update(payload)
                .eq('id', tese.id)
                .select()
                .single();

            if (!error && data) resultTese = data;
        } else {
            const { data, error } = await supabase
                .from('teses')
                .insert([{ ...payload, criado_em: new Date().toISOString() }])
                .select()
                .single();

            if (!error && data) {
                resultTese = data;
                // Atualiza o link do QR Code com o ID real gerado se for diferente
                if (resultTese) {
                    const realQr = `${baseUrl}/votar/${resultTese.id}`;
                    await supabase.from('teses').update({ qr_code: realQr }).eq('id', resultTese.id);
                    resultTese.qr_code = realQr;
                }
            }
        }
    } catch (err) {
        console.warn("Erro ao salvar tese no Supabase, sincronizando local:", err);
    }

    if (!resultTese) {
        const id = tese.id || Date.now();
        resultTese = {
            id,
            ...payload,
            qr_code: `${baseUrl}/votar/${id}`,
            criado_em: tese.criado_em || new Date().toISOString(),
            atualizado_em: new Date().toISOString()
        } as Tese;
    }

    // Atualiza LocalStorage
    try {
        const current = await getTeses();
        const exists = current.some(t => String(t.id) === String(resultTese!.id));
        const updated = exists
            ? current.map(t => String(t.id) === String(resultTese!.id) ? resultTese! : t)
            : [...current, resultTese!];
        localStorage.setItem(LS_TESES_KEY, JSON.stringify(updated));
    } catch (e) {}

    return resultTese;
};

export const deleteTese = async (id: string | number): Promise<boolean> => {
    try {
        await supabase.from('votos').delete().eq('tese_id', id);
        const { error } = await supabase.from('teses').delete().eq('id', id);
        if (error) console.error("Erro ao deletar tese no Supabase:", error);
    } catch (err) {
        console.warn("Erro no Supabase delete:", err);
    }

    try {
        const saved = localStorage.getItem(LS_TESES_KEY);
        if (saved) {
            const list: Tese[] = JSON.parse(saved);
            const filtered = list.filter(t => String(t.id) !== String(id));
            localStorage.setItem(LS_TESES_KEY, JSON.stringify(filtered));
        }

        const savedVotos = localStorage.getItem(LS_VOTOS_KEY);
        if (savedVotos) {
            const votosList: Voto[] = JSON.parse(savedVotos);
            const filteredVotos = votosList.filter(v => String(v.tese_id) !== String(id));
            localStorage.setItem(LS_VOTOS_KEY, JSON.stringify(filteredVotos));
        }
    } catch (e) {}

    return true;
};

export const duplicateTese = async (source: Tese): Promise<Tese> => {
    const all = await getTeses();
    const maxNumber = all.reduce((max, t) => t.numero > max ? t.numero : max, 0);
    const nextNumber = maxNumber + 1;

    return await saveTese({
        numero: nextNumber,
        titulo: `${source.titulo} (Cópia)`,
        descricao: source.descricao,
        tempo_votacao: source.tempo_votacao,
        status: 'Aguardando'
    });
};

export const iniciarVotacaoTese = async (teseId: string | number, tempoSegundos?: number): Promise<Tese | null> => {
    const tese = await getTeseById(teseId);
    if (!tese) return null;

    const tempo = tempoSegundos || tese.tempo_votacao || 180;
    const now = new Date();
    const dataFim = new Date(now.getTime() + tempo * 1000);

    return await saveTese({
        ...tese,
        status: 'Em votação',
        tempo_votacao: tempo,
        data_inicio: now.toISOString(),
        data_fim: dataFim.toISOString()
    });
};

export const encerrarVotacaoTese = async (teseId: string | number): Promise<Tese | null> => {
    const tese = await getTeseById(teseId);
    if (!tese) return null;

    return await saveTese({
        ...tese,
        status: 'Encerrada',
        data_fim: new Date().toISOString()
    });
};

// ==========================================
// 3. GESTÃO E VERIFICAÇÃO DE VOTOS
// ==========================================

export const checkUserAlreadyVoted = async (teseId: string | number, rawCpf: string): Promise<boolean> => {
    const cleanCpf = normalizeCPF(rawCpf);
    if (!cleanCpf) return false;
    const numericId = Number(teseId);

    try {
        let query = supabase.from('votos').select('id, cpf');
        if (!isNaN(numericId)) {
            query = query.eq('tese_id', numericId);
        } else {
            query = query.eq('tese_id', teseId);
        }

        const { data, error } = await query;

        if (!error && data) {
            const hasVoted = data.some((v: any) => normalizeCPF(v.cpf) === cleanCpf);
            if (hasVoted) return true;
        }
    } catch (err) {
        console.warn("Erro ao checar voto no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_VOTOS_KEY);
        if (saved) {
            const votos: Voto[] = JSON.parse(saved);
            return votos.some(v => String(v.tese_id) === String(teseId) && normalizeCPF(v.cpf) === cleanCpf);
        }
    } catch (e) {}

    return false;
};

export const getVotosByTese = async (teseId: string | number): Promise<Voto[]> => {
    const numericId = Number(teseId);

    try {
        let query = supabase.from('votos').select('*');
        if (!isNaN(numericId)) {
            query = query.eq('tese_id', numericId);
        } else {
            query = query.eq('tese_id', teseId);
        }

        const { data, error } = await query;

        if (!error && data) {
            return data;
        }
        if (error) {
            console.error("Erro ao buscar votos no Supabase:", error);
        }
    } catch (err) {
        console.warn("Erro ao buscar votos no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_VOTOS_KEY);
        if (saved) {
            const votos: Voto[] = JSON.parse(saved);
            return votos.filter(v => String(v.tese_id) === String(teseId));
        }
    } catch (e) {}

    return [];
};

export const submitVoto = async (payload: {
    teseId: string | number;
    cpf: string;
    voto: VotoTipo;
    inscritoId?: string | number | null;
    ip?: string;
    userAgent?: string;
}): Promise<{ success: boolean; message: string; voto?: Voto }> => {
    const cleanCpf = normalizeCPF(payload.cpf);
    const numericTeseId = !isNaN(Number(payload.teseId)) ? Number(payload.teseId) : payload.teseId;

    // 1. Validar Tese e Status
    const tese = await getTeseById(payload.teseId);
    if (!tese) {
        return { success: false, message: "Tese não encontrada." };
    }

    if (tese.status !== 'Em votação') {
        return { 
            success: false, 
            message: tese.status === 'Encerrada' 
                ? "A votação desta tese já foi encerrada." 
                : "A votação desta tese ainda não foi iniciada pela coordenação." 
        };
    }

    // Verificar expiração do tempo se houver data_fim
    if (tese.data_fim && new Date(tese.data_fim).getTime() < Date.now()) {
        await encerrarVotacaoTese(tese.id);
        return { success: false, message: "O tempo para votação desta tese encerrou." };
    }

    // 2. Validar se CPF existe na lista de inscritos
    const inscrito = await validateInscritoByCPF(cleanCpf);
    if (!inscrito) {
        return { success: false, message: "CPF não encontrado na lista de inscritos." };
    }

    // 3. Verificar duplicidade de voto
    const alreadyVoted = await checkUserAlreadyVoted(payload.teseId, cleanCpf);
    if (alreadyVoted) {
        return { success: false, message: "Você já registrou seu voto nesta tese." };
    }

    const newVoto: any = {
        tese_id: numericTeseId,
        inscrito_id: payload.inscritoId ? String(payload.inscritoId) : (inscrito?.id ? String(inscrito.id) : null),
        cpf: cleanCpf,
        voto: payload.voto,
        ip: payload.ip || "127.0.0.1",
        user_agent: payload.userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : ""),
        data_hora: new Date().toISOString()
    };

    try {
        const { data, error } = await supabase
            .from('votos')
            .insert([newVoto])
            .select()
            .single();

        if (error) {
            console.error("Erro ao inserir voto no Supabase:", error);
            // Caso caia na constraint UNIQUE
            if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
                return { success: false, message: "Você já registrou seu voto nesta tese." };
            }
            return { 
                success: false, 
                message: `Erro ao salvar voto no banco: ${error.message || 'Verifique o schema das tabelas'}` 
            };
        }

        if (data) {
            newVoto.id = data.id;
        }
    } catch (err: any) {
        console.error("Exceção ao salvar voto no Supabase:", err);
        return { 
            success: false, 
            message: `Falha na conexão com o banco de dados: ${err.message || 'Tente novamente'}` 
        };
    }

    // Salva no LocalStorage como cópia de segurança
    try {
        const saved = localStorage.getItem(LS_VOTOS_KEY);
        const list: Voto[] = saved ? JSON.parse(saved) : [];
        list.push(newVoto);
        localStorage.setItem(LS_VOTOS_KEY, JSON.stringify(list));
    } catch (e) {}

    return {
        success: true,
        message: "Seu voto foi registrado com sucesso. Obrigado por participar.",
        voto: newVoto
    };
};

// ==========================================
// 4. CÁLCULO DE ESTATÍSTICAS
// ==========================================

export const getTeseStats = async (teseId: string | number, forcedInscritosTotal?: number): Promise<VotacaoStats> => {
    const totalInscritos = forcedInscritosTotal !== undefined ? forcedInscritosTotal : await getTotalInscritosCount();
    const votos = await getVotosByTese(teseId);

    const total_votantes = votos.length;
    const total_sim = votos.filter(v => v.voto === 'SIM').length;
    const total_nao = votos.filter(v => v.voto === 'NAO').length;
    const total_abster = votos.filter(v => v.voto === 'ABSTER').length;

    const percentual_participacao = totalInscritos > 0 
        ? Math.min(100, Math.round((total_votantes / totalInscritos) * 100 * 10) / 10) 
        : 0;

    const percentual_sim = total_votantes > 0 
        ? Math.round((total_sim / total_votantes) * 100 * 10) / 10 
        : 0;

    const percentual_nao = total_votantes > 0 
        ? Math.round((total_nao / total_votantes) * 100 * 10) / 10 
        : 0;

    const percentual_abster = total_votantes > 0 
        ? Math.round((total_abster / total_votantes) * 100 * 10) / 10 
        : 0;

    return {
        tese_id: teseId,
        total_inscritos: totalInscritos,
        total_votantes,
        percentual_participacao,
        total_sim,
        total_nao,
        total_abster,
        percentual_sim,
        percentual_nao,
        percentual_abster
    };
};

// ==========================================
// 5. CANAL REALTIME (SUPABASE SUBSCRIPTIONS)
// ==========================================

export const subscribeToVotacaoRealtime = (
    onTeseChange?: (payload: any) => void,
    onVotoChange?: (payload: any) => void
) => {
    const channel = supabase
        .channel('votacao_realtime_channel_' + Math.random().toString(36).substring(2, 7))
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'teses' },
            (payload) => {
                if (onTeseChange) onTeseChange(payload);
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'votos' },
            (payload) => {
                if (onVotoChange) onVotoChange(payload);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
