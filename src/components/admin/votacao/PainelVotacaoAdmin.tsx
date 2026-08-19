import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
    Tese, 
    Indicativo,
    OficinaUsuario,
    TeseStatus, 
    VotacaoStats 
} from "@/types/votacao";
import { 
    getTeses, 
    saveTese, 
    deleteTese, 
    duplicateTese, 
    concluirOficinaTese,
    liberarTeseVotacao,
    getIndicativosByTese,
    getAllIndicativos,
    saveIndicativo,
    deleteIndicativo,
    iniciarVotacaoIndicativo,
    encerrarVotacaoIndicativo,
    getIndicativoStats,
    getOficinaUsuarios,
    saveOficinaUsuario,
    deleteOficinaUsuario,
    getTotalInscritosCount,
    subscribeToVotacaoRealtime,
    getBaseAppUrl
} from "@/services/votacaoService";
import { 
    Vote, 
    Plus, 
    Edit, 
    Trash2, 
    Copy, 
    QrCode, 
    ExternalLink, 
    Play, 
    Square, 
    Clock, 
    Users, 
    CheckCircle2, 
    BarChart3, 
    Layers, 
    Key,
    Building2,
    ChevronDown,
    ChevronUp,
    Sparkles,
    CheckCheck,
    Lock,
    UserCheck,
    Save,
    X,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const PainelVotacaoAdmin = () => {
    const [subTab, setSubTab] = useState<"teses" | "oficinas" | "acessos" | "status">("teses");
    const [teses, setTeses] = useState<Tese[]>([]);
    const [indicativosMap, setIndicativosMap] = useState<Record<string | number, Indicativo[]>>({});
    const [statsMap, setStatsMap] = useState<Record<string | number, VotacaoStats>>({});
    const [oficinaUsuarios, setOficinaUsuarios] = useState<OficinaUsuario[]>([]);
    const [totalInscritos, setTotalInscritos] = useState<number>(0);
    const [expandedTeseIds, setExpandedTeseIds] = useState<Record<string | number, boolean>>({});

    // Modais
    const [isModalTeseOpen, setIsModalTeseOpen] = useState(false);
    const [editingTese, setEditingTese] = useState<Partial<Tese>>({
        numero: 1,
        titulo: "",
        descricao: "",
        tempo_votacao: 180,
        status: "Aguardando"
    });

    const [isModalIndicativoOpen, setIsModalIndicativoOpen] = useState(false);
    const [editingIndicativo, setEditingIndicativo] = useState<Partial<Indicativo>>({
        numero: 1,
        titulo: "",
        descricao: "",
        tempo_votacao: 180
    });

    const [isModalAcessoOpen, setIsModalAcessoOpen] = useState(false);
    const [editingAcesso, setEditingAcesso] = useState<Partial<OficinaUsuario>>({
        username: "",
        password: "",
        nome_operador: "",
        ativo: true
    });

    const [qrModalItem, setQrModalItem] = useState<{ title: string; subtitle: string; url: string } | null>(null);

    // Carregar todos os dados
    const loadAllData = async () => {
        try {
            const [dbTeses, dbIndicativos, countInscritos, dbUsers] = await Promise.all([
                getTeses(),
                getAllIndicativos(),
                getTotalInscritosCount(),
                getOficinaUsuarios()
            ]);

            const safeTeses = Array.isArray(dbTeses) ? dbTeses : [];
            const safeIndicativos = Array.isArray(dbIndicativos) ? dbIndicativos : [];
            const safeUsers = Array.isArray(dbUsers) ? dbUsers : [];
            const safeInscritosCount = typeof countInscritos === 'number' ? countInscritos : 0;

            setTeses(safeTeses);
            setTotalInscritos(safeInscritosCount);
            setOficinaUsuarios(safeUsers);

            // Mapear indicativos por tese_id
            const indMap: Record<string | number, Indicativo[]> = {};
            const statsRecord: Record<string | number, VotacaoStats> = {};

            for (const t of safeTeses) {
                indMap[t.id] = safeIndicativos.filter(i => String(i.tese_id) === String(t.id));
            }
            setIndicativosMap(indMap);

            // Carregar estatísticas de cada indicativo
            for (const ind of safeIndicativos) {
                const s = await getIndicativoStats(ind.id, safeInscritosCount);
                if (s) {
                    statsRecord[ind.id] = s;
                }
            }
            setStatsMap(statsRecord);

        } catch (err) {
            console.error("Erro ao carregar dados de votação:", err);
        }
    };

    useEffect(() => {
        loadAllData();

        const unsubscribe = subscribeToVotacaoRealtime(
            () => loadAllData(),
            () => loadAllData(),
            () => loadAllData()
        );

        const interval = setInterval(loadAllData, 3000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const toggleExpandTese = (id: string | number) => {
        setExpandedTeseIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // CRUD Tese
    const handleSaveTese = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTese.titulo?.trim()) {
            toast.error("O título da tese é obrigatório.");
            return;
        }

        try {
            const saved = await saveTese(editingTese);
            toast.success(`Tese Nº ${saved.numero} salva com sucesso!`);
            setIsModalTeseOpen(false);
            loadAllData();
        } catch (err) {
            toast.error("Erro ao salvar tese.");
        }
    };

    const handleOpenNewTese = () => {
        const nextNum = teses.reduce((max, t) => t.numero > max ? t.numero : max, 0) + 1;
        setEditingTese({
            numero: nextNum,
            titulo: "",
            descricao: "",
            tempo_votacao: 180,
            status: "Aguardando"
        });
        setIsModalTeseOpen(true);
    };

    const handleDeleteTeseClick = async (id: string | number) => {
        if (confirm("Tem certeza que deseja excluir esta tese e todos os seus indicativos?")) {
            await deleteTese(id);
            toast.success("Tese excluída.");
            loadAllData();
        }
    };

    // CRUD Indicativo
    const handleSaveIndicativoClick = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingIndicativo.titulo?.trim() || !editingIndicativo.tese_id) {
            toast.error("Preencha a Tese e o Título do indicativo.");
            return;
        }

        try {
            await saveIndicativo(editingIndicativo);
            toast.success("Indicativo salvo com sucesso!");
            setIsModalIndicativoOpen(false);
            loadAllData();
        } catch (err) {
            toast.error("Erro ao salvar indicativo.");
        }
    };

    const handleOpenNewIndicativo = (teseId: string | number) => {
        const currentInds = indicativosMap[teseId] || [];
        const nextNum = currentInds.length > 0 ? Math.max(...currentInds.map(i => i.numero)) + 1 : 1;
        setEditingIndicativo({
            tese_id: teseId,
            numero: nextNum,
            titulo: "",
            descricao: "",
            tempo_votacao: 180,
            status: "Aguardando"
        });
        setIsModalIndicativoOpen(true);
    };

    const handleDeleteIndicativoClick = async (id: string | number) => {
        if (confirm("Excluir este indicativo e seus votos?")) {
            await deleteIndicativo(id);
            toast.success("Indicativo excluído.");
            loadAllData();
        }
    };

    // Controles de Votação por Indicativo
    const handleStartIndicativoVoting = async (ind: Indicativo) => {
        const parentTese = teses.find(t => String(t.id) === String(ind.tese_id));
        if (parentTese && parentTese.status !== 'Liberada') {
            toast.error("A Tese precisa ser LIBERADA PELA COMISSÃO na aba Oficinas antes de iniciar a votação.");
            return;
        }

        try {
            await iniciarVotacaoIndicativo(ind.id);
            toast.success(`Votação do Indicativo Nº ${ind.numero} INICIADA!`);
            loadAllData();
        } catch (err) {
            toast.error("Erro ao iniciar votação do indicativo.");
        }
    };

    const handleEndIndicativoVoting = async (ind: Indicativo) => {
        try {
            await encerrarVotacaoIndicativo(ind.id);
            toast.info(`Votação do Indicativo Nº ${ind.numero} ENCERRADA.`);
            loadAllData();
        } catch (err) {
            toast.error("Erro ao encerrar votação.");
        }
    };

    // Gestão de Comissão/Oficina
    const handleLiberarTese = async (teseId: string | number) => {
        try {
            await liberarTeseVotacao(teseId);
            toast.success("Tese e seus indicativos LIBERADOS para votação em plenária!");
            loadAllData();
        } catch (err) {
            toast.error("Erro ao liberar tese.");
        }
    };

    // CRUD Acesso de Oficina
    const handleSaveAcesso = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAcesso.tese_id || !editingAcesso.username?.trim() || !editingAcesso.password?.trim()) {
            toast.error("Selecione a Tese, Usuário e Senha para a Sala de Oficina.");
            return;
        }

        try {
            await saveOficinaUsuario(editingAcesso);
            toast.success("Credencial de Oficina criada/atualizada com sucesso!");
            setIsModalAcessoOpen(false);
            loadAllData();
        } catch (err) {
            toast.error("Erro ao salvar credencial.");
        }
    };

    const handleDeleteAcesso = async (id: string | number) => {
        if (confirm("Excluir esta credencial de acesso da oficina?")) {
            await deleteOficinaUsuario(id);
            toast.success("Acesso removido.");
            loadAllData();
        }
    };

    // Copiar Link
    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("Link copiado para a área de transferência!");
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header Row: Quick Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-heading font-black text-lg text-white">Módulo de Votação e Oficinas</h3>
                    <p className="text-xs text-white/40 font-medium">Selecione uma das opções abaixo para gerenciar</p>
                </div>
                <Button
                    onClick={handleOpenNewTese}
                    className="rounded-2xl gap-2 h-11 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-4 h-4" /> Nova Tese
                </Button>
            </div>

            {/* Grid de Caixas Separadas (Estilo do Anexo) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CAIXA 1: VOTAÇÃO */}
                <button
                    type="button"
                    onClick={() => setSubTab("teses")}
                    className={`p-6 rounded-3xl text-left transition-all duration-200 border relative flex items-center justify-between group ${
                        subTab === "teses"
                            ? "bg-[#0E1C38] border-cyan-400/80 shadow-2xl shadow-cyan-950/40 ring-2 ring-cyan-400/30"
                            : "bg-[#122442] border-white/5 hover:border-white/20 hover:bg-[#152849]"
                    }`}
                >
                    <div className="space-y-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${
                            subTab === "teses" ? "text-cyan-400" : "text-white/40"
                        }`}>
                            1. VOTAÇÃO
                        </span>
                        <h4 className="text-2xl font-black font-heading text-white">
                            {teses.length}
                        </h4>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        subTab === "teses"
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg"
                            : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white"
                    }`}>
                        <Vote className="w-6 h-6" />
                    </div>
                </button>

                {/* CAIXA 2: OFICINAS */}
                <button
                    type="button"
                    onClick={() => setSubTab("oficinas")}
                    className={`p-6 rounded-3xl text-left transition-all duration-200 border relative flex items-center justify-between group ${
                        subTab === "oficinas"
                            ? "bg-[#0E1C38] border-cyan-400/80 shadow-2xl shadow-cyan-950/40 ring-2 ring-cyan-400/30"
                            : "bg-[#122442] border-white/5 hover:border-white/20 hover:bg-[#152849]"
                    }`}
                >
                    <div className="space-y-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${
                            subTab === "oficinas" ? "text-cyan-400" : "text-white/40"
                        }`}>
                            2. OFICINAS
                        </span>
                        <h4 className="text-2xl font-black font-heading text-white">
                            {teses.length}
                        </h4>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        subTab === "oficinas"
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg"
                            : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white"
                    }`}>
                        <Building2 className="w-6 h-6" />
                    </div>
                </button>

                {/* CAIXA 3: USUÁRIOS */}
                <button
                    type="button"
                    onClick={() => setSubTab("acessos")}
                    className={`p-6 rounded-3xl text-left transition-all duration-200 border relative flex items-center justify-between group ${
                        subTab === "acessos"
                            ? "bg-[#0E1C38] border-cyan-400/80 shadow-2xl shadow-cyan-950/40 ring-2 ring-cyan-400/30"
                            : "bg-[#122442] border-white/5 hover:border-white/20 hover:bg-[#152849]"
                    }`}
                >
                    <div className="space-y-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${
                            subTab === "acessos" ? "text-cyan-400" : "text-white/40"
                        }`}>
                            3. USUÁRIOS
                        </span>
                        <h4 className="text-2xl font-black font-heading text-white">
                            {oficinaUsuarios.length}
                        </h4>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        subTab === "acessos"
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg"
                            : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white"
                    }`}>
                        <Key className="w-6 h-6" />
                    </div>
                </button>

                {/* CAIXA 4: ESTATÍSTICAS */}
                <button
                    type="button"
                    onClick={() => setSubTab("status")}
                    className={`p-6 rounded-3xl text-left transition-all duration-200 border relative flex items-center justify-between group ${
                        subTab === "status"
                            ? "bg-[#0E1C38] border-cyan-400/80 shadow-2xl shadow-cyan-950/40 ring-2 ring-cyan-400/30"
                            : "bg-[#122442] border-white/5 hover:border-white/20 hover:bg-[#152849]"
                    }`}
                >
                    <div className="space-y-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${
                            subTab === "status" ? "text-cyan-400" : "text-white/40"
                        }`}>
                            4. ESTATÍSTICAS
                        </span>
                        <h4 className="text-2xl font-black font-heading text-white">
                            Métricas
                        </h4>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        subTab === "status"
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg"
                            : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white"
                    }`}>
                        <BarChart3 className="w-6 h-6" />
                    </div>
                </button>
            </div>


            {/* ======================================================== */}
            {/* SUB-ABA 1: CONTROLE DE VOTAÇÃO (TESES + INDICATIVOS)      */}
            {/* ======================================================== */}
            {subTab === "teses" && (
                <div className="space-y-6">
                    <div className="bg-[#122442] rounded-3xl border border-white/5 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h4 className="font-heading font-black text-lg text-white flex items-center gap-2">
                                    <span>Teses e Indicativos para Votação</span>
                                    <span className="text-xs bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full font-mono">
                                        {teses.length} Teses
                                    </span>
                                </h4>
                                <p className="text-xs text-white/40 mt-1">
                                    Clique na seta <ChevronDown className="w-3.5 h-3.5 inline text-emerald-400" /> para expandir os indicativos de cada Tese e controlar a votação em plenária.
                                </p>
                            </div>
                        </div>

                        {teses.length === 0 ? (
                            <div className="py-16 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
                                <Vote className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
                                <p className="text-sm font-bold text-white">Nenhuma Tese/Tema cadastrado.</p>
                                <p className="text-xs text-white/40 mt-1">Clique em "+ Nova Tese (Tema)" para criar.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {teses.map((t) => {
                                    const isExpanded = !!expandedTeseIds[t.id];
                                    const indicativos = indicativosMap[t.id] || [];
                                    const isLiberada = t.status === 'Liberada';
                                    const isConcluida = t.status === 'Concluída' || t.oficina_concluida;

                                    return (
                                        <div
                                            key={t.id}
                                            className="bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden transition-all shadow-lg"
                                        >
                                            {/* Top Banner da Tese */}
                                            <div className="p-5 flex items-center justify-between gap-4 bg-white/[0.02] border-b border-white/5">
                                                <div className="flex items-center space-x-4">
                                                    <button
                                                        onClick={() => toggleExpandTese(t.id)}
                                                        className="w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-colors"
                                                        title="Expandir / Ocultar Indicativos"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </button>

                                                    <div>
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="bg-primary/20 text-primary border border-primary/30 text-xs font-black px-2.5 py-0.5 rounded-lg">
                                                                TESE Nº {t.numero}
                                                            </span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                isLiberada
                                                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                                    : isConcluida
                                                                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                            }`}>
                                                                {isLiberada ? "Liberada para Votação" : isConcluida ? "Oficina Concluída" : t.status}
                                                            </span>
                                                            <span className="text-xs text-white/50 font-mono">
                                                                ({indicativos.length} {indicativos.length === 1 ? "indicativo" : "indicativos"})
                                                            </span>
                                                        </div>

                                                        <h4 className="font-bold text-white text-base mt-1">{t.titulo}</h4>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleOpenNewIndicativo(t.id)}
                                                        className="h-9 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold gap-1.5"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Add Indicativo
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingTese(t);
                                                            setIsModalTeseOpen(true);
                                                        }}
                                                        className="h-9 w-9 p-0 rounded-xl hover:bg-white/10 text-white/60 hover:text-white"
                                                        title="Editar Tese"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteTeseClick(t.id)}
                                                        className="h-9 w-9 p-0 rounded-xl hover:bg-rose-500/20 text-rose-400"
                                                        title="Excluir Tese"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Indicativos sanfonados */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="p-5 bg-slate-950/60 divide-y divide-white/5"
                                                    >
                                                        {indicativos.length === 0 ? (
                                                            <div className="py-6 text-center text-xs text-white/40 italic">
                                                                Nenhum indicativo cadastrado para esta Tese. Clique em "+ Add Indicativo" acima.
                                                            </div>
                                                        ) : (
                                                            indicativos.map((ind) => {
                                                                const stats = statsMap[ind.id] || {
                                                                    indicativo_id: ind.id,
                                                                    total_inscritos: totalInscritos,
                                                                    total_votantes: 0,
                                                                    percentual_participacao: 0,
                                                                    total_sim: 0,
                                                                    total_nao: 0,
                                                                    total_abster: 0,
                                                                    percentual_sim: 0,
                                                                    percentual_nao: 0,
                                                                    percentual_abster: 0
                                                                };

                                                                const isVoting = ind.status === 'Em votação';
                                                                const isEnded = ind.status === 'Encerrada';

                                                                return (
                                                                    <div key={ind.id} className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                                        <div className="space-y-1 max-w-xl">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                                                                                    {ind.numero}
                                                                                </span>
                                                                                <h5 className="font-bold text-white text-sm">{ind.titulo}</h5>
                                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                                                    isVoting ? "bg-emerald-500/20 text-emerald-400 animate-pulse border border-emerald-500/30" :
                                                                                    isEnded ? "bg-rose-500/20 text-rose-400" : "bg-white/10 text-white/50"
                                                                                }`}>
                                                                                    {ind.status}
                                                                                </span>
                                                                            </div>
                                                                            {ind.descricao && (
                                                                                <p className="text-xs text-white/60 line-clamp-2 pl-8">
                                                                                    {ind.descricao}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {/* Ações de Votação por Indicativo */}
                                                                        <div className="flex items-center space-x-2">
                                                                            {isVoting ? (
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => handleEndIndicativoVoting(ind)}
                                                                                    className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs gap-1"
                                                                                >
                                                                                    <Square className="w-3.5 h-3.5" /> Encerrar Votação
                                                                                </Button>
                                                                            ) : (
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => handleStartIndicativoVoting(ind)}
                                                                                    disabled={t.status !== 'Liberada'}
                                                                                    title={t.status === 'Liberada' ? "Iniciar Votação em Plenária" : "Aguardando Liberação da Comissão (na aba Oficinas)"}
                                                                                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1 disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed border border-transparent disabled:border-slate-700/60"
                                                                                >
                                                                                    <Play className="w-3.5 h-3.5" /> Iniciar Votação
                                                                                </Button>
                                                                            )}

                                                                            <a
                                                                                href={`/tese/${ind.id}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="px-2.5 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold flex items-center gap-1 transition-colors"
                                                                                title="Abrir Telão deste Indicativo"
                                                                            >
                                                                                Telão <ExternalLink className="w-3 h-3" />
                                                                            </a>

                                                                            <button
                                                                                onClick={() => setQrModalItem({
                                                                                    title: `Indicativo Nº ${ind.numero}`,
                                                                                    subtitle: ind.titulo,
                                                                                    url: `${getBaseAppUrl()}/votar/${ind.id}`
                                                                                })}
                                                                                className="p-1.5 bg-white rounded-lg hover:scale-105 transition-transform"
                                                                                title="QR Code do Votante"
                                                                            >
                                                                                <QRCodeSVG value={`${getBaseAppUrl()}/votar/${ind.id}`} size={22} />
                                                                            </button>

                                                                            <button
                                                                                onClick={() => copyLink(`${getBaseAppUrl()}/votar/${ind.id}`)}
                                                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                                                                title="Copiar Link de Votação"
                                                                            >
                                                                                <Copy className="w-3.5 h-3.5" />
                                                                            </button>

                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingIndicativo(ind);
                                                                                    setIsModalIndicativoOpen(true);
                                                                                }}
                                                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                                                                title="Editar Indicativo"
                                                                            >
                                                                                <Edit className="w-3.5 h-3.5" />
                                                                            </button>

                                                                            <button
                                                                                onClick={() => handleDeleteIndicativoClick(ind.id)}
                                                                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs"
                                                                                title="Excluir Indicativo"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* SUB-ABA 2: OFICINAS - SALAS DE TESES                      */}
            {/* ======================================================== */}
            {subTab === "oficinas" && (
                <div className="bg-[#122442] rounded-3xl border border-white/5 shadow-2xl p-6 space-y-6">
                    <div>
                        <h4 className="font-heading font-black text-lg text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-emerald-400" />
                            <span>Oficinas - Salas de Teses (Acompanhamento da Comissão)</span>
                        </h4>
                        <p className="text-xs text-white/40 mt-1">
                            Acompanhe em tempo real o preenchimento das salas pelos relatores. Quando a sala for concluída, você poderá validar os indicativos e liberar a Tese para votação.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {teses.map((t) => {
                            const indicativos = indicativosMap[t.id] || [];
                            const isConcluida = t.status === 'Concluída' || t.oficina_concluida;
                            const isLiberada = t.status === 'Liberada';

                            return (
                                <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black px-2.5 py-0.5 rounded-lg">
                                                    TESE Nº {t.numero}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    isLiberada ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                                    isConcluida ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                }`}>
                                                    {isLiberada ? "LIBERADA PARA VOTAÇÃO" : isConcluida ? "CONCLUÍDA" : "EM OFICINA"}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold text-white mt-1">{t.titulo}</h4>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            {isLiberada ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                                    <CheckCheck className="w-4 h-4" /> Tese Liberada
                                                </span>
                                            ) : (
                                                <Button
                                                    onClick={() => handleLiberarTese(t.id)}
                                                    disabled={indicativos.length === 0}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>Liberar Tese para Votação</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lista de Indicativos para Validação */}
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                            <span>Indicativos Cadastrados ({indicativos.length})</span>
                                            <button
                                                onClick={() => handleOpenNewIndicativo(t.id)}
                                                className="text-emerald-400 hover:underline flex items-center gap-1 font-normal lowercase text-xs"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Adicionar indicativo pela Comissão
                                            </button>
                                        </h5>

                                        {indicativos.length === 0 ? (
                                            <p className="text-xs text-slate-500 italic bg-slate-950 p-4 rounded-xl border border-slate-800">
                                                A sala desta Tese ainda não enviou nenhum indicativo.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {indicativos.map((ind) => (
                                                    <div key={ind.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center">
                                                                    {ind.numero}
                                                                </span>
                                                                <h6 className="text-sm font-bold text-white">{ind.titulo}</h6>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingIndicativo(ind);
                                                                    setIsModalIndicativoOpen(true);
                                                                }}
                                                                className="text-xs text-slate-400 hover:text-white p-1"
                                                                title="Editar Conteúdo"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        {ind.descricao && (
                                                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                                                {ind.descricao}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* SUB-ABA 3: ACESSOS DAS OFICINAS                           */}
            {/* ======================================================== */}
            {subTab === "acessos" && (
                <div className="bg-[#122442] rounded-3xl border border-white/5 shadow-2xl p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="font-heading font-black text-lg text-white flex items-center gap-2">
                                <Key className="w-5 h-5 text-teal-400" />
                                <span>Acessos dos Operadores de Oficina</span>
                            </h4>
                            <p className="text-xs text-white/40 mt-1">
                                Cadastre usuários e senhas para que os relatores possam acessar a página <code className="text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded">/oficina</code> no computador da sala.
                            </p>
                        </div>

                        <Button
                            onClick={() => {
                                setEditingAcesso({
                                    tese_id: teses[0]?.id || "",
                                    username: "",
                                    password: "",
                                    nome_operador: "",
                                    ativo: true
                                });
                                setIsModalAcessoOpen(true);
                            }}
                            className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg gap-2"
                        >
                            <Plus className="w-4 h-4" /> Criar Credencial de Sala
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase text-white/40">
                                    <th className="py-4 px-6">Tese / Sala Designada</th>
                                    <th className="py-4 px-6">Usuário (Login)</th>
                                    <th className="py-4 px-6">Senha</th>
                                    <th className="py-4 px-6">Nome do Operador</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {oficinaUsuarios.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-white/40 text-xs italic">
                                            Nenhum acesso de oficina cadastrado. Clique no botão acima para cadastrar.
                                        </td>
                                    </tr>
                                ) : (
                                    oficinaUsuarios.map((u) => {
                                        const teseAssigned = teses.find(t => String(t.id) === String(u.tese_id));

                                        return (
                                            <tr key={u.id} className="hover:bg-white/[0.02]">
                                                <td className="py-4 px-6 font-bold text-white">
                                                    {teseAssigned ? `Tese Nº ${teseAssigned.numero} - ${teseAssigned.titulo}` : `Tese ID ${u.tese_id}`}
                                                </td>
                                                <td className="py-4 px-6 font-mono text-emerald-400 font-bold">{u.username}</td>
                                                <td className="py-4 px-6 font-mono text-slate-300">{u.password}</td>
                                                <td className="py-4 px-6 text-slate-300">{u.nome_operador || "-"}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        u.ativo ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                                    }`}>
                                                        {u.ativo ? "Ativo" : "Inativo"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingAcesso(u);
                                                            setIsModalAcessoOpen(true);
                                                        }}
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAcesso(u.id)}
                                                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* SUB-ABA 4: ESTATÍSTICAS                                   */}
            {/* ======================================================== */}
            {subTab === "status" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#122442] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase text-white/40 block">Inscritos Aptos</span>
                                <div className="text-3xl font-heading font-black text-white mt-1">{totalInscritos}</div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-[#122442] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase text-white/40 block">Teses Registradas</span>
                                <div className="text-3xl font-heading font-black text-white mt-1">{teses.length}</div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                                <Layers className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-[#122442] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase text-white/40 block">Indicativos Cadastrados</span>
                                <div className="text-3xl font-heading font-black text-emerald-400 mt-1">
                                    {Object.values(indicativosMap).reduce((acc, curr) => acc + curr.length, 0)}
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <Vote className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Detalhamento de Métricas e Gráficos de Votação por Tese */}
                    <div className="bg-[#122442] rounded-3xl border border-white/5 shadow-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-heading font-black text-lg text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                                    <span>Métricas e Resultados de Votação por Indicativo</span>
                                </h4>
                                <p className="text-xs text-white/40 mt-1">
                                    Acompanhe a apuração detalhada dos votos (Sim, Não, Abstenções e participação) em tempo real.
                                </p>
                            </div>
                        </div>

                        {teses.length === 0 ? (
                            <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
                                Nenhuma Tese cadastrada para exibir métricas.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {teses.map((t) => {
                                    const list = indicativosMap[t.id] || [];
                                    return (
                                        <div key={t.id} className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-primary/20 text-primary border border-primary/30 text-xs font-black px-2.5 py-0.5 rounded-lg">
                                                        TESE Nº {t.numero}
                                                    </span>
                                                    <h5 className="font-bold text-white text-base">{t.titulo}</h5>
                                                </div>
                                                <span className="text-xs text-white/50 font-mono">
                                                    {list.length} {list.length === 1 ? "indicativo" : "indicativos"}
                                                </span>
                                            </div>

                                            {list.length === 0 ? (
                                                <p className="text-xs text-white/40 italic">Nenhum indicativo nesta tese.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {list.map((ind) => {
                                                        const stats = statsMap[ind.id] || {
                                                            indicativo_id: ind.id,
                                                            total_inscritos: totalInscritos,
                                                            total_votantes: 0,
                                                            percentual_participacao: 0,
                                                            total_sim: 0,
                                                            total_nao: 0,
                                                            total_abster: 0,
                                                            percentual_sim: 0,
                                                            percentual_nao: 0,
                                                            percentual_abster: 0
                                                        };

                                                        return (
                                                            <div key={ind.id} className="bg-slate-950/70 border border-white/5 rounded-xl p-4 space-y-3">
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                                                                            {ind.numero}
                                                                        </span>
                                                                        <span className="font-bold text-white text-sm">{ind.titulo}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                                            ind.status === 'Em votação' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse" :
                                                                            ind.status === 'Encerrada' ? "bg-rose-500/20 text-rose-400" : "bg-white/10 text-white/50"
                                                                        }`}>
                                                                            {ind.status}
                                                                        </span>
                                                                        <span className="text-xs text-white/70 font-mono bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5">
                                                                            {stats.total_votantes} votos ({stats.percentual_participacao}% part.)
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Barra de Progresso Visual dos Votos */}
                                                                <div className="w-full bg-slate-900 rounded-full h-3.5 flex overflow-hidden border border-white/10">
                                                                    <div 
                                                                        style={{ width: `${stats.percentual_sim}%` }} 
                                                                        className="bg-emerald-500 transition-all duration-500" 
                                                                        title={`SIM: ${stats.percentual_sim}%`}
                                                                    />
                                                                    <div 
                                                                        style={{ width: `${stats.percentual_nao}%` }} 
                                                                        className="bg-rose-500 transition-all duration-500" 
                                                                        title={`NÃO: ${stats.percentual_nao}%`}
                                                                    />
                                                                    <div 
                                                                        style={{ width: `${stats.percentual_abster}%` }} 
                                                                        className="bg-slate-500 transition-all duration-500" 
                                                                        title={`ABSTENÇÃO: ${stats.percentual_abster}%`}
                                                                    />
                                                                </div>

                                                                {/* Detalhamento das Opções em Cards */}
                                                                <div className="grid grid-cols-3 gap-3 text-center text-xs pt-1">
                                                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                                                                        <span className="text-[10px] font-black uppercase text-emerald-400 block">SIM</span>
                                                                        <span className="font-bold text-white text-base">{stats.total_sim}</span>
                                                                        <span className="text-[10px] text-emerald-400/80 block font-mono">({stats.percentual_sim}%)</span>
                                                                    </div>
                                                                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
                                                                        <span className="text-[10px] font-black uppercase text-rose-400 block">NÃO</span>
                                                                        <span className="font-bold text-white text-base">{stats.total_nao}</span>
                                                                        <span className="text-[10px] text-rose-400/80 block font-mono">({stats.percentual_nao}%)</span>
                                                                    </div>
                                                                    <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-2.5">
                                                                        <span className="text-[10px] font-black uppercase text-slate-400 block">ABSTENÇÃO</span>
                                                                        <span className="font-bold text-white text-base">{stats.total_abster}</span>
                                                                        <span className="text-[10px] text-slate-400/80 block font-mono">({stats.percentual_abster}%)</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL DE CADASTRO DE TESE */}
            <Dialog open={isModalTeseOpen} onOpenChange={setIsModalTeseOpen}>
                <DialogContent className="max-w-xl bg-[#122442] border-white/10 rounded-3xl p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {editingTese.id ? `Editar Tese Nº ${editingTese.numero}` : "Cadastrar Nova Tese"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveTese} className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs text-white/70">Número</Label>
                                <Input
                                    type="number"
                                    required
                                    value={editingTese.numero || 1}
                                    onChange={(e) => setEditingTese({ ...editingTese, numero: Number(e.target.value) })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label className="text-xs text-white/70">Status</Label>
                                <Select
                                    value={editingTese.status || "Aguardando"}
                                    onValueChange={(val: TeseStatus) => setEditingTese({ ...editingTese, status: val })}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 text-white border-slate-800">
                                        <SelectItem value="Aguardando">Aguardando</SelectItem>
                                        <SelectItem value="Em Oficina">Em Oficina</SelectItem>
                                        <SelectItem value="Concluída">Concluída</SelectItem>
                                        <SelectItem value="Liberada">Liberada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-white/70">Título da Tese *</Label>
                            <Input
                                required
                                value={editingTese.titulo || ""}
                                onChange={(e) => setEditingTese({ ...editingTese, titulo: e.target.value })}
                                placeholder="ex: Carreira de Fiscalização"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-xs text-white/70">Descrição / Justificativa</Label>
                            <Textarea
                                rows={4}
                                value={editingTese.descricao || ""}
                                onChange={(e) => setEditingTese({ ...editingTese, descricao: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsModalTeseOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-emerald-600 text-white">Salvar Tese</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL DE CADASTRO DE INDICATIVO */}
            <Dialog open={isModalIndicativoOpen} onOpenChange={setIsModalIndicativoOpen}>
                <DialogContent className="max-w-xl bg-[#122442] border-white/10 rounded-3xl p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {editingIndicativo.id ? "Editar Indicativo" : "Novo Indicativo"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveIndicativoClick} className="space-y-4 mt-2">
                        <div className="w-32">
                            <Label className="text-xs font-semibold text-white/80 mb-1.5 block">Número</Label>
                            <Input
                                type="number"
                                required
                                min={1}
                                value={editingIndicativo.numero || 1}
                                onChange={(e) => setEditingIndicativo({ ...editingIndicativo, numero: Number(e.target.value) })}
                                className="bg-white/5 border-white/10 text-white font-bold"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-white/80 mb-1.5 block">Indicativo</Label>
                            <Textarea
                                rows={5}
                                required
                                value={editingIndicativo.titulo || ""}
                                onChange={(e) => setEditingIndicativo({ ...editingIndicativo, titulo: e.target.value })}
                                placeholder="Redação final do indicativo..."
                                className="bg-white/5 border-white/10 text-white leading-relaxed resize-none font-medium"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsModalIndicativoOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg px-5">
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL DE CREDENCIAL DE ACESSO DA OFICINA */}
            <Dialog open={isModalAcessoOpen} onOpenChange={setIsModalAcessoOpen}>
                <DialogContent className="max-w-md bg-[#122442] border-white/10 rounded-3xl p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Acesso para Sala de Oficina</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveAcesso} className="space-y-4 mt-2">
                        <div>
                            <Label className="text-xs text-white/70">Tese Designada para esta Sala</Label>
                            <Select
                                value={String(editingAcesso.tese_id || "")}
                                onValueChange={(val) => setEditingAcesso({ ...editingAcesso, tese_id: val })}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Selecione a Tese..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 text-white border-slate-800">
                                    {teses.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            Tese Nº {t.numero} - {t.titulo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs text-white/70">Usuário de Login *</Label>
                            <Input
                                required
                                value={editingAcesso.username || ""}
                                onChange={(e) => setEditingAcesso({ ...editingAcesso, username: e.target.value })}
                                placeholder="ex: sala-tese-01"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-xs text-white/70">Senha de Acesso *</Label>
                            <Input
                                required
                                type="text"
                                value={editingAcesso.password || ""}
                                onChange={(e) => setEditingAcesso({ ...editingAcesso, password: e.target.value })}
                                placeholder="ex: 123456"
                                className="bg-white/5 border-white/10 text-white font-mono"
                            />
                        </div>

                        <div>
                            <Label className="text-xs text-white/70">Nome do Relator / Operador</Label>
                            <Input
                                value={editingAcesso.nome_operador || ""}
                                onChange={(e) => setEditingAcesso({ ...editingAcesso, nome_operador: e.target.value })}
                                placeholder="ex: João Silva (Relator da Sala)"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsModalAcessoOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-teal-600 text-white">Salvar Credencial</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL QR CODE */}
            <Dialog open={!!qrModalItem} onOpenChange={() => setQrModalItem(null)}>
                <DialogContent className="max-w-md bg-[#122442] border-white/10 rounded-3xl p-6 text-center text-white">
                    {qrModalItem && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-emerald-400">{qrModalItem.title}</h3>
                            <p className="text-xs text-white/60">{qrModalItem.subtitle}</p>

                            <div className="p-4 bg-white rounded-2xl inline-block">
                                <QRCodeSVG value={qrModalItem.url} size={200} />
                            </div>

                            <p className="text-xs font-mono text-emerald-300 break-all">{qrModalItem.url}</p>

                            <Button onClick={() => copyLink(qrModalItem.url)} className="w-full bg-emerald-600 text-white">
                                Copiar Link da Votação
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PainelVotacaoAdmin;
