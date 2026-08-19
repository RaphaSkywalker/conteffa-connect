import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { 
    Tese, 
    Indicativo,
    VotacaoStats 
} from "@/types/votacao";
import { 
    getTeseById, 
    getIndicativoById,
    getIndicativoStats, 
    encerrarVotacaoIndicativo, 
    subscribeToVotacaoRealtime,
    getBaseAppUrl 
} from "@/services/votacaoService";
import { 
    Clock, 
    Maximize2, 
    Minimize2, 
    Sun, 
    Moon, 
    CheckCircle2, 
    XCircle, 
    MinusCircle, 
    Users, 
    Radio, 
    ShieldCheck, 
    AlertCircle
} from "lucide-react";
import { 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    Tooltip, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis 
} from "recharts";
import { motion } from "framer-motion";

export const TesePublica = () => {
    const { id } = useParams<{ id: string }>();
    const [indicativo, setIndicativo] = useState<Indicativo | null>(null);
    const [tese, setTese] = useState<Tese | null>(null);
    const [stats, setStats] = useState<VotacaoStats>({
        indicativo_id: id || 0,
        total_inscritos: 0,
        total_votantes: 0,
        percentual_participacao: 0,
        total_sim: 0,
        total_nao: 0,
        total_abster: 0,
        percentual_sim: 0,
        percentual_nao: 0,
        percentual_abster: 0
    });

    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [chartType, setChartType] = useState<"pie" | "bar">("bar");
    const containerRef = useRef<HTMLDivElement>(null);

    // Carregar dados do indicativo e da tese pai
    const loadData = async () => {
        if (!id) return;
        try {
            // Tentar primeiro buscar por indicativo ID
            let indData = await getIndicativoById(id);
            if (indData) {
                setIndicativo(indData);
                const parentTese = await getTeseById(indData.tese_id);
                setTese(parentTese);
                const currentStats = await getIndicativoStats(indData.id);
                setStats(currentStats);
            } else {
                // Fallback: Tentar buscar tese direta
                const parentTese = await getTeseById(id);
                setTese(parentTese);
            }
        } catch (err) {
            console.error("Erro ao carregar dados no Telão:", err);
        }
    };

    useEffect(() => {
        loadData();

        const unsubscribe = subscribeToVotacaoRealtime(
            () => loadData(),
            () => loadData(),
            () => loadData()
        );

        const pollInterval = setInterval(() => {
            loadData();
        }, 2000);

        return () => {
            unsubscribe();
            clearInterval(pollInterval);
        };
    }, [id]);

    // Cronômetro Regressivo
    useEffect(() => {
        const item = indicativo || tese;
        if (!item) return;

        const updateTimer = () => {
            if (item.status === 'Em votação' && item.data_fim) {
                const diffMs = new Date(item.data_fim).getTime() - Date.now();
                const diffSec = Math.max(0, Math.ceil(diffMs / 1000));
                setTimeLeft(diffSec);

                if (diffSec <= 0 && item.status === 'Em votação' && indicativo) {
                    encerrarVotacaoIndicativo(indicativo.id).then(() => loadData());
                }
            } else if (item.status === 'Aguardando') {
                setTimeLeft(item.tempo_votacao || 180);
            } else {
                setTimeLeft(0);
            }
        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        return () => clearInterval(timerInterval);
    }, [indicativo, tese]);

    // Alternar Tela Cheia
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const targetItemId = indicativo?.id || tese?.id || id;
    const votingUrl = `${getBaseAppUrl()}/votar/${targetItemId}`;

    const chartData = [
        { name: "SIM", value: stats.total_sim, percent: stats.percentual_sim, color: "#10B981" },
        { name: "NÃO", value: stats.total_nao, percent: stats.percentual_nao, color: "#EF4444" },
        { name: "ABSTER", value: stats.total_abster, percent: stats.percentual_abster, color: "#64748B" }
    ];

    const currentStatus = indicativo?.status || tese?.status || 'Aguardando';
    const isUrgent = currentStatus === 'Em votação' && timeLeft !== null && timeLeft <= 30 && timeLeft > 0;

    return (
        <div 
            ref={containerRef}
            className={`min-h-screen transition-colors duration-500 flex flex-col justify-between select-none ${
                isDarkMode ? "bg-[#070F1E] text-slate-100" : "bg-slate-100 text-slate-900"
            }`}
        >
            {/* Header Telão */}
            <header className={`px-8 py-5 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-30 transition-colors ${
                isDarkMode ? "bg-[#0A162B]/90 border-white/10" : "bg-white/90 border-slate-200 shadow-sm"
            }`}>
                <div className="flex items-center gap-6">
                    <img 
                        src="/admin-logo.png" 
                        alt="CONTEFFA" 
                        className="h-10 md:h-12 w-auto object-contain drop-shadow-md"
                        onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                        }}
                    />
                    <div className="border-l border-white/10 pl-6 hidden sm:block">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 block">
                            CONGRESSO NACIONAL CONTEFFA
                        </span>
                        <h1 className="text-lg md:text-xl font-heading font-black tracking-tight flex items-center gap-2">
                            Painel de Votação Plenária
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md font-black text-xs uppercase tracking-widest bg-white/5 border-white/10">
                        {currentStatus === 'Em votação' ? (
                            <>
                                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-emerald-400 font-black">AO VIVO • VOTAÇÃO ABERTA</span>
                            </>
                        ) : currentStatus === 'Encerrada' ? (
                            <>
                                <span className="w-3 h-3 rounded-full bg-rose-500" />
                                <span className="text-rose-400 font-black">VOTAÇÃO ENCERRADA</span>
                            </>
                        ) : (
                            <>
                                <span className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-amber-400 font-black">AGUARDANDO ABERTURA</span>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setChartType(chartType === "bar" ? "pie" : "bar")}
                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-xs font-black uppercase tracking-wider hidden md:flex items-center gap-2"
                    >
                        {chartType === "bar" ? "Gráfico Pizza" : "Gráfico Barras"}
                    </button>

                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all flex items-center gap-2 font-bold text-xs"
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        <span className="hidden md:inline">{isFullscreen ? "Sair Tela Cheia" : "Tela Cheia"}</span>
                    </button>
                </div>
            </header>

            {/* Conteúdo Principal do Telão */}
            <main className="flex-1 p-6 md:p-10 max-w-[1700px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Coluna Esquerda: Nome da Tese (Fonte menor no topo) + Nome do Indicativo em Destaque (5 Colunas) */}
                <section className="lg:col-span-5 flex flex-col justify-between gap-6">
                    <div className={`p-8 md:p-10 rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-between ${
                        isDarkMode ? "bg-[#0E1C38] border-white/10" : "bg-white border-slate-200 shadow-xl"
                    }`}>
                        <div>
                            {/* Linha 1 (Fonte Menor / Badge Secundário): Nome da Tese (Tema) */}
                            {tese && (
                                <div className="mb-4">
                                    <span className="inline-block text-xs md:text-sm font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl mb-1">
                                        TESE Nº {tese.numero}: {tese.titulo}
                                    </span>
                                </div>
                            )}

                            {/* Linha 2 (Destaque Principal H1): Nome/Título do Indicativo */}
                            <h2 className={`font-heading font-black text-2xl md:text-3xl lg:text-4xl tracking-tight mb-4 leading-snug ${
                                isDarkMode ? "text-white" : "text-slate-900"
                            }`}>
                                {indicativo ? `INDICATIVO Nº ${indicativo.numero}: ${indicativo.titulo}` : (tese ? tese.titulo : "Carregando Votação...")}
                            </h2>

                            {/* Descrição do Indicativo */}
                            {(indicativo?.descricao || tese?.descricao) && (
                                <div className={`p-6 rounded-2xl border max-h-56 overflow-y-auto custom-scrollbar text-sm md:text-base leading-relaxed ${
                                    isDarkMode ? "bg-white/5 border-white/5 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                                }`}>
                                    <p className="whitespace-pre-line font-medium">
                                        {indicativo?.descricao || tese?.descricao}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Bloco Central: QR Code Gigante */}
                        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center justify-center text-center">
                            <div className="p-5 bg-white rounded-3xl shadow-2xl border-4 border-emerald-500/40 relative group hover:scale-105 transition-transform duration-300">
                                <QRCodeSVG
                                    value={votingUrl}
                                    size={230}
                                    level="H"
                                    includeMargin={true}
                                />
                                {currentStatus === 'Encerrada' && (
                                    <div className="absolute inset-0 bg-slate-950/80 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                                        <AlertCircle className="w-12 h-12 text-rose-400 mb-2" />
                                        <span className="font-black text-sm uppercase tracking-wider text-rose-400">Votação Encerrada</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-1">
                                <p className={`font-heading font-black text-lg uppercase tracking-wider ${
                                    isDarkMode ? "text-white" : "text-slate-800"
                                }`}>
                                    Aponte a câmera para votar
                                </p>
                                <p className="text-xs text-white/50 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Votação restrita aos congressistas inscritos
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Coluna Direita: Cronômetro, Métricas & Gráficos (7 Colunas) */}
                <section className="lg:col-span-7 flex flex-col justify-between gap-6">
                    
                    {/* Cronômetro Regressivo */}
                    <div className={`p-8 md:p-10 rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
                        isUrgent 
                            ? "bg-rose-950/40 border-rose-500/50 shadow-rose-500/10" 
                            : isDarkMode ? "bg-[#0E1C38] border-white/10" : "bg-white border-slate-200 shadow-xl"
                    }`}>
                        <div className="flex items-center gap-5">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border shadow-xl ${
                                isUrgent 
                                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse" 
                                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            }`}>
                                <Clock className="w-10 h-10" />
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-[0.25em] text-white/40 block">
                                    Tempo da Votação
                                </span>
                                <span className="text-lg font-bold text-white/80">
                                    {currentStatus === 'Em votação' ? 'Contagem Regressiva' : currentStatus === 'Encerrada' ? 'Tempo Esgotado' : 'Aguardando Início'}
                                </span>
                            </div>
                        </div>

                        <div className="text-center md:text-right">
                            <motion.div 
                                animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className={`font-heading font-black text-6xl md:text-8xl tracking-tight leading-none ${
                                    isUrgent 
                                        ? "text-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.5)]" 
                                        : currentStatus === 'Em votação'
                                            ? "text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                            : "text-white/60"
                                }`}
                            >
                                {formatTime(timeLeft)}
                            </motion.div>
                        </div>
                    </div>

                    {/* Placar de Votos (SIM, NÃO, ABSTER) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className={`p-6 rounded-3xl border transition-all ${
                            isDarkMode ? "bg-emerald-950/20 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" /> SIM
                                </span>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    {stats.percentual_sim}%
                                </span>
                            </div>
                            <div className="text-4xl md:text-5xl font-heading font-black text-emerald-400 tracking-tight">
                                {stats.total_sim}
                            </div>
                            <p className="text-[11px] text-white/40 font-medium mt-1">Aprovações</p>
                        </div>

                        <div className={`p-6 rounded-3xl border transition-all ${
                            isDarkMode ? "bg-rose-950/20 border-rose-500/30" : "bg-rose-50 border-rose-200"
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4" /> NÃO
                                </span>
                                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                    {stats.percentual_nao}%
                                </span>
                            </div>
                            <div className="text-4xl md:text-5xl font-heading font-black text-rose-400 tracking-tight">
                                {stats.total_nao}
                            </div>
                            <p className="text-[11px] text-white/40 font-medium mt-1">Rejeições</p>
                        </div>

                        <div className={`p-6 rounded-3xl border transition-all ${
                            isDarkMode ? "bg-slate-900/40 border-slate-600/30" : "bg-slate-100 border-slate-300"
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                    <MinusCircle className="w-4 h-4" /> ABSTER
                                </span>
                                <span className="text-xs font-bold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full">
                                    {stats.percentual_abster}%
                                </span>
                            </div>
                            <div className="text-4xl md:text-5xl font-heading font-black text-slate-300 tracking-tight">
                                {stats.total_abster}
                            </div>
                            <p className="text-[11px] text-white/40 font-medium mt-1">Abstenções</p>
                        </div>
                    </div>

                    {/* Gráfico de Votação */}
                    <div className={`p-8 rounded-[2.5rem] border shadow-2xl flex-1 flex flex-col justify-between ${
                        isDarkMode ? "bg-[#0E1C38] border-white/10" : "bg-white border-slate-200 shadow-xl"
                    }`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="font-heading font-black text-xl text-white">Resultado do Indicativo</h3>
                                <p className="text-xs text-white/40 font-medium">Contagem ao vivo da plenária</p>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5">
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Participação</span>
                                    <span className="text-base font-heading font-black text-emerald-400">
                                        {stats.total_votantes} / {stats.total_inscritos || "-"} ({stats.percentual_participacao}%)
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === "bar" ? (
                                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={14} fontWeight="bold" />
                                        <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "1rem", color: "#fff" }}
                                            formatter={(val: any, name: any, item: any) => [`${val} votos (${item.payload.percent}%)`, item.payload.name]}
                                        />
                                        <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                ) : (
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={95}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${percent}%`}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "1rem", color: "#fff" }}
                                            formatter={(val: any, name: any, item: any) => [`${val} votos (${item.payload.percent}%)`, item.payload.name]}
                                        />
                                    </PieChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>
            </main>

            <footer className={`px-8 py-4 border-t flex flex-col sm:flex-row items-center justify-between text-xs transition-colors ${
                isDarkMode ? "bg-[#0A162B] border-white/10 text-white/40" : "bg-white border-slate-200 text-slate-500"
            }`}>
                <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Sistema Oficial de Votação do IX CONTEFFA • Conexão Segura</span>
                </div>
                <div className="mt-2 sm:mt-0 font-medium">
                    Atualização instantânea via Supabase Realtime
                </div>
            </footer>
        </div>
    );
};

export default TesePublica;
