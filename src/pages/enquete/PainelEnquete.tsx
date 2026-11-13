import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, Maximize2, Minimize2, Radio, Users } from "lucide-react";
import { Enquete, EnqueteResultados } from "@/types/enquete";
import { getBaseAppUrl, getTotalInscritosCount } from "@/services/votacaoService";
import {
    getEnqueteById,
    getEnqueteResultados,
    getEnqueteVotarUrl,
    subscribeToEnquetesRealtime,
} from "@/services/enqueteService";
import EnqueteResultadosChart from "@/components/enquete/EnqueteResultadosChart";

const POLL_MS = 3000;

const PainelEnquete = () => {
    const { id } = useParams<{ id: string }>();
    const [enquete, setEnquete] = useState<Enquete | null>(null);
    const [resultados, setResultados] = useState<EnqueteResultados | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const totalInscritosRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!id) return;

        const load = async () => {
            try {
                if (totalInscritosRef.current === undefined) {
                    totalInscritosRef.current = await getTotalInscritosCount();
                }
                const data = await getEnqueteById(id);
                setEnquete(data);
                if (data) setResultados(await getEnqueteResultados(data, totalInscritosRef.current));
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

    return (
        <div ref={containerRef} className="min-h-screen bg-[#050B17] text-white flex flex-col relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

            <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/10">
                <div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">
                        IX CONTEFFA • ENQUETE {enquete.tipo === "disputa" ? "DE DISPUTA" : "SIM / NÃO"}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-heading font-black leading-tight mt-1">{enquete.titulo}</h1>
                    {enquete.descricao && <p className="text-white/60 mt-2 text-lg max-w-4xl">{enquete.descricao}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0">
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

            <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-8 p-8">
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
            </main>
        </div>
    );
};

export default PainelEnquete;

