import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
    Tese, 
    TeseStatus, 
    VotacaoStats 
} from "@/types/votacao";
import { 
    getTeses, 
    saveTese, 
    deleteTese, 
    duplicateTese, 
    iniciarVotacaoTese, 
    encerrarVotacaoTese, 
    getTeseStats, 
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
    XCircle, 
    MinusCircle, 
    TrendingUp, 
    BarChart3, 
    Layers, 
    Download,
    Eye,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const PainelVotacaoAdmin = () => {
    const [subTab, setSubTab] = useState<"teses" | "status">("teses");
    const [teses, setTeses] = useState<Tese[]>([]);
    const [statsMap, setStatsMap] = useState<Record<string | number, VotacaoStats>>({});
    const [totalInscritos, setTotalInscritos] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Modal de Cadastro/Edição de Tese
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTese, setEditingTese] = useState<Partial<Tese>>({
        numero: 1,
        titulo: "",
        descricao: "",
        tempo_votacao: 180,
        status: "Aguardando"
    });
    const [tempoPreset, setTempoPreset] = useState<string>("180");

    // Modal de Visualização do QR Code
    const [qrModalTese, setQrModalTese] = useState<Tese | null>(null);

    // Carregar todas as teses e estatísticas
    const loadAllData = async () => {
        try {
            const [dbTeses, countInscritos] = await Promise.all([
                getTeses(),
                getTotalInscritosCount()
            ]);

            setTeses(dbTeses);
            setTotalInscritos(countInscritos);

            // Carregar estatísticas para cada tese
            const statsRecord: Record<string | number, VotacaoStats> = {};
            for (const t of dbTeses) {
                const s = await getTeseStats(t.id, countInscritos);
                statsRecord[t.id] = s;
            }
            setStatsMap(statsRecord);
        } catch (err) {
            console.error("Erro ao carregar dados de votação:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();

        // Inscrever no canal Realtime
        const unsubscribe = subscribeToVotacaoRealtime(
            () => loadAllData(),
            () => loadAllData()
        );

        // Polling de fallback a cada 3 segundos
        const interval = setInterval(loadAllData, 3000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    // Salvar Tese (Criar ou Editar)
    const handleSaveTese = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTese.titulo?.trim()) {
            toast.error("O título da tese é obrigatório.");
            return;
        }

        try {
            const saved = await saveTese(editingTese);
            toast.success(`Tese Nº ${saved.numero} salva com sucesso!`);
            setIsModalOpen(false);
            loadAllData();
        } catch (err) {
            console.error("Erro ao salvar tese:", err);
            toast.error("Erro ao salvar tese.");
        }
    };

    // Abrir Modal para Nova Tese
    const handleOpenNew = () => {
        const nextNum = teses.reduce((max, t) => t.numero > max ? t.numero : max, 0) + 1;
        setEditingTese({
            numero: nextNum,
            titulo: "",
            descricao: "",
            tempo_votacao: 180,
            status: "Aguardando"
        });
        setTempoPreset("180");
        setIsModalOpen(true);
    };

    // Abrir Modal para Editar Tese
    const handleOpenEdit = (t: Tese) => {
        setEditingTese(t);
        const preset = ["60", "120", "180", "300", "600", "900"].includes(String(t.tempo_votacao))
            ? String(t.tempo_votacao)
            : "custom";
        setTempoPreset(preset);
        setIsModalOpen(true);
    };

    // Duplicar Tese
    const handleDuplicate = async (t: Tese) => {
        try {
            const dup = await duplicateTese(t);
            toast.success(`Tese duplicada como Nº ${dup.numero}!`);
            loadAllData();
        } catch (err) {
            toast.error("Erro ao duplicar tese.");
        }
    };

    // Excluir Tese
    const handleDelete = async (id: string | number) => {
        if (confirm("Tem certeza que deseja excluir esta tese e todos os seus votos?")) {
            try {
                await deleteTese(id);
                toast.success("Tese excluída com sucesso!");
                loadAllData();
            } catch (err) {
                toast.error("Erro ao excluir tese.");
            }
        }
    };

    // Iniciar Votação
    const handleStartVoting = async (t: Tese) => {
        try {
            await iniciarVotacaoTese(t.id);
            toast.success(`Votação da Tese Nº ${t.numero} INICIADA!`);
            loadAllData();
        } catch (err) {
            toast.error("Erro ao iniciar votação.");
        }
    };

    // Encerrar Votação
    const handleEndVoting = async (t: Tese) => {
        try {
            await encerrarVotacaoTese(t.id);
            toast.info(`Votação da Tese Nº ${t.numero} ENCERRADA.`);
            loadAllData();
        } catch (err) {
            toast.error("Erro ao encerrar votação.");
        }
    };

    // Copiar Link da Votação
    const copyVotingLink = (id: string | number) => {
        const url = `${getBaseAppUrl()}/votar/${id}`;
        navigator.clipboard.writeText(url);
        toast.success("Link da votação copiado para a área de transferência!");
    };

    // Formatar Tempo Restante
    const formatTimeRemaining = (t: Tese) => {
        if (t.status === 'Em votação' && t.data_fim) {
            const diff = Math.max(0, Math.ceil((new Date(t.data_fim).getTime() - Date.now()) / 1000));
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        if (t.status === 'Encerrada') return "00:00 (Encerrada)";
        const total = t.tempo_votacao || 180;
        return `${Math.floor(total / 60)} min`;
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header com Sub-Abas e Botão Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#122442] p-6 rounded-3xl shadow-xl border border-white/5">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-lg">
                            <Vote className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-heading font-black text-xl text-white">Painel de Votação Online</h3>
                            <p className="text-white/40 text-[13px] font-medium">
                                Gestão de deliberações plenárias em tempo real por QR Code
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Botões das Sub-Abas */}
                    <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button
                            onClick={() => setSubTab("teses")}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                subTab === "teses"
                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                    : "text-white/40 hover:text-white"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5" /> 1. Teses ({teses.length})
                            </span>
                        </button>

                        <button
                            onClick={() => setSubTab("status")}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                subTab === "status"
                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                    : "text-white/40 hover:text-white"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <BarChart3 className="w-3.5 h-3.5" /> 2. Status da Votação
                            </span>
                        </button>
                    </div>

                    <Button
                        onClick={handleOpenNew}
                        className="rounded-2xl gap-2 h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" /> Nova Tese
                    </Button>
                </div>
            </div>

            {/* ======================================================== */}
            {/* SUB-ABA 1: LISTA E GESTÃO DE TESES                       */}
            {/* ======================================================== */}
            {subTab === "teses" && (
                <div className="bg-[#122442] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h4 className="font-heading font-black text-lg text-white">Teses Cadastradas</h4>
                        <span className="text-xs text-white/40 font-medium">
                            {teses.length} {teses.length === 1 ? "tese registrada" : "teses registradas"}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-white/40">
                                    <th className="py-4 px-6">Nº</th>
                                    <th className="py-4 px-6">Título & Descrição</th>
                                    <th className="py-4 px-6">Tempo</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6">QR Code</th>
                                    <th className="py-4 px-6">Links</th>
                                    <th className="py-4 px-6 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {teses.length > 0 ? (
                                    teses.map((t) => (
                                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                            {/* Número */}
                                            <td className="py-5 px-6">
                                                <span className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary font-heading font-black flex items-center justify-center text-sm shadow-md">
                                                    {t.numero}
                                                </span>
                                            </td>

                                            {/* Título & Descrição */}
                                            <td className="py-5 px-6 max-w-xs">
                                                <h5 className="font-heading font-bold text-white group-hover:text-primary transition-colors text-base line-clamp-1">
                                                    {t.titulo}
                                                </h5>
                                                <p className="text-xs text-white/40 line-clamp-1 mt-0.5">
                                                    {t.descricao || "Sem descrição"}
                                                </p>
                                            </td>

                                            {/* Tempo */}
                                            <td className="py-5 px-6 whitespace-nowrap">
                                                <span className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                                    {Math.floor(t.tempo_votacao / 60)} min ({t.tempo_votacao}s)
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-5 px-6 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                                    t.status === 'Em votação'
                                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                                                        : t.status === 'Encerrada'
                                                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        t.status === 'Em votação' ? 'bg-emerald-400' :
                                                        t.status === 'Encerrada' ? 'bg-red-400' : 'bg-amber-400'
                                                    }`} />
                                                    {t.status}
                                                </span>
                                            </td>

                                            {/* QR Code Mini Preview */}
                                            <td className="py-5 px-6">
                                                <button
                                                    onClick={() => setQrModalTese(t)}
                                                    className="p-2 bg-white rounded-xl hover:scale-105 transition-transform shadow-md border border-white/20 inline-block"
                                                    title="Ampliar QR Code"
                                                >
                                                    <QRCodeSVG
                                                        value={`${getBaseAppUrl()}/votar/${t.id}`}
                                                        size={36}
                                                        level="M"
                                                    />
                                                </button>
                                            </td>

                                            {/* Links Rápidos */}
                                            <td className="py-5 px-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => copyVotingLink(t.id)}
                                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors"
                                                        title="Copiar Link de Votação (/votar/...)"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                    <a
                                                        href={`/tese/${t.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                                        title="Abrir Telão Público"
                                                    >
                                                        Telão <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </td>

                                            {/* Ações */}
                                            <td className="py-5 px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {t.status === 'Em votação' ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleEndVoting(t)}
                                                            className="h-9 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-xs gap-1.5"
                                                        >
                                                            <Square className="w-3 h-3" /> Encerrar Agora
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleStartVoting(t)}
                                                            className="h-9 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs gap-1.5"
                                                        >
                                                            <Play className="w-3 h-3" /> Iniciar Votação
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleOpenEdit(t)}
                                                        className="h-9 w-9 p-0 rounded-xl hover:bg-white/10 text-white/60 hover:text-white"
                                                        title="Editar Tese"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDuplicate(t)}
                                                        className="h-9 w-9 p-0 rounded-xl hover:bg-white/10 text-white/60 hover:text-white"
                                                        title="Duplicar Tese"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(t.id)}
                                                        className="h-9 w-9 p-0 rounded-xl hover:bg-red-500/20 text-red-400"
                                                        title="Excluir Tese"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-white/40">
                                            <Vote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm font-bold">Nenhuma tese cadastrada para votação.</p>
                                            <p className="text-xs text-white/30 mt-1">Clique em "+ Nova Tese" para adicionar.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* SUB-ABA 2: STATUS E ESTATÍSTICAS DA VOTAÇÃO EM TEMPO REAL */}
            {/* ======================================================== */}
            {subTab === "status" && (
                <div className="space-y-6">
                    {/* Resumo Global */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#122442] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Inscritos Aptos</span>
                                <div className="text-3xl font-heading font-black text-white mt-1">{totalInscritos}</div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-[#122442] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Teses Cadastradas</span>
                                <div className="text-3xl font-heading font-black text-white mt-1">{teses.length}</div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                                <Layers className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-[#122442] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Teses em Votação</span>
                                <div className="text-3xl font-heading font-black text-emerald-400 mt-1">
                                    {teses.filter(t => t.status === 'Em votação').length}
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <Play className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Cards Analíticos de Cada Tese */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {teses.map((t) => {
                            const s = statsMap[t.id] || {
                                tese_id: t.id,
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

                            const barData = [
                                { name: "SIM", count: s.total_sim, percent: s.percentual_sim, color: "#10B981" },
                                { name: "NÃO", count: s.total_nao, percent: s.percentual_nao, color: "#EF4444" },
                                { name: "ABSTER", count: s.total_abster, percent: s.percentual_abster, color: "#64748B" }
                            ];

                            return (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#122442] p-6 md:p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-6 relative overflow-hidden"
                                >
                                    {/* Header do Card */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-xl bg-primary text-white font-heading font-black text-xs">
                                                    TESE Nº {t.numero}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                    t.status === 'Em votação'
                                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                        : t.status === 'Encerrada'
                                                            ? "bg-red-500/20 text-red-400"
                                                            : "bg-amber-500/20 text-amber-400"
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </div>
                                            <h4 className="font-heading font-black text-lg text-white line-clamp-1">
                                                {t.titulo}
                                            </h4>
                                        </div>

                                        <a
                                            href={`/tese/${t.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                                        >
                                            Telão <ExternalLink className="w-3 h-3 text-primary" />
                                        </a>
                                    </div>

                                    {/* Métricas de Participação */}
                                    <div className="grid grid-cols-3 gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Inscritos</span>
                                            <span className="text-base font-bold text-white">{totalInscritos}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Votaram</span>
                                            <span className="text-base font-bold text-primary">{s.total_votantes}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Quórum</span>
                                            <span className="text-base font-bold text-emerald-400">{s.percentual_participacao}%</span>
                                        </div>
                                    </div>

                                    {/* Contadores SIM / NÃO / ABSTER */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                            <div className="text-xs font-black text-emerald-400 uppercase">SIM</div>
                                            <div className="text-2xl font-heading font-black text-emerald-400 my-0.5">{s.total_sim}</div>
                                            <div className="text-[10px] text-emerald-400/80 font-bold">{s.percentual_sim}%</div>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                                            <div className="text-xs font-black text-red-400 uppercase">NÃO</div>
                                            <div className="text-2xl font-heading font-black text-red-400 my-0.5">{s.total_nao}</div>
                                            <div className="text-[10px] text-red-400/80 font-bold">{s.percentual_nao}%</div>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-center">
                                            <div className="text-xs font-black text-slate-400 uppercase">ABSTER</div>
                                            <div className="text-2xl font-heading font-black text-slate-300 my-0.5">{s.total_abster}</div>
                                            <div className="text-[10px] text-slate-400/80 font-bold">{s.percentual_abster}%</div>
                                        </div>
                                    </div>

                                    {/* Gráfico Miniatura */}
                                    <div className="h-44 w-full pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                                                <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "0.75rem", color: "#fff", fontSize: "11px" }}
                                                    formatter={(val: any, name: any, item: any) => [`${val} votos (${item.payload.percent}%)`, item.payload.name]}
                                                />
                                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                                    {barData.map((entry, index) => (
                                                        <Cell key={`bar-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Controles Rápidos */}
                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                                        <span className="text-xs text-white/40 font-mono">
                                            Tempo: {formatTimeRemaining(t)}
                                        </span>

                                        <div className="flex gap-2">
                                            {t.status === 'Em votação' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleEndVoting(t)}
                                                    className="rounded-xl h-9 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase"
                                                >
                                                    <Square className="w-3 h-3 mr-1" /> Encerrar
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStartVoting(t)}
                                                    className="rounded-xl h-9 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase"
                                                >
                                                    <Play className="w-3 h-3 mr-1" /> Iniciar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL: CADASTRO / EDIÇÃO DE TESE                          */}
            {/* ======================================================== */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl bg-[#122442] border-white/10 rounded-[2.5rem] p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-heading font-black text-white">
                            {editingTese.id ? `Editar Tese Nº ${editingTese.numero}` : "Cadastrar Nova Tese"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveTese} className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Número da Tese */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-white uppercase tracking-wider">Número</Label>
                                <Input
                                    type="number"
                                    required
                                    min="1"
                                    value={editingTese.numero || 1}
                                    onChange={(e) => setEditingTese({ ...editingTese, numero: Number(e.target.value) })}
                                    className="h-12 rounded-xl bg-white/5 border-white/10 text-white focus:border-primary/50"
                                />
                            </div>

                            {/* Preset de Tempo */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-white uppercase tracking-wider">Tempo de Votação</Label>
                                <Select
                                    value={tempoPreset}
                                    onValueChange={(val) => {
                                        setTempoPreset(val);
                                        if (val !== "custom") {
                                            setEditingTese({ ...editingTese, tempo_votacao: Number(val) });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0C1A32] border-white/10 text-white">
                                        <SelectItem value="60">1 Minuto</SelectItem>
                                        <SelectItem value="120">2 Minutos</SelectItem>
                                        <SelectItem value="180">3 Minutos (Padrão)</SelectItem>
                                        <SelectItem value="300">5 Minutos</SelectItem>
                                        <SelectItem value="600">10 Minutos</SelectItem>
                                        <SelectItem value="900">15 Minutos</SelectItem>
                                        <SelectItem value="custom">Personalizado (segundos)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-white uppercase tracking-wider">Status</Label>
                                <Select
                                    value={editingTese.status || "Aguardando"}
                                    onValueChange={(val: TeseStatus) => setEditingTese({ ...editingTese, status: val })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0C1A32] border-white/10 text-white">
                                        <SelectItem value="Aguardando">Aguardando</SelectItem>
                                        <SelectItem value="Em votação">Em votação</SelectItem>
                                        <SelectItem value="Encerrada">Encerrada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tempo Personalizado se selecionado */}
                        {tempoPreset === "custom" && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-white uppercase tracking-wider">
                                    Tempo Personalizado (em segundos)
                                </Label>
                                <Input
                                    type="number"
                                    min="10"
                                    max="3600"
                                    value={editingTese.tempo_votacao || 180}
                                    onChange={(e) => setEditingTese({ ...editingTese, tempo_votacao: Number(e.target.value) })}
                                    className="h-12 rounded-xl bg-white/5 border-white/10 text-white"
                                    placeholder="Ex: 240 (4 minutos)"
                                />
                            </div>
                        )}

                        {/* Título */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-white uppercase tracking-wider">Título da Tese *</Label>
                            <Input
                                required
                                value={editingTese.titulo || ""}
                                onChange={(e) => setEditingTese({ ...editingTese, titulo: e.target.value })}
                                placeholder="Ex: Criação da Carreira de Especialista em Fiscalização Agropecuária"
                                className="h-12 rounded-xl bg-white/5 border-white/10 text-white focus:border-primary/50 font-medium"
                            />
                        </div>

                        {/* Descrição Completa */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-white uppercase tracking-wider">Descrição / Texto Completo</Label>
                            <Textarea
                                rows={5}
                                value={editingTese.descricao || ""}
                                onChange={(e) => setEditingTese({ ...editingTese, descricao: e.target.value })}
                                placeholder="Insira o texto e justificativa da tese para leitura na plenária e no celular do participante..."
                                className="rounded-2xl bg-white/5 border-white/10 text-white focus:border-primary/50 font-medium resize-none"
                            />
                        </div>

                        <DialogFooter className="gap-3 pt-4 border-t border-white/5">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-xl px-6 text-white/50 hover:text-white"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-xl px-8 bg-primary font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-primary/20"
                            >
                                {editingTese.id ? "Salvar Alterações" : "Cadastrar Tese"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ======================================================== */}
            {/* MODAL: VISUALIZAÇÃO AMPLIADA DO QR CODE                  */}
            {/* ======================================================== */}
            <Dialog open={!!qrModalTese} onOpenChange={() => setQrModalTese(null)}>
                <DialogContent className="max-w-md bg-[#122442] border-white/10 rounded-[2.5rem] p-8 text-center text-white">
                    {qrModalTese && (
                        <div className="space-y-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-1">
                                    QR CODE DA VOTAÇÃO
                                </span>
                                <h3 className="text-xl font-heading font-black text-white">
                                    Tese Nº {qrModalTese.numero}
                                </h3>
                                <p className="text-xs text-white/50 line-clamp-1 mt-1">{qrModalTese.titulo}</p>
                            </div>

                            <div className="p-6 bg-white rounded-3xl shadow-2xl border-4 border-primary/40 inline-block">
                                <QRCodeSVG
                                    value={`${getBaseAppUrl()}/votar/${qrModalTese.id}`}
                                    size={240}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-white/40 font-mono break-all bg-white/5 p-3 rounded-xl border border-white/5">
                                    {getBaseAppUrl()}/votar/{qrModalTese.id}
                                </p>

                                <div className="flex gap-2 justify-center pt-2">
                                    <Button
                                        onClick={() => copyVotingLink(qrModalTese.id)}
                                        variant="outline"
                                        className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold"
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar Link
                                    </Button>

                                    <a
                                        href={`/tese/${qrModalTese.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Ver no Telão
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PainelVotacaoAdmin;
