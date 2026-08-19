import { supabase } from "@/lib/supabase";
import { Tese, Indicativo, OficinaUsuario, Voto, VotacaoStats, InscritoValidado, VotoTipo } from "@/types/votacao";

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
const LS_INDICATIVOS_KEY = "conteffa_indicativos_votacao";
const LS_OFICINA_USERS_KEY = "conteffa_oficina_usuarios";
const LS_VOTOS_KEY = "conteffa_votos_votacao";
const LS_INSCRICOES_KEY = "conteffa_inscricoes";

// ==========================================
// 1. AUTENTICAÇÃO E VALIDAÇÃO DE INSCRITOS
// ==========================================

export const validateInscritoByCPF = async (rawCpf: string): Promise<InscritoValidado | null> => {
    const cleanCpf = normalizeCPF(rawCpf);
    if (!cleanCpf || cleanCpf.length !== 11) return null;

    try {
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
// 2. GESTÃO DE TESES (TEMAS DE OFICINA)
// ==========================================

export const getTeses = async (): Promise<Tese[]> => {
    try {
        const { data, error } = await supabase
            .from('teses')
            .select('*')
            .order('numero', { ascending: true });

        if (!error && data) {
            localStorage.setItem(LS_TESES_KEY, JSON.stringify(data));
            return data;
        }
    } catch (err) {
        console.warn("Erro ao buscar teses no Supabase, usando cache:", err);
    }

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
        em_oficina: tese.em_oficina ?? true,
        oficina_concluida: tese.oficina_concluida ?? false,
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
        await supabase.from('indicativos').delete().eq('tese_id', id);
        await supabase.from('oficina_usuarios').delete().eq('tese_id', id);
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

        const savedInd = localStorage.getItem(LS_INDICATIVOS_KEY);
        if (savedInd) {
            const listInd: Indicativo[] = JSON.parse(savedInd);
            const filteredInd = listInd.filter(i => String(i.tese_id) !== String(id));
            localStorage.setItem(LS_INDICATIVOS_KEY, JSON.stringify(filteredInd));
        }
    } catch (e) {}

    return true;
};

export const concluirOficinaTese = async (teseId: string | number): Promise<Tese | null> => {
    const tese = await getTeseById(teseId);
    if (!tese) return null;

    return await saveTese({
        ...tese,
        status: 'Concluída',
        oficina_concluida: true
    });
};

export const liberarTeseVotacao = async (teseId: string | number): Promise<Tese | null> => {
    const tese = await getTeseById(teseId);
    if (!tese) return null;

    return await saveTese({
        ...tese,
        status: 'Liberada'
    });
};

// ==========================================
// 3. GESTÃO DE INDICATIVOS
// ==========================================

export const getIndicativosByTese = async (teseId: string | number): Promise<Indicativo[]> => {
    try {
        const { data, error } = await supabase
            .from('indicativos')
            .select('*')
            .eq('tese_id', teseId)
            .order('numero', { ascending: true });

        if (!error && data) {
            return data;
        }
    } catch (err) {
        console.warn("Erro ao buscar indicativos no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_INDICATIVOS_KEY);
        if (saved) {
            const list: Indicativo[] = JSON.parse(saved);
            return list.filter(i => String(i.tese_id) === String(teseId)).sort((a, b) => a.numero - b.numero);
        }
    } catch (e) {}

    return [];
};

export const getAllIndicativos = async (): Promise<Indicativo[]> => {
    try {
        const { data, error } = await supabase
            .from('indicativos')
            .select('*')
            .order('numero', { ascending: true });

        if (!error && data) {
            localStorage.setItem(LS_INDICATIVOS_KEY, JSON.stringify(data));
            return data;
        }
    } catch (err) {
        console.warn("Erro ao buscar todos indicativos no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_INDICATIVOS_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [];
};

export const getIndicativoById = async (idOrSlug: string | number): Promise<Indicativo | null> => {
    const isNumeric = !isNaN(Number(idOrSlug));

    try {
        let query = supabase.from('indicativos').select('*');
        if (isNumeric) {
            query = query.eq('id', Number(idOrSlug));
        } else {
            query = query.eq('slug', String(idOrSlug));
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) return data;
    } catch (err) {
        console.warn("Erro ao buscar indicativo por id/slug no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_INDICATIVOS_KEY);
        if (saved) {
            const list: Indicativo[] = JSON.parse(saved);
            return list.find(i => String(i.id) === String(idOrSlug) || i.slug === String(idOrSlug)) || null;
        }
    } catch (e) {}

    return null;
};

export const saveIndicativo = async (indicativo: Partial<Indicativo>): Promise<Indicativo> => {
    const baseUrl = getBaseAppUrl();
    const numero = Number(indicativo.numero) || 1;
    const slug = indicativo.slug || `indicativo-${indicativo.tese_id}-${numero}`;
    const qrTargetUrl = `${baseUrl}/votar/${indicativo.id || slug}`;

    const payload = {
        tese_id: indicativo.tese_id!,
        numero,
        titulo: indicativo.titulo || "",
        descricao: indicativo.descricao || "",
        tempo_votacao: Number(indicativo.tempo_votacao) || 180,
        qr_code: qrTargetUrl,
        slug,
        status: indicativo.status || 'Aguardando',
        data_inicio: indicativo.data_inicio || null,
        data_fim: indicativo.data_fim || null,
        atualizado_em: new Date().toISOString()
    };

    let result: Indicativo | null = null;

    try {
        if (indicativo.id) {
            const { data, error } = await supabase
                .from('indicativos')
                .update(payload)
                .eq('id', indicativo.id)
                .select()
                .single();

            if (!error && data) result = data;
        } else {
            const { data, error } = await supabase
                .from('indicativos')
                .insert([{ ...payload, criado_em: new Date().toISOString() }])
                .select()
                .single();

            if (!error && data) {
                result = data;
                if (result) {
                    const realQr = `${baseUrl}/votar/${result.id}`;
                    await supabase.from('indicativos').update({ qr_code: realQr }).eq('id', result.id);
                    result.qr_code = realQr;
                }
            }
        }
    } catch (err) {
        console.warn("Erro ao salvar indicativo no Supabase, usando localStorage:", err);
    }

    if (!result) {
        const id = indicativo.id || Date.now();
        result = {
            id,
            ...payload,
            qr_code: `${baseUrl}/votar/${id}`,
            criado_em: indicativo.criado_em || new Date().toISOString(),
            atualizado_em: new Date().toISOString()
        } as Indicativo;
    }

    try {
        const current = await getAllIndicativos();
        const exists = current.some(i => String(i.id) === String(result!.id));
        const updated = exists
            ? current.map(i => String(i.id) === String(result!.id) ? result! : i)
            : [...current, result!];
        localStorage.setItem(LS_INDICATIVOS_KEY, JSON.stringify(updated));
    } catch (e) {}

    return result;
};

export const deleteIndicativo = async (id: string | number): Promise<boolean> => {
    try {
        await supabase.from('votos').delete().eq('indicativo_id', id);
        await supabase.from('indicativos').delete().eq('id', id);
    } catch (err) {
        console.warn("Erro ao deletar indicativo no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_INDICATIVOS_KEY);
        if (saved) {
            const list: Indicativo[] = JSON.parse(saved);
            const filtered = list.filter(i => String(i.id) !== String(id));
            localStorage.setItem(LS_INDICATIVOS_KEY, JSON.stringify(filtered));
        }
    } catch (e) {}

    return true;
};

export const iniciarVotacaoIndicativo = async (indicativoId: string | number, tempoSegundos?: number): Promise<Indicativo | null> => {
    // 1. Encerrar outros indicativos que porventura estejam "Em votação"
    const all = await getAllIndicativos();
    for (const ind of all) {
        if (ind.status === 'Em votação' && String(ind.id) !== String(indicativoId)) {
            await saveIndicativo({ ...ind, status: 'Encerrada', data_fim: new Date().toISOString() });
        }
    }

    const indicativo = await getIndicativoById(indicativoId);
    if (!indicativo) return null;

    const tempo = tempoSegundos || indicativo.tempo_votacao || 180;
    const now = new Date();
    const dataFim = new Date(now.getTime() + tempo * 1000);

    return await saveIndicativo({
        ...indicativo,
        status: 'Em votação',
        tempo_votacao: tempo,
        data_inicio: now.toISOString(),
        data_fim: dataFim.toISOString()
    });
};

export const encerrarVotacaoIndicativo = async (indicativoId: string | number): Promise<Indicativo | null> => {
    const indicativo = await getIndicativoById(indicativoId);
    if (!indicativo) return null;

    return await saveIndicativo({
        ...indicativo,
        status: 'Encerrada',
        data_fim: new Date().toISOString()
    });
};

export const getActiveIndicativoWithTese = async (): Promise<{ indicativo: Indicativo; tese: Tese } | null> => {
    const allIndicativos = await getAllIndicativos();
    const activeInd = allIndicativos.find(i => i.status === 'Em votação');

    if (!activeInd) return null;

    const tese = await getTeseById(activeInd.tese_id);
    if (!tese) return null;

    return { indicativo: activeInd, tese };
};

// ==========================================
// 4. AUTENTICAÇÃO E ACCESSO DAS OFICINAS
// ==========================================

export const getOficinaUsuarios = async (): Promise<OficinaUsuario[]> => {
    try {
        const { data, error } = await supabase
            .from('oficina_usuarios')
            .select('*');

        if (!error && data) {
            localStorage.setItem(LS_OFICINA_USERS_KEY, JSON.stringify(data));
            return data;
        }
    } catch (err) {
        console.warn("Erro ao buscar oficina_usuarios no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_OFICINA_USERS_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [];
};

export const saveOficinaUsuario = async (user: Partial<OficinaUsuario>): Promise<OficinaUsuario> => {
    const payload = {
        tese_id: user.tese_id!,
        username: user.username?.trim().toLowerCase() || "",
        password: user.password || "123456",
        nome_operador: user.nome_operador || "Operador de Sala",
        ativo: user.ativo ?? true
    };

    let result: OficinaUsuario | null = null;

    try {
        if (user.id) {
            const { data, error } = await supabase
                .from('oficina_usuarios')
                .update(payload)
                .eq('id', user.id)
                .select()
                .single();

            if (!error && data) result = data;
        } else {
            const { data, error } = await supabase
                .from('oficina_usuarios')
                .insert([{ ...payload, criado_em: new Date().toISOString() }])
                .select()
                .single();

            if (!error && data) result = data;
        }
    } catch (err) {
        console.warn("Erro ao salvar oficina_usuario no Supabase:", err);
    }

    if (!result) {
        result = {
            id: user.id || Date.now(),
            ...payload,
            criado_em: user.criado_em || new Date().toISOString()
        } as OficinaUsuario;
    }

    try {
        const current = await getOficinaUsuarios();
        const exists = current.some(u => String(u.id) === String(result!.id));
        const updated = exists
            ? current.map(u => String(u.id) === String(result!.id) ? result! : u)
            : [...current, result!];
        localStorage.setItem(LS_OFICINA_USERS_KEY, JSON.stringify(updated));
    } catch (e) {}

    return result;
};

export const deleteOficinaUsuario = async (id: string | number): Promise<boolean> => {
    try {
        await supabase.from('oficina_usuarios').delete().eq('id', id);
    } catch (err) {
        console.warn("Erro ao deletar oficina_usuario no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_OFICINA_USERS_KEY);
        if (saved) {
            const list: OficinaUsuario[] = JSON.parse(saved);
            const filtered = list.filter(u => String(u.id) !== String(id));
            localStorage.setItem(LS_OFICINA_USERS_KEY, JSON.stringify(filtered));
        }
    } catch (e) {}

    return true;
};

export const loginOficina = async (username: string, password: string): Promise<OficinaUsuario | null> => {
    const cleanUser = username.trim().toLowerCase();
    const users = await getOficinaUsuarios();
    
    const found = users.find(u => u.username.toLowerCase() === cleanUser && u.password === password && u.ativo);
    if (found) {
        return found;
    }
    return null;
};

// ==========================================
// 5. GESTÃO E VERIFICAÇÃO DE VOTOS
// ==========================================

export const checkUserAlreadyVotedIndicativo = async (indicativoId: string | number, rawCpf: string): Promise<boolean> => {
    const cleanCpf = normalizeCPF(rawCpf);
    if (!cleanCpf) return false;
    const numericId = Number(indicativoId);

    try {
        let query = supabase.from('votos').select('id, cpf');
        if (!isNaN(numericId)) {
            query = query.eq('indicativo_id', numericId);
        } else {
            query = query.eq('indicativo_id', indicativoId);
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
            return votos.some(v => String(v.indicativo_id) === String(indicativoId) && normalizeCPF(v.cpf) === cleanCpf);
        }
    } catch (e) {}

    return false;
};

export const getVotosByIndicativo = async (indicativoId: string | number): Promise<Voto[]> => {
    const numericId = Number(indicativoId);

    try {
        let query = supabase.from('votos').select('*');
        if (!isNaN(numericId)) {
            query = query.eq('indicativo_id', numericId);
        } else {
            query = query.eq('indicativo_id', indicativoId);
        }

        const { data, error } = await query;
        if (!error && data) return data;
    } catch (err) {
        console.warn("Erro ao buscar votos por indicativo no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_VOTOS_KEY);
        if (saved) {
            const votos: Voto[] = JSON.parse(saved);
            return votos.filter(v => String(v.indicativo_id) === String(indicativoId));
        }
    } catch (e) {}

    return [];
};

export const submitVotoIndicativo = async (payload: {
    indicativoId: string | number;
    cpf: string;
    voto: VotoTipo;
    inscritoId?: string | number | null;
    ip?: string;
    userAgent?: string;
}): Promise<{ success: boolean; message: string; voto?: Voto }> => {
    const cleanCpf = normalizeCPF(payload.cpf);
    const numericIndicativoId = !isNaN(Number(payload.indicativoId)) ? Number(payload.indicativoId) : payload.indicativoId;

    // 1. Validar Indicativo e Status
    const indicativo = await getIndicativoById(payload.indicativoId);
    if (!indicativo) {
        return { success: false, message: "Indicativo não encontrado." };
    }

    if (indicativo.status !== 'Em votação') {
        return { 
            success: false, 
            message: indicativo.status === 'Encerrada' 
                ? "A votação deste indicativo já foi encerrada." 
                : "A votação deste indicativo ainda não foi iniciada pela coordenação." 
        };
    }

    if (indicativo.data_fim && new Date(indicativo.data_fim).getTime() < Date.now()) {
        await encerrarVotacaoIndicativo(indicativo.id);
        return { success: false, message: "O tempo para votação deste indicativo encerrou." };
    }

    // 2. Validar CPF do Inscrito
    const inscrito = await validateInscritoByCPF(cleanCpf);
    if (!inscrito) {
        return { success: false, message: "CPF não encontrado na lista de inscritos." };
    }

    // 3. Verificar duplicidade de voto no Indicativo
    const alreadyVoted = await checkUserAlreadyVotedIndicativo(payload.indicativoId, cleanCpf);
    if (alreadyVoted) {
        return { success: false, message: "Você já registrou seu voto neste indicativo." };
    }

    const newVoto: any = {
        indicativo_id: numericIndicativoId,
        tese_id: indicativo.tese_id,
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
            if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
                return { success: false, message: "Você já registrou seu voto neste indicativo." };
            }
            return { 
                success: false, 
                message: `Erro ao salvar voto no banco: ${error.message || 'Verifique a tabela de votos'}` 
            };
        }

        if (data) {
            newVoto.id = data.id;
        }
    } catch (err: any) {
        console.error("Exceção ao salvar voto no Supabase:", err);
    }

    try {
        const saved = localStorage.getItem(LS_VOTOS_KEY);
        const list: Voto[] = saved ? JSON.parse(saved) : [];
        list.push(newVoto);
        localStorage.setItem(LS_VOTOS_KEY, JSON.stringify(list));
    } catch (e) {}

    return {
        success: true,
        message: "Seu voto no indicativo foi registrado com sucesso. Obrigado por participar.",
        voto: newVoto
    };
};

// ==========================================
// 6. CÁLCULO DE ESTATÍSTICAS DO INDICATIVO
// ==========================================

export const getIndicativoStats = async (indicativoId: string | number, forcedInscritosTotal?: number): Promise<VotacaoStats> => {
    const totalInscritos = forcedInscritosTotal !== undefined ? forcedInscritosTotal : await getTotalInscritosCount();
    const votos = await getVotosByIndicativo(indicativoId);
    const indicativo = await getIndicativoById(indicativoId);

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
        indicativo_id: indicativoId,
        tese_id: indicativo?.tese_id,
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
// 7. CANAL REALTIME (SUPABASE SUBSCRIPTIONS)
// ==========================================

export const subscribeToVotacaoRealtime = (
    onTeseChange?: (payload: any) => void,
    onIndicativoChange?: (payload: any) => void,
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
            { event: '*', schema: 'public', table: 'indicativos' },
            (payload) => {
                if (onIndicativoChange) onIndicativoChange(payload);
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

// Aliases para retrocompatibilidade
export const submitVoto = async (payload: {
    indicativoId?: string | number;
    teseId?: string | number;
    cpf: string;
    voto: VotoTipo;
    inscritoId?: string | number | null;
    ip?: string;
    userAgent?: string;
}) => {
    if (payload.indicativoId) {
        return submitVotoIndicativo({
            indicativoId: payload.indicativoId,
            cpf: payload.cpf,
            voto: payload.voto,
            inscritoId: payload.inscritoId,
            ip: payload.ip,
            userAgent: payload.userAgent
        });
    }
    // Se passar teseId direta:
    const targetId = payload.teseId || 1;
    return submitVotoIndicativo({
        indicativoId: targetId,
        cpf: payload.cpf,
        voto: payload.voto,
        inscritoId: payload.inscritoId,
        ip: payload.ip,
        userAgent: payload.userAgent
    });
};

export const checkUserAlreadyVoted = async (targetId: string | number, cpf: string): Promise<boolean> => {
    return checkUserAlreadyVotedIndicativo(targetId, cpf);
};

export const getTeseStats = async (teseId: string | number, forcedInscritosTotal?: number): Promise<VotacaoStats> => {
    return getIndicativoStats(teseId, forcedInscritosTotal);
};

export const encerrarVotacaoTese = async (teseId: string | number): Promise<void> => {
    await encerrarVotacaoIndicativo(teseId);
};
