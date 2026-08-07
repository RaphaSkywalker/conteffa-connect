import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { 
    Tese, 
    VotacaoStats 
} from "@/types/votacao";
import { 
    getTeseById, 
    getTeseStats, 
    encerrarVotacaoTese, 
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
    Percent, 
    Radio, 
    ShieldCheck, 
    ExternalLink,
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
import { motion, AnimatePresence } from "framer-motion";

export const TesePublica = () => {
    const { id } = useParams<{ id: string }>();
    const [tese, setTese] = useState<Tese | null>(null);
    const [stats, setStats] = useState<VotacaoStats>({
        tese_id: id || 0,
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

    // Carregar dados da tese e estatísticas
    const loadTeseData = async () => {
        if (!id) return;
        const currentTese = await getTeseById(id);
        if (currentTese) {
            setTese(currentTese);
            const currentStats = await getTeseStats(currentTese.id);
            setStats(currentStats);
        }
    };

    useEffect(() => {
        loadTeseData();

        // 1. Inscrição em Tempo Real Supabase
        const unsubscribe = subscribeToVotacaoRealtime(
            () => loadTeseData(),
            () => loadTeseData()
        );

        // 2. Polling de fallback (a cada 2.5 segundos)
        const pollInterval = setInterval(() => {
            loadTeseData();
        }, 2500);

        return () => {
            unsubscribe();
            clearInterval(pollInterval);
        };
    }, [id]);

    // Lógica do Cronômetro Regressivo
    useEffect(() => {
        if (!tese) return;

        const updateTimer = () => {
            if (tese.status === 'Em votação' && tese.data_fim) {
                const diffMs = new Date(tese.data_fim).getTime() - Date.now();
                const diffSec = Math.max(0, Math.ceil(diffMs / 1000));
                setTimeLeft(diffSec);

                if (diffSec <= 0 && tese.status === 'Em votação') {
                    encerrarVotacaoTese(tese.id).then(() => loadTeseData());
                }
            } else if (tese.status === 'Aguardando') {
                setTimeLeft(tese.tempo_votacao || 180);
            } else {
                setTimeLeft(0);
            }
        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        return () => clearInterval(timerInterval);
    }, [tese]);

    // Alternar modo Tela Cheia
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch((err) => {
                console.error("Erro ao entrar em tela cheia:", err);
            });
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

    // Formatar Segundos em mm:ss
    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const votingUrl = `${getBaseAppUrl()}/votar/${tese?.id || id}`;

    const chartData = [
        { name: "SIM", value: stats.total_sim, percent: stats.percentual_sim, color: "#10B981" },
        { name: "NÃO", value: stats.total_nao, percent: stats.percentual_nao, color: "#EF4444" },
        { name: "ABSTER", value: stats.total_abster, percent: stats.percentual_abster, color: "#64748B" }
    ];

    if (!tese) {
        return (
            <div className="min-h-screen bg-[#070F1E] flex flex-col items-center justify-center text-white p-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <h2 className="text-xl font-heading font-bold uppercase tracking-wider">Carregando Sessão de Votação...</h2>
            </div>
        );
    }

    const isUrgent = tese.status === 'Em votação' && timeLeft !== null && timeLeft <= 30 && timeLeft > 0;

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
                            // Fallback caso a logo falhe
                            (e.target as HTMLElement).style.display = 'none';
                        }}
                    />
                    <div className="border-l border-white/10 pl-6 hidden sm:block">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary block">
                            CONGRESSO NACIONAL CONTEFFA
                        </span>
                        <h1 className="text-lg md:text-xl font-heading font-black tracking-tight flex items-center gap-2">
                            Painel de Votação Plenária
                        </h1>
                    </div>
                </div>

                {/* Status Badge & Controls */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all font-black text-xs uppercase tracking-widest bg-white/5 border-white/10">
                        {tese.status === 'Em votação' ? (
                            <>
                                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-emerald-400 font-black">AO VIVO • VOTAÇÃO ABERTA</span>
                            </>
                        ) : tese.status === 'Encerrada' ? (
                            <>
                                <span className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-red-400 font-black">VOTAÇÃO ENCERRADA</span>
                            </>
                        ) : (
                            <>
                                <span className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-amber-400 font-black">AGUARDANDO ABERTURA</span>
                            </>
                        )}
                    </div>

                    {/* Alternar Gráfico */}
                    <button
                        onClick={() => setChartType(chartType === "bar" ? "pie" : "bar")}
                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-xs font-black uppercase tracking-wider hidden md:flex items-center gap-2"
                        title="Alternar estilo de visualização gráfica"
                    >
                        {chartType === "bar" ? "Gráfico Pizza" : "Gráfico Barras"}
                    </button>

                    {/* Tema Claro/Escuro */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                        title="Alternar Tema"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
                    </button>

                    {/* Modo Tela Cheia */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center gap-2 font-bold text-xs"
                        title="Alternar Modo Tela Cheia"
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        <span className="hidden md:inline">{isFullscreen ? "Sair Tela Cheia" : "Tela Cheia"}</span>
                    </button>
                </div>
            </header>

            {/* Conteúdo Principal do Telão */}
            <main className="flex-1 p-6 md:p-10 max-w-[1700px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Coluna Esquerda: Dados da Tese & QR Code Gigante (5 Colunas) */}
                <section className="lg:col-span-5 flex flex-col justify-between gap-6">
                    <div className={`p-8 md:p-10 rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-between ${
                        isDarkMode ? "bg-[#0E1C38] border-white/10" : "bg-white border-slate-200 shadow-xl"
                    }`}>
                        {/* Header Tese */}
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <span className="px-5 py-2 rounded-2xl bg-primary text-white font-heading font-black text-xl md:text-2xl tracking-wider shadow-lg shadow-primary/30">
                                    TESE Nº {tese.numero}
                                </span>
                                <span className="text-white/40 text-xs font-black uppercase tracking-widest">
                                    Plenária Deliberativa
                                </span>
                            </div>

                            <h2 className={`font-heading font-black text-2xl md:text-4xl tracking-tight mb-6 leading-snug ${
                                isDarkMode ? "text-white" : "text-slate-900"
                            }`}>
                                {tese.titulo}
                            </h2>

                            {tese.descricao && (
                                <div className={`p-6 rounded-2xl border max-h-56 overflow-y-auto custom-scrollbar text-sm md:text-base leading-relaxed ${
                                    isDarkMode ? "bg-white/5 border-white/5 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                                }`}>
                                    <p className="whitespace-pre-line font-medium">{tese.descricao}</p>
                                </div>
                            )}
                        </div>

                        {/* Bloco Central: QR Code Gigante */}
                        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center justify-center text-center">
                            <div className="p-5 bg-white rounded-3xl shadow-2xl border-4 border-primary/40 relative group hover:scale-105 transition-transform duration-300">
                                <QRCodeSVG
                                    value={votingUrl}
                                    size={240}
                                    level="H"
                                    includeMargin={true}
                                />
                                {tese.status === 'Encerrada' && (
                                    <div className="absolute inset-0 bg-slate-950/80 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                                        <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
                                        <span className="font-black text-sm uppercase tracking-wider text-red-400">Votação Encerrada</span>
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
                                    <ShieldCheck className="w-4 h-4 text-primary" /> Votação restrita com CPF de inscrito
                                </p>
                                <div className="pt-2">
                                    <span className="text-[11px] text-primary/80 font-mono bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                        {votingUrl}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Coluna Direita: Cronômetro Gigante, Métricas & Gráficos (7 Colunas) */}
                <section className="lg:col-span-7 flex flex-col justify-between gap-6">
                    
                    {/* Bloco 1: Cronômetro Regressivo Gigante */}
                    <div className={`p-8 md:p-10 rounded-[2.5rem] border shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
                        isUrgent 
                            ? "bg-red-950/40 border-red-500/50 shadow-red-500/10" 
                            : isDarkMode ? "bg-[#0E1C38] border-white/10" : "bg-white border-slate-200 shadow-xl"
                    }`}>
                        <div className="flex items-center gap-5">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border shadow-xl ${
                                isUrgent 
                                    ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" 
                                    : "bg-primary/15 text-primary border-primary/30"
                            }`}>
                                <Clock className="w-10 h-10" />
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-[0.25em] text-white/40 block">
                                    Tempo da Votação
                                </span>
                                <span className="text-lg font-bold text-white/80">
                                    {tese.status === 'Em votação' ? 'Contagem Regressiva' : tese.status === 'Encerrada' ? 'Tempo Esgotado' : 'Aguardando Início'}
                                </span>
                            </div>
                        </div>

                        {/* Display do Cronômetro */}
                        <div className="text-center md:text-right">
                            <motion.div 
                                animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className={`font-heading font-black text-6xl md:text-8xl tracking-tight leading-none ${
                                    isUrgent 
                                        ? "text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]" 
                                        : tese.status === 'Em votação'
                                            ? "text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                            : "text-white/60"
                                }`}
                            >
                                {formatTime(timeLeft)}
                            </motion.div>
                        </div>
                    </div>

                    {/* Bloco 2: Cards de Placar (SIM, NÃO, ABSTER) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* SIM Card */}
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

                        {/* NÃO Card */}
                        <div className={`p-6 rounded-3xl border transition-all ${
                            isDarkMode ? "bg-red-950/20 border-red-500/30" : "bg-red-50 border-red-200"
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4" /> NÃO
                                </span>
                                <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                                    {stats.percentual_nao}%
                                </span>
                            </div>
                            <div className="text-4xl md:text-5xl font-heading font-black text-red-400 tracking-tight">
                                {stats.total_nao}
                            </div>
                            <p className="text-[11px] text-white/40 font-medium mt-1">Rejeições</p>
                        </div>

                        {/* ABSTER Card */}
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

                    {/* Bloco 3: Gráfico em Tempo Real & Quórum */}
                    <div className={`p-8 rounded-[2.5rem] border shadow-2xl flex-1 flex flex-col justify-between ${
                        isDarkMode ? "bg-[#0E1C38] border-white/10" : "bg-white border-slate-200 shadow-xl"
                    }`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="font-heading font-black text-xl text-white">Resultado em Tempo Real</h3>
                                <p className="text-xs text-white/40 font-medium">Sincronização instantânea a cada voto recebido</p>
                            </div>

                            {/* Quórum de Participação */}
                            <div className="flex items-center gap-4 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5">
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Participação</span>
                                    <span className="text-base font-heading font-black text-primary">
                                        {stats.total_votantes} / {stats.total_inscritos || "-"} ({stats.percentual_participacao}%)
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Visualização do Gráfico */}
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

            {/* Rodapé Telão */}
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
