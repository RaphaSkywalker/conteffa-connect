import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    getTeseById, 
    getIndicativosByTese, 
    saveIndicativo, 
    deleteIndicativo, 
    concluirOficinaTese,
    subscribeToVotacaoRealtime
} from "@/services/votacaoService";
import { Tese, Indicativo, OficinaUsuario } from "@/types/votacao";
import { toast } from "sonner";
import { 
    FileText, 
    Plus, 
    Edit, 
    Trash2, 
    CheckCircle, 
    LogOut, 
    Save, 
    X, 
    Sparkles, 
    Clock, 
    CheckCheck,
    MessageSquareQuote
} from "lucide-react";

const PainelSalaOficina: React.FC = () => {
    const navigate = useNavigate();
    const [userSession, setUserSession] = useState<OficinaUsuario | null>(null);
    const [tese, setTese] = useState<Tese | null>(null);
    const [indicativos, setIndicativos] = useState<Indicativo[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal / Form state para criar/editar indicativo
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [formTitulo, setFormTitulo] = useState("");
    const [formNumero, setFormNumero] = useState(1);
    const [saving, setSaving] = useState(false);

    // Carregar sessão
    useEffect(() => {
        const saved = localStorage.getItem("conteffa_oficina_session");
        if (!saved) {
            navigate("/oficina");
            return;
        }
        try {
            const parsed: OficinaUsuario = JSON.parse(saved);
            setUserSession(parsed);
            loadData(parsed.tese_id);
        } catch (e) {
            navigate("/oficina");
        }
    }, []);

    // Assinar Realtime
    useEffect(() => {
        if (!userSession?.tese_id) return;
        const unsubscribe = subscribeToVotacaoRealtime(
            () => loadData(userSession.tese_id),
            () => loadData(userSession.tese_id)
        );
        return () => unsubscribe();
    }, [userSession?.tese_id]);

    const loadData = async (teseId: string | number) => {
        setLoading(true);
        try {
            const teseData = await getTeseById(teseId);
            setTese(teseData);

            if (teseData) {
                const list = await getIndicativosByTese(teseData.id);
                setIndicativos(list);
            }
        } catch (err) {
            console.error("Erro ao carregar dados da oficina:", err);
            toast.error("Erro ao carregar dados da sala.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("conteffa_oficina_session");
        toast.info("Sessão encerrada.");
        navigate("/oficina");
    };

    const handleOpenCreateForm = () => {
        setEditingId(null);
        setFormTitulo("");
        const nextNum = indicativos.length > 0 ? Math.max(...indicativos.map(i => i.numero)) + 1 : 1;
        setFormNumero(nextNum);
        setShowForm(true);
    };

    const handleOpenEditForm = (ind: Indicativo) => {
        setEditingId(ind.id);
        setFormTitulo(ind.titulo || ind.descricao || "");
        setFormNumero(ind.numero);
        setShowForm(true);
    };

    const handleSaveIndicativo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tese) return;
        if (!formTitulo.trim()) {
            toast.error("O texto do indicativo é obrigatório.");
            return;
        }

        setSaving(true);
        try {
            await saveIndicativo({
                id: editingId || undefined,
                tese_id: tese.id,
                numero: formNumero,
                titulo: formTitulo.trim(),
                descricao: "",
                tempo_votacao: 180,
                status: 'Aguardando'
            });

            toast.success(editingId ? "Indicativo atualizado!" : "Novo indicativo cadastrado!");
            setShowForm(false);
            loadData(tese.id);
        } catch (error) {
            console.error("Erro ao salvar indicativo:", error);
            toast.error("Erro ao salvar indicativo.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteIndicativo = async (id: string | number) => {
        if (!confirm("Tem certeza que deseja excluir este indicativo?")) return;
        try {
            await deleteIndicativo(id);
            toast.success("Indicativo removido.");
            if (tese) loadData(tese.id);
        } catch (error) {
            toast.error("Erro ao excluir indicativo.");
        }
    };

    const handleConcluirSala = async () => {
        if (!tese) return;
        if (indicativos.length === 0) {
            toast.error("Cadastre pelo menos 1 indicativo antes de encerrar a sala.");
            return;
        }

        if (!confirm("Confirmar encerramento dos debates desta Sala de Oficina? A comissão será notificada em tempo real.")) {
            return;
        }

        try {
            await concluirOficinaTese(tese.id);
            toast.success("Sala concluída com sucesso! Notificação enviada à Comissão.");
            loadData(tese.id);
        } catch (error) {
            toast.error("Erro ao concluir sala.");
        }
    };

    if (loading && !tese) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span>Carregando Sala de Oficina...</span>
                </div>
            </div>
        );
    }

    const isConcluida = tese?.status === 'Concluída' || tese?.oficina_concluida;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
            {/* Top Navigation Bar */}
            <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white text-base leading-tight flex items-center gap-2">
                            <span>Sala de Oficina - CONTEFFA</span>
                            {isConcluida ? (
                                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-medium">
                                    <CheckCircle className="w-3 h-3" /> Concluída
                                </span>
                            ) : (
                                <span className="bg-rose-500/20 text-rose-400 text-xs px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1 font-medium">
                                    <Clock className="w-3 h-3" /> Em Andamento
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-slate-400">
                            Operador: <strong className="text-slate-200">{userSession?.nome_operador || userSession?.username}</strong>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                </button>
            </header>

            <main className="max-w-5xl mx-auto px-4 lg:px-8 pt-8">
                {/* Tese / Tema Card */}
                {tese && (
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 mb-3">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Tese Nº {tese.numero}
                                </span>
                                <h2 className="text-2xl font-bold text-white mb-2">{tese.titulo}</h2>
                                {tese.descricao && (
                                    <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
                                        {tese.descricao}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Status Alert Banner */}
                        {isConcluida ? (
                            <div className="mt-6 bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-300">Debate Liberado para Comissão</h4>
                                        <p className="text-xs text-emerald-400/90 mt-0.5">
                                            Sala concluída! Os indicativos foram finalizados e disponibilizados para acompanhamento da Comissão em tempo real.
                                        </p>
                                    </div>
                                </div>
                                <span className="px-3.5 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-950/50">
                                    <CheckCircle className="w-4 h-4" /> Sala Concluída
                                </span>
                            </div>
                        ) : (
                            <div className="mt-6 bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-rose-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-rose-300">Debates em Andamento</h4>
                                        <p className="text-xs text-rose-400/80">
                                            Cadastre os indicativos resultantes do debate da sala abaixo e clique em "Concluir Sala" ao finalizar.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConcluirSala}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-cyan-950/40 flex items-center gap-2 transition-all flex-shrink-0"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Concluir Sala</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>Indicativos da Tese</span>
                            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-mono">
                                {indicativos.length}
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                            Itens e propostas elaboradas na sala para votação em plenária.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateForm}
                        disabled={isConcluida}
                        className={`px-4 py-2.5 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all ${
                            isConcluida 
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none border border-slate-700" 
                                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-950/40"
                        }`}
                        title={isConcluida ? "Sala concluída - Não é possível adicionar novos indicativos" : "Adicionar Indicativo"}
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Indicativo</span>
                    </button>
                </div>

                {/* List of Indicativos */}
                {indicativos.length === 0 ? (
                    <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
                        <MessageSquareQuote className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-base font-semibold text-slate-300">Nenhum indicativo cadastrado</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                            Sua sala de oficina ainda não registrou nenhum indicativo para esta Tese. Clique no botão "+ Indicativo" acima para adicionar o primeiro item debatido.
                        </p>
                    </div>
                ) : (
                    <div className="bg-[#0F1C36] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                        {indicativos.map((ind, index) => (
                            <div
                                key={ind.id}
                                className={`p-4 sm:p-5 transition-colors border-b border-white/5 last:border-b-0 flex items-center justify-between gap-4 ${
                                    index % 2 === 0 ? "bg-[#112345]/90" : "bg-[#0A162B]/90"
                                } hover:bg-cyan-950/30`}
                            >
                                <div className="flex items-start space-x-3.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                                        {ind.numero || index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm sm:text-base font-bold text-white leading-snug whitespace-pre-line break-words">
                                            {ind.titulo}
                                        </h4>
                                        {ind.descricao ? (
                                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mt-2">
                                                {ind.descricao}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                {!isConcluida && (
                                    <div className="flex items-center space-x-2 shrink-0">
                                        <button
                                            onClick={() => handleOpenEditForm(ind)}
                                            className="w-8 h-8 rounded-full border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all flex items-center justify-center shadow-sm"
                                            title="Editar Indicativo"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteIndicativo(ind.id)}
                                            className="w-8 h-8 rounded-full border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 hover:border-rose-400 transition-all flex items-center justify-center shadow-sm"
                                            title="Excluir Indicativo"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal Form para Adicionar / Editar Indicativo */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-white mb-1">
                            {editingId ? "Editar Indicativo" : "Novo Indicativo da Sala"}
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">
                            Escreva o conteúdo debatido na sala para ser votado em plenária.
                        </p>

                        <form onSubmit={handleSaveIndicativo} className="space-y-4">
                            <div className="w-28">
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Número
                                </label>
                                <input
                                    type="number"
                                    value={formNumero}
                                    onChange={(e) => setFormNumero(Number(e.target.value))}
                                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min={1}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Indicativo
                                </label>
                                <textarea
                                    value={formTitulo}
                                    onChange={(e) => setFormTitulo(e.target.value)}
                                    placeholder="Escreva a redação do indicativo..."
                                    rows={5}
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
                                    required
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-cyan-950/40 flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{saving ? "Salvando..." : "Salvar"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PainelSalaOficina;
