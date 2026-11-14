import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, BarChart3, Maximize2, Minimize2, Radio, Sparkles, Trophy, Users } from "lucide-react";
import { Enquete, EnqueteResultados, OpcaoResultado } from "@/types/enquete";
import { getBaseAppUrl, getTotalInscritosCount } from "@/services/votacaoService";
import {
    getEnqueteById,
    getEnqueteResultados,
    getEnqueteVotarUrl,
    subscribeToEnquetesRealtime,
} from "@/services/enqueteService";
import EnqueteResultadosChart from "@/components/enquete/EnqueteResultadosChart";
import { BandeiraEstado } from "@/components/enquete/BandeiraEstado";

const POLL_MS = 3000;

const PainelEnquete = () => {
    const { id } = useParams<{ id: string }>();
    const [enquete, setEnquete] = useState<Enquete | null>(null);
    const [resultados, setResultados] = useState<EnqueteResultados | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<"vencedor" | "grafico">("vencedor");
    const containerRef = useRef<HTMLDivElement>(null);
    const totalInscritosRef = useRef<number | undefined>(undefined);
    const prevStatusRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!id) return;

        const load = async () => {
            try {
                if (totalInscritosRef.current === undefined) {
                    totalInscritosRef.current = await getTotalInscritosCount();
                }
                const data = await getEnqueteById(id);
                setEnquete(data);
                if (data) {
                    const res = await getEnqueteResultados(data, totalInscritosRef.current);
                    setResultados(res);

                    // Quando o status mudar para Encerrada no telão, dispara automaticamente a tela de vencedor
                    if (prevStatusRef.current !== "Encerrada" && data.status === "Encerrada") {
                        setViewMode("vencedor");
                    }
                    prevStatusRef.current = data.status;
                }
            } catch (err) {
                console.error("Erro ao carregar painel da enquete:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
        const unsubscribe = subscribeToEnquetesRealtime(load);
        const poll = setInterval(load, POLL_MS);
        return () => {
            unsubscribe();
            clearInterval(poll);
        };
    }, [id]);

    useEffect(() => {
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else containerRef.current?.requestFullscreen().catch(() => {});
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050B17] flex items-center justify-center">
                <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!enquete) {
        return (
            <div className="min-h-screen bg-[#050B17] flex flex-col items-center justify-center text-white gap-4">
                <AlertCircle className="w-16 h-16 text-amber-400" />
                <h1 className="text-3xl font-heading font-black">Enquete não encontrada</h1>
            </div>
        );
    }

    const votarUrl = getEnqueteVotarUrl(getBaseAppUrl(), enquete.id);
    const isOpen = enquete.status === "Em votação";
    const isClosed = enquete.status === "Encerrada";
    const isDisputa = enquete.tipo === "disputa";

    // Identificar vencedor na disputa quando encerrada
    let vencedor: OpcaoResultado | null = null;
    const opcoes = resultados?.opcoes ?? [];
    if (isDisputa && isClosed && opcoes.length > 0) {
        const maxVotos = Math.max(...opcoes.map((o) => o.total));
        if (maxVotos > 0) {
            const lideres = opcoes.filter((o) => o.total === maxVotos);
            if (lideres.length === 1) {
                vencedor = lideres[0];
            }
        }
    }

    const exibirTelaVencedor = Boolean(vencedor && viewMode === "vencedor");

    return (
        <div ref={containerRef} className="min-h-screen bg-[#050B17] text-white flex flex-col relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

            <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/10">
                <div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">
                        IX CONTEFFA • ENQUETE {isDisputa ? "DE DISPUTA" : "SIM / NÃO"}
                    </span>
                    <h1 className="text-2xl md:text-4xl font-heading font-black leading-tight mt-1">{enquete.titulo}</h1>
                    {enquete.descricao && <p className="text-white/60 mt-1 text-base max-w-4xl">{enquete.descricao}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {vencedor && (
                        <button
                            type="button"
                            onClick={() => setViewMode(viewMode === "vencedor" ? "grafico" : "vencedor")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-black uppercase tracking-wider text-xs transition-all"
                        >
                            {viewMode === "vencedor" ? (
                                <>
                                    <BarChart3 className="w-4 h-4" /> Ver Gráfico
                                </>
                            ) : (
                                <>
                                    <Trophy className="w-4 h-4" /> Ver Vencedor
                                </>
                            )}
                        </button>
                    )}

                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full border font-black uppercase tracking-widest text-sm ${
                        isOpen ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : isClosed ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                                : "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    }`}>
                        {isOpen && <Radio className="w-4 h-4 animate-pulse" />}
                        {isOpen ? "Votação aberta" : isClosed ? "Votação encerrada" : "Aguardando início"}
                    </div>

                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                        className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {exibirTelaVencedor && vencedor ? (
                    <motion.main
                        key="tela-vencedor"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center"
                    >
                        {/* Brilho de fundo dourado/esmeralda */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[550px] h-[550px] bg-amber-400/15 rounded-full blur-[150px]" />
                        </div>

                        <div className="relative z-10 max-w-5xl w-full bg-[#0B1730]/90 border-2 border-amber-400/40 rounded-[3rem] px-8 py-10 md:px-14 md:py-12 shadow-[0_0_90px_rgba(251,191,36,0.18)] flex flex-col items-center gap-6">
                            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs md:text-sm font-black uppercase tracking-[0.25em]">
                                <Trophy className="w-5 h-5 text-amber-400" />
                                <span>Resultado Oficial • Vencedor da Disputa</span>
                                <Sparkles className="w-5 h-5 text-amber-400" />
                            </div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="text-5xl md:text-7xl lg:text-8xl font-heading font-black uppercase tracking-tight text-white drop-shadow-[0_6px_30px_rgba(251,191,36,0.35)]"
                            >
                                {vencedor.titulo}
                            </motion.h2>

                            {/* Dados do Vencedor */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                                <div className="bg-emerald-500/15 border border-emerald-400/40 rounded-2xl p-4">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300 block">
                                        Votos do Vencedor
                                    </span>
                                    <span className="text-4xl md:text-5xl font-heading font-black text-white block mt-1">
                                        {vencedor.total}
                                    </span>
                                </div>

                                <div className="bg-amber-500/15 border border-amber-400/40 rounded-2xl p-4">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 block">
                                        Percentual de Votos
                                    </span>
                                    <span className="text-4xl md:text-5xl font-heading font-black text-amber-300 block mt-1">
                                        {vencedor.percentual}%
                                    </span>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-white/50 block">
                                        Total de Votantes
                                    </span>
                                    <span className="text-4xl md:text-5xl font-heading font-black text-white block mt-1">
                                        {resultados?.total_votantes ?? 0}
                                    </span>
                                    <span className="text-xs text-emerald-400 font-bold">
                                        ({resultados?.percentual_participacao ?? 0}% de participação)
                                    </span>
                                </div>
                            </div>

                            {/* Bandeira do Estado abaixo dos dados do vencedor */}
                            <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.25, type: "spring", stiffness: 120 }}
                                className="pt-2 flex flex-col items-center gap-3"
                            >
                                <BandeiraEstado
                                    tituloOpcao={vencedor.titulo}
                                    className="w-72 sm:w-80 md:w-[420px] h-auto rounded-2xl border-4 border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.65)]"
                                />
                            </motion.div>

                            {/* Placar resumido das demais opções */}
                            {opcoes.length > 1 && (
                                <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-white/10 w-full text-sm text-white/60">
                                    {opcoes.map((o) => (
                                        <span
                                            key={o.opcao_id}
                                            className={`px-4 py-1.5 rounded-full border font-bold ${
                                                o.opcao_id === vencedor?.opcao_id
                                                    ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
                                                    : "bg-white/5 border-white/10 text-white/60"
                                            }`}
                                        >
                                            {o.titulo}: {o.total} votos ({o.percentual}%)
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.main>
                ) : (
                    <motion.main
                        key="tela-padrao"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-8 p-8"
                    >
                        <section className="bg-[#0B1730]/80 border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-6">
                            {isClosed ? (
                                <div className="space-y-3">
                                    <AlertCircle className="w-20 h-20 text-rose-400 mx-auto" />
                                    <h2 className="text-2xl font-heading font-black">Votação encerrada</h2>
                                    <p className="text-white/50">Não é mais possível votar nesta enquete.</p>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-heading font-black uppercase tracking-wider">Aponte a câmera e vote</h2>
                                    <div className={`bg-white p-5 rounded-3xl shadow-2xl ${isOpen ? "" : "opacity-40"}`}>
                                        <QRCodeSVG value={votarUrl} size={300} level="M" includeMargin={false} />
                                    </div>
                                    <p className="text-xs text-white/40 break-all font-mono">{votarUrl}</p>
                                    {!isOpen && <p className="text-amber-300 font-bold">A votação será liberada pela coordenação.</p>}
                                </>
                            )}

                            <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-black flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Votantes</span>
                                    <span className="text-4xl font-heading font-black">{resultados?.total_votantes ?? 0}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-black block">Participação</span>
                                    <span className="text-4xl font-heading font-black text-emerald-400">{resultados?.percentual_participacao ?? 0}%</span>
                                </div>
                            </div>
                        </section>

                        <section className="bg-[#0B1730]/80 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-center">
                            <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white/50 mb-6">Resultado em tempo real</h2>
                            <EnqueteResultadosChart enquete={enquete} resultados={resultados} large />
                        </section>
                    </motion.main>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PainelEnquete;
