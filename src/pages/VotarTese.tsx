import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    Tese, 
    Indicativo,
    VotoTipo
} from "@/types/votacao";
import { 
    getTeseById, 
    getIndicativoById,
    checkUserAlreadyVotedIndicativo, 
    submitVoto, 
    getClientIP,
    subscribeToVotacaoRealtime
} from "@/services/votacaoService";
import { 
    CheckCircle2, 
    XCircle, 
    MinusCircle, 
    ShieldCheck, 
    AlertTriangle, 
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const VotarTese = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [indicativo, setIndicativo] = useState<Indicativo | null>(null);
    const [tese, setTese] = useState<Tese | null>(null);
    const [loading, setLoading] = useState(true);
    const [clientIp, setClientIp] = useState<string>("");
    const [alreadyVotedIp, setAlreadyVotedIp] = useState(false);

    // Etapas do fluxo: 'voto' | 'sucesso'
    const [step, setStep] = useState<'voto' | 'sucesso'>('voto');

    // Opção de voto selecionada
    const [selectedOption, setSelectedOption] = useState<VotoTipo | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [submittingVote, setSubmittingVote] = useState(false);

    // Carregar informações do Indicativo, da Tese e validar IP
    const loadVotingItem = async () => {
        if (!id) return;
        try {
            const [indData, ip] = await Promise.all([
                getIndicativoById(id),
                getClientIP()
            ]);
            setClientIp(ip);

            let resolvedTese: Tese | null = null;
            if (indData) {
                setIndicativo(indData);
                resolvedTese = await getTeseById(indData.tese_id);
                setTese(resolvedTese);
            } else {
                resolvedTese = await getTeseById(id);
                setTese(resolvedTese);
            }

            const targetIndId = indData ? indData.id : undefined;
            const targetTeseId = resolvedTese ? resolvedTese.id : undefined;
            if (ip && (targetIndId || targetTeseId)) {
                const voted = await checkUserAlreadyVotedIndicativo(targetIndId, targetTeseId, ip);
                setAlreadyVotedIp(voted);
            }
        } catch (err) {
            console.error("Erro ao carregar item para votação:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVotingItem();

        const unsubscribe = subscribeToVotacaoRealtime(
            () => loadVotingItem(),
            () => loadVotingItem(),
            () => loadVotingItem()
        );

        return () => unsubscribe();
    }, [id]);

    const activeItem = indicativo || tese;
    const currentStatus = activeItem?.status || 'Aguardando';

    // Submissão do Voto após confirmação no modal
    const handleConfirmVote = async () => {
        if (!selectedOption || !activeItem) return;

        setSubmittingVote(true);
        try {
            const ip = clientIp || await getClientIP();
            const res = await submitVoto({
                indicativoId: indicativo?.id,
                teseId: tese?.id || indicativo?.tese_id,
                ip,
                cpf: ip,
                voto: selectedOption
            });

            if (res.success) {
                setIsConfirmModalOpen(false);
                setStep('sucesso');
                toast.success("Voto computado com sucesso!");
            } else {
                toast.error(res.message);
                setIsConfirmModalOpen(false);
                if (res.message.includes("já votou") || res.message.includes("já registrou")) {
                    setAlreadyVotedIp(true);
                }
            }
        } catch (err) {
            console.error("Erro ao enviar voto:", err);
            toast.error("Erro ao registrar voto. Tente novamente.");
        } finally {
            setSubmittingVote(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070F1E] flex flex-col items-center justify-center text-white p-6">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-white/50">Carregando Votação...</p>
            </div>
        );
    }

    if (!activeItem) {
        return (
            <div className="min-h-screen bg-[#070F1E] flex flex-col items-center justify-center text-white p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
                <h2 className="text-2xl font-heading font-black mb-2">Item Não Encontrado</h2>
                <p className="text-white/50 text-sm max-w-md mb-6">
                    A tese ou indicativo solicitado não existe ou foi removido.
                </p>
                <Button onClick={() => navigate("/")} className="rounded-full bg-emerald-600 font-bold">
                    Voltar ao Início
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070F1E] text-slate-100 flex flex-col justify-between relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header Mobile */}
            <header className="px-6 py-5 bg-[#0A162B]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img 
                        src="/admin-logo.png" 
                        alt="CONTEFFA" 
                        className="h-8 w-auto object-contain"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block">
                            IX CONTEFFA • VOTAÇÃO PLENÁRIA
                        </span>
                        <h1 className="text-sm font-heading font-black text-white">
                            {indicativo ? `Indicativo Nº ${indicativo.numero}` : `Tese Nº ${tese?.numero}`}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">
                    {currentStatus === 'Em votação' ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-400">Aberta</span>
                        </>
                    ) : currentStatus === 'Encerrada' ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-rose-400">Encerrada</span>
                        </>
                    ) : (
                        <>
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-amber-400">Aguardando</span>
                        </>
                    )}
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="flex-1 p-5 md:p-8 max-w-xl w-full mx-auto flex flex-col justify-center relative z-10">
                <AnimatePresence mode="wait">
                    {alreadyVotedIp && step !== 'sucesso' ? (
                        <motion.div
                            key="already-voted"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0E1C38] p-8 md:p-10 rounded-[2.5rem] border border-amber-500/30 shadow-2xl text-center space-y-5"
                        >
                            <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-10 h-10 text-amber-400" />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 block">
                                    ACESSO BLOQUEADO POR DUPLICIDADE
                                </span>
                                <h2 className="text-2xl font-heading font-black text-white">
                                    Você já votou neste processo!
                                </h2>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    Já identificamos um voto registrado a partir do seu endereço IP ({clientIp}) para esta votação. Não é permitido votar mais de uma vez.
                                </p>
                            </div>
                        </motion.div>
                    ) : step === 'voto' ? (
                        <motion.div
                            key="step-voto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Informações da Proposta */}
                            <div className="bg-[#0E1C38] p-6 rounded-3xl border border-white/10 shadow-xl space-y-3">
                                {tese && (
                                    <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest inline-block">
                                        Tese Nº {tese.numero}: {tese.titulo}
                                    </span>
                                )}
                                <h3 className="font-heading font-black text-lg text-white">
                                    {indicativo ? `Indicativo Nº ${indicativo.numero}: ${indicativo.titulo}` : tese?.titulo}
                                </h3>
                                {(indicativo?.descricao || tese?.descricao) && (
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/70 leading-relaxed max-h-40 overflow-y-auto">
                                        {indicativo?.descricao || tese?.descricao}
                                    </div>
                                )}
                            </div>

                            {/* Alerta de Status quando não está em votação */}
                            {currentStatus !== 'Em votação' && (
                                <div className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
                                    currentStatus === 'Encerrada'
                                        ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                                        : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                                }`}>
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-xs uppercase tracking-wider mb-1">
                                            {currentStatus === 'Encerrada' ? "Votação Encerrada" : "Votação Não Iniciada"}
                                        </h4>
                                        <p className="text-[11px] opacity-80 leading-relaxed">
                                            {currentStatus === 'Encerrada'
                                                ? "O prazo para registro de votos nesta proposta expirou."
                                                : "Aguarde o coordenador da mesa abrir a votação no telão."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Opções SIM / NÃO / ABSTER */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-white/40 block ml-1">
                                    Selecione seu Voto
                                </label>

                                <button
                                    type="button"
                                    disabled={currentStatus !== 'Em votação'}
                                    onClick={() => setSelectedOption('SIM')}
                                    className={`w-full p-5 rounded-2xl border text-left transition-all flex items-start gap-4 disabled:opacity-40 disabled:cursor-not-allowed ${
                                        selectedOption === 'SIM'
                                            ? "bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.02]"
                                            : "bg-[#0E1C38] border-white/10 hover:border-emerald-500/40"
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                        selectedOption === 'SIM' ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-400"
                                    }`}>
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-heading font-black text-lg text-emerald-400">SIM</h4>
                                        <p className="text-xs text-white/60 mt-0.5">Aprovo este indicativo.</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    disabled={currentStatus !== 'Em votação'}
                                    onClick={() => setSelectedOption('NAO')}
                                    className={`w-full p-5 rounded-2xl border text-left transition-all flex items-start gap-4 disabled:opacity-40 disabled:cursor-not-allowed ${
                                        selectedOption === 'NAO'
                                            ? "bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30 scale-[1.02]"
                                            : "bg-[#0E1C38] border-white/10 hover:border-rose-500/40"
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                        selectedOption === 'NAO' ? "bg-rose-500 text-white" : "bg-rose-500/10 text-rose-400"
                                    }`}>
                                        <XCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-heading font-black text-lg text-rose-400">NÃO</h4>
                                        <p className="text-xs text-white/60 mt-0.5">Rejeito este indicativo.</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    disabled={currentStatus !== 'Em votação'}
                                    onClick={() => setSelectedOption('ABSTER')}
                                    className={`w-full p-5 rounded-2xl border text-left transition-all flex items-start gap-4 disabled:opacity-40 disabled:cursor-not-allowed ${
                                        selectedOption === 'ABSTER'
                                            ? "bg-slate-500/30 border-slate-400 ring-2 ring-slate-400/30 scale-[1.02]"
                                            : "bg-[#0E1C38] border-white/10 hover:border-slate-500/40"
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                        selectedOption === 'ABSTER' ? "bg-slate-400 text-slate-900" : "bg-slate-500/20 text-slate-400"
                                    }`}>
                                        <MinusCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-heading font-black text-lg text-slate-300">ABSTER</h4>
                                        <p className="text-xs text-white/60 mt-0.5">Abstenção.</p>
                                    </div>
                                </button>
                            </div>

                            <Button
                                disabled={!selectedOption || currentStatus !== 'Em votação'}
                                onClick={() => setIsConfirmModalOpen(true)}
                                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.98] transition-all"
                            >
                                Confirmar Voto ({selectedOption || "Selecione"})
                            </Button>

                            <p className="text-[10px] text-white/40 text-center flex items-center justify-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Voto único validado por endereço IP
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step-sucesso"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#0E1C38] p-8 md:p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center space-y-6"
                        >
                            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                                <Check className="w-12 h-12 text-emerald-400" />
                            </div>

                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 block mb-1">
                                    VOTO REGISTRADO COM SUCESSO
                                </span>
                                <h3 className="text-2xl font-heading font-black text-white">
                                    Obrigado por votar!
                                </h3>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 text-left space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40 font-bold uppercase">Proposta:</span>
                                    <span className="text-white font-bold">{indicativo ? `Indicativo Nº ${indicativo.numero}` : `Tese Nº ${tese?.numero}`}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40 font-bold uppercase">Voto Registrado:</span>
                                    <span className={`font-black ${
                                        selectedOption === 'SIM' ? 'text-emerald-400' :
                                        selectedOption === 'NAO' ? 'text-rose-400' : 'text-slate-300'
                                    }`}>{selectedOption}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40 font-bold uppercase">Horário:</span>
                                    <span className="text-white/70">{new Date().toLocaleTimeString('pt-BR')}</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => navigate("/")}
                                variant="outline"
                                className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest"
                            >
                                Concluir
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Modal de Confirmação */}
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogContent className="max-w-sm bg-[#0E1C38] border-white/10 rounded-3xl p-6 text-center text-white">
                    <DialogTitle className="text-xl font-heading font-black text-white mb-2">
                        Confirmar Voto?
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/60 mb-6">
                        Você confirma o voto <strong className={`font-black ${
                            selectedOption === 'SIM' ? 'text-emerald-400' :
                            selectedOption === 'NAO' ? 'text-rose-400' : 'text-slate-300'
                        }`}>{selectedOption}</strong>? <br />
                        Esta ação é definitiva para este indicativo.
                    </DialogDescription>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="flex-1 rounded-xl h-12 text-white/50 hover:text-white border border-white/10"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmVote}
                            disabled={submittingVote}
                            className="flex-1 rounded-xl h-12 bg-emerald-600 hover:bg-emerald-500 font-black text-xs uppercase tracking-widest text-white shadow-lg"
                        >
                            {submittingVote ? "Gravando..." : "Confirmar"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <footer className="px-6 py-4 border-t border-white/10 text-center text-[10px] text-white/30 font-bold uppercase tracking-widest">
                IX CONTEFFA • Sistema de Votação Plenária
            </footer>
        </div>
    );
};

export default VotarTese;
