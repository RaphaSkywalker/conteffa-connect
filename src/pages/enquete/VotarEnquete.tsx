import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, ShieldCheck, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Enquete, EnqueteVotoTipo } from "@/types/enquete";
import { getClientIP } from "@/services/votacaoService";
import {
    getEnqueteById,
    getOpcoesVotadasPorIp,
    submitVotosEnquete,
    subscribeToEnquetesRealtime,
} from "@/services/enqueteService";

type Step = "voto" | "sucesso";

const VotarEnquete = () => {
    const { id } = useParams<{ id: string }>();
    const [enquete, setEnquete] = useState<Enquete | null>(null);
    const [loading, setLoading] = useState(true);
    const [clientIp, setClientIp] = useState<string>("");
    const [alreadyVotedIp, setAlreadyVotedIp] = useState(false);

    const [step, setStep] = useState<Step>("voto");
    const [jaVotadas, setJaVotadas] = useState<number[]>([]);
    const [escolhasIndividual, setEscolhasIndividual] = useState<Record<number, EnqueteVotoTipo>>({});
    const [escolhaDisputa, setEscolhaDisputa] = useState<number | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        if (!id) return;
        try {
            const [data, ip] = await Promise.all([
                getEnqueteById(id),
                getClientIP(),
            ]);
            setEnquete(data);
            setClientIp(ip);

            if (data && ip) {
                const votadas = await getOpcoesVotadasPorIp(data.id, ip);
                setJaVotadas(votadas);
                const isDisp = data.tipo === "disputa";
                const jaVotouTudo = isDisp
                    ? votadas.length > 0
                    : data.opcoes.length > 0 && votadas.length >= data.opcoes.length;
                setAlreadyVotedIp(jaVotouTudo);
            }
        } catch (err) {
            console.error("Erro ao carregar enquete:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        return subscribeToEnquetesRealtime(load);
    }, [id]);

    const status = enquete?.status ?? "Aguardando";
    const isDisputa = enquete?.tipo === "disputa";
    const opcoesPendentes = enquete?.opcoes.filter((o) => !jaVotadas.includes(o.id)) ?? [];

    const canSubmit = status === "Em votação" && (
        isDisputa
            ? escolhaDisputa !== null
            : opcoesPendentes.length > 0 && opcoesPendentes.every((o) => escolhasIndividual[o.id])
    );

    const handleConfirm = async () => {
        if (!enquete) return;
        setSubmitting(true);
        try {
            const ip = clientIp || await getClientIP();
            const votos = isDisputa
                ? [{ opcao_id: escolhaDisputa!, voto: null }]
                : opcoesPendentes.map((o) => ({ opcao_id: o.id, voto: escolhasIndividual[o.id] }));

            const res = await submitVotosEnquete({
                enqueteId: enquete.id,
                ip,
                votos,
            });

            setConfirmOpen(false);
            if (res.success) {
                setStep("sucesso");
                toast.success("Voto computado com sucesso!");
            } else {
                toast.error(res.message);
                if (res.message.includes("já votou") || res.message.includes("já registrou")) {
                    setAlreadyVotedIp(true);
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070F1E] flex flex-col items-center justify-center text-white p-6">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-white/50">Carregando Enquete...</p>
            </div>
        );
    }

    if (!enquete) {
        return (
            <div className="min-h-screen bg-[#070F1E] flex flex-col items-center justify-center text-white p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
                <h2 className="text-2xl font-heading font-black mb-2">Enquete não encontrada</h2>
                <p className="text-white/50 text-sm">A enquete solicitada não existe ou foi removida.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070F1E] text-slate-100 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            <header className="px-6 py-5 bg-[#0A162B]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 flex items-center justify-between">
                <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block">
                        IX CONTEFFA • ENQUETE
                    </span>
                    <h1 className="text-sm font-heading font-black text-white">
                        {isDisputa ? "Votação de Disputa" : "Votação SIM ou NÃO"}
                    </h1>
                </div>
                <StatusBadge status={status} />
            </header>

            <main className="flex-1 p-5 md:p-8 max-w-xl w-full mx-auto flex flex-col justify-center relative z-10">
                <AnimatePresence mode="wait">
                    {alreadyVotedIp && step !== "sucesso" ? (
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
                                    Já identificamos um voto registrado a partir do seu endereço IP ({clientIp}) para esta enquete. Não é permitido votar mais de uma vez.
                                </p>
                            </div>
                        </motion.div>
                    ) : step === "voto" ? (
                        <motion.div key="voto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
                            <div className="bg-[#0E1C38] p-6 rounded-3xl border border-white/10 shadow-xl space-y-2 text-center">
                                <h2 className="text-xl font-heading font-black text-white">{enquete.titulo}</h2>
                                {enquete.descricao && (
                                    <p className="text-xs text-white/60 leading-relaxed">{enquete.descricao}</p>
                                )}
                                <p className="text-xs text-emerald-400 font-bold pt-1">
                                    {isDisputa ? "Escolha apenas UMA opção." : "Vote SIM ou NÃO em cada item."}
                                </p>
                            </div>

                            {status !== "Em votação" && (
                                <div className={`p-5 rounded-2xl border flex items-start gap-3.5 ${status === "Encerrada" ? "bg-rose-500/10 border-rose-500/20 text-rose-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"}`}>
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p className="text-xs leading-relaxed">
                                        {status === "Encerrada" ? "Esta enquete foi encerrada e não aceita mais votos." : "Aguarde a coordenação iniciar a enquete."}
                                    </p>
                                </div>
                            )}

                            {isDisputa ? (
                                <div className="grid gap-3">
                                    {enquete.opcoes.map((o) => {
                                        const selected = escolhaDisputa === o.id;
                                        return (
                                            <button
                                                key={o.id}
                                                type="button"
                                                disabled={status !== "Em votação"}
                                                onClick={() => setEscolhaDisputa(o.id)}
                                                aria-pressed={selected}
                                                className={`p-6 rounded-3xl border-2 text-left flex items-center justify-between transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selected ? "border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-500/20" : "border-white/10 bg-[#0E1C38] hover:border-white/30"}`}
                                            >
                                                <span className="text-xl font-heading font-black text-white">{o.titulo}</span>
                                                {selected ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <span className="w-7 h-7 rounded-full border-2 border-white/20" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {opcoesPendentes.map((o, idx) => (
                                        <div key={o.id} className="bg-[#0E1C38] p-5 rounded-3xl border border-white/10 space-y-4">
                                            <div className="flex items-start gap-3">
                                                <span className="w-7 h-7 shrink-0 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">{idx + 1}</span>
                                                <h3 className="font-bold text-white leading-snug">{o.titulo}</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {(["SIM", "NAO"] as EnqueteVotoTipo[]).map((v) => {
                                                    const selected = escolhasIndividual[o.id] === v;
                                                    const isSim = v === "SIM";
                                                    return (
                                                        <button
                                                            key={v}
                                                            type="button"
                                                            disabled={status !== "Em votação"}
                                                            aria-pressed={selected}
                                                            onClick={() => setEscolhasIndividual((prev) => ({ ...prev, [o.id]: v }))}
                                                            className={`h-14 rounded-2xl border-2 font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                                                selected
                                                                    ? isSim ? "bg-emerald-600 border-emerald-400 text-white" : "bg-rose-600 border-rose-400 text-white"
                                                                    : "bg-white/5 border-white/10 text-white/70 hover:border-white/30"
                                                            }`}
                                                        >
                                                            {isSim ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                            {isSim ? "SIM" : "NÃO"}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button
                                disabled={!canSubmit}
                                onClick={() => setConfirmOpen(true)}
                                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest disabled:opacity-40"
                            >
                                Confirmar voto
                            </Button>

                            <p className="text-[10px] text-white/40 text-center flex items-center justify-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Voto único validado por endereço IP
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 bg-[#0E1C38] p-10 rounded-[2.5rem] border border-emerald-500/30">
                            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-heading font-black text-white">Voto registrado!</h2>
                            <p className="text-sm text-white/60">Obrigado por participar. Acompanhe o resultado no telão.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="bg-[#0E1C38] border-white/10 text-white rounded-3xl max-w-md">
                    <DialogTitle className="font-heading font-black text-xl">Confirmar seu voto?</DialogTitle>
                    <DialogDescription className="text-white/60 text-sm">Após confirmar, o voto não poderá ser alterado.</DialogDescription>
                    <div className="space-y-2 my-2">
                        {isDisputa ? (
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                                <Trophy className="w-5 h-5 text-emerald-400" />
                                <span className="font-black">{enquete.opcoes.find((o) => o.id === escolhaDisputa)?.titulo}</span>
                            </div>
                        ) : (
                            opcoesPendentes.map((o) => (
                                <div key={o.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-sm">
                                    <span className="truncate">{o.titulo}</span>
                                    <span className={`font-black ${escolhasIndividual[o.id] === "SIM" ? "text-emerald-400" : "text-rose-400"}`}>
                                        {escolhasIndividual[o.id] === "SIM" ? "SIM" : "NÃO"}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="ghost" onClick={() => setConfirmOpen(false)} className="h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white">Voltar</Button>
                        <Button onClick={handleConfirm} disabled={submitting} className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black">
                            {submitting ? "Enviando..." : "Confirmar"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { dot: string; text: string; label: string }> = {
        "Em votação": { dot: "bg-emerald-500 animate-pulse", text: "text-emerald-400", label: "Aberta" },
        Encerrada: { dot: "bg-rose-500", text: "text-rose-400", label: "Encerrada" },
        Aguardando: { dot: "bg-amber-500", text: "text-amber-400", label: "Aguardando" },
    };
    const s = map[status] ?? map.Aguardando;
    return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className={s.text}>{s.label}</span>
        </div>
    );
};

export default VotarEnquete;
