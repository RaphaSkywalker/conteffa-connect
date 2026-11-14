import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    Copy, Edit, ExternalLink, ListChecks, Play, Plus, QrCode, RotateCcw, Square, Swords, Trash2, Users, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Enquete, EnqueteInput, EnqueteResultados, EnqueteTipo } from "@/types/enquete";
import { getBaseAppUrl, getTotalInscritosCount } from "@/services/votacaoService";
import {
    deleteEnquete, encerrarEnquete, getEnqueteResultados, getEnquetePainelUrl, getEnquetes,
    getEnqueteVotarUrl, iniciarEnquete, saveEnquete, subscribeToEnquetesRealtime, zerarVotosEnquete,
} from "@/services/enqueteService";
import EnqueteResultadosChart from "@/components/enquete/EnqueteResultadosChart";

const emptyForm = (tipo: EnqueteTipo = "individual"): EnqueteInput => ({
    titulo: "",
    descricao: "",
    tipo,
    opcoes: tipo === "disputa" ? [{ titulo: "" }, { titulo: "" }] : [{ titulo: "" }],
});

const MIN_OPCOES: Record<EnqueteTipo, number> = { individual: 1, disputa: 2 };

export const PainelEnquetesAdmin = () => {
    const [enquetes, setEnquetes] = useState<Enquete[]>([]);
    const [resultados, setResultados] = useState<Record<number, EnqueteResultados>>({});
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState(false);

    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<EnqueteInput>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [qrEnquete, setQrEnquete] = useState<Enquete | null>(null);
    const totalInscritosRef = useRef<number | undefined>(undefined);

    const baseUrl = getBaseAppUrl();

    const load = async () => {
        try {
            if (totalInscritosRef.current === undefined) {
                totalInscritosRef.current = await getTotalInscritosCount();
            }
            const list = await getEnquetes();
            const res = await Promise.all(list.map((e) => getEnqueteResultados(e, totalInscritosRef.current)));
            setEnquetes(list);
            setResultados(Object.fromEntries(list.map((e, i) => [e.id, res[i]])));
            setDbError(false);
        } catch (err) {
            console.error("Erro ao carregar enquetes:", err);
            setDbError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        return subscribeToEnquetesRealtime(load);
    }, []);

    const run = async (action: () => Promise<void>, success: string) => {
        try {
            await action();
            toast.success(success);
            load();
        } catch (err) {
            console.error(err);
            toast.error("Não foi possível concluir a ação.");
        }
    };

    // ---------- Formulário ----------
    const openNew = () => {
        setForm(emptyForm());
        setFormOpen(true);
    };

    const openEdit = (e: Enquete) => {
        setForm({
            id: e.id,
            titulo: e.titulo,
            descricao: e.descricao || "",
            tipo: e.tipo,
            opcoes: e.opcoes.map((o) => ({ id: o.id, titulo: o.titulo })),
        });
        setFormOpen(true);
    };

    const changeTipo = (tipo: EnqueteTipo) => {
        setForm((f) => {
            const opcoes = [...f.opcoes];
            while (opcoes.length < MIN_OPCOES[tipo]) opcoes.push({ titulo: "" });
            return { ...f, tipo, opcoes };
        });
    };

    const updateOpcao = (idx: number, titulo: string) =>
        setForm((f) => ({ ...f, opcoes: f.opcoes.map((o, i) => (i === idx ? { ...o, titulo } : o)) }));

    const removeOpcao = (idx: number) =>
        setForm((f) => ({ ...f, opcoes: f.opcoes.filter((_, i) => i !== idx) }));

    const handleSave = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const preenchidas = form.opcoes.filter((o) => o.titulo.trim());
        if (!form.titulo.trim()) return toast.error("Informe o título da enquete.");
        if (preenchidas.length < MIN_OPCOES[form.tipo]) {
            return toast.error(form.tipo === "disputa" ? "A disputa precisa de pelo menos 2 opções." : "Cadastre pelo menos 1 item.");
        }

        setSaving(true);
        try {
            await saveEnquete(form);
            toast.success("Enquete salva com sucesso!");
            setFormOpen(false);
            load();
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar enquete. Verifique se o script supabase/enquetes.sql foi executado.");
        } finally {
            setSaving(false);
        }
    };

    // ---------- Ações ----------
    const handleIniciar = (e: Enquete) => run(() => iniciarEnquete(e.id), "Enquete INICIADA! Votação aberta.");

    const handleEncerrar = (e: Enquete) => {
        if (!confirm(`Encerrar a enquete "${e.titulo}"? Ninguém mais poderá votar.`)) return;
        run(() => encerrarEnquete(e.id), "Enquete ENCERRADA.");
    };

    const handleZerar = (e: Enquete) => {
        if (!confirm(`Apagar TODOS os votos da enquete "${e.titulo}" e voltar para "Aguardando"?`)) return;
        run(() => zerarVotosEnquete(e.id), "Votos zerados.");
    };

    const handleDelete = (e: Enquete) => {
        if (!confirm(`Excluir a enquete "${e.titulo}" e todos os seus votos?`)) return;
        run(() => deleteEnquete(e.id), "Enquete excluída.");
    };

    const copy = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#122442] rounded-3xl border border-white/5 shadow-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="font-heading font-black text-lg text-white flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-amber-400" />
                            <span>Enquetes de Votação</span>
                        </h4>
                        <p className="text-xs text-white/40 mt-1">
                            <strong className="text-white/70">Individual:</strong> cada item recebe SIM ou NÃO. {" "}
                            <strong className="text-white/70">Disputa:</strong> o inscrito escolhe uma única opção (ex.: SP × DF). Um voto por CPF inscrito.
                        </p>
                    </div>
                    <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-xl gap-2">
                        <Plus className="w-4 h-4" /> Nova Enquete
                    </Button>
                </div>

                {dbError && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        Não foi possível acessar as tabelas de enquete. Execute o script <code className="bg-black/40 px-1.5 py-0.5 rounded">supabase/enquetes.sql</code> no SQL Editor do Supabase.
                    </div>
                )}

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : enquetes.length === 0 ? (
                    <div className="py-16 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
                        <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
                        <p className="text-sm font-bold text-white">Nenhuma enquete cadastrada.</p>
                        <p className="text-xs mt-1">Clique em "Nova Enquete" para criar.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {enquetes.map((e) => {
                            const isOpen = e.status === "Em votação";
                            const isClosed = e.status === "Encerrada";
                            const res = resultados[e.id];
                            const temVotos = (res?.total_votantes ?? 0) > 0;

                            return (
                                <div key={e.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${e.tipo === "disputa" ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" : "bg-amber-500/15 text-amber-300 border-amber-500/30"}`}>
                                                    {e.tipo === "disputa" ? <Swords className="w-3 h-3" /> : <ListChecks className="w-3 h-3" />}
                                                    {e.tipo === "disputa" ? "Disputa" : "Individual SIM/NÃO"}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${isOpen ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : isClosed ? "bg-rose-500/20 text-rose-400" : "bg-white/10 text-white/50"}`}>
                                                    {e.status}
                                                </span>
                                                <span className="text-xs text-white/50 flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" /> {res?.total_votantes ?? 0} votantes ({res?.percentual_participacao ?? 0}%)
                                                </span>
                                            </div>
                                            <h5 className="text-lg font-bold text-white">{e.titulo}</h5>
                                            {e.descricao && <p className="text-xs text-white/50">{e.descricao}</p>}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            {isOpen ? (
                                                <Button size="sm" onClick={() => handleEncerrar(e)} className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs gap-1.5">
                                                    <Square className="w-3.5 h-3.5" /> Encerrar Votação
                                                </Button>
                                            ) : (
                                                <Button size="sm" onClick={() => handleIniciar(e)} disabled={e.opcoes.length === 0} className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5">
                                                    <Play className="w-3.5 h-3.5" /> {isClosed ? "Reabrir Votação" : "Iniciar Votação"}
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" onClick={() => setQrEnquete(e)} className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs gap-1.5">
                                                <QrCode className="w-3.5 h-3.5" /> QR Code
                                            </Button>
                                            <a
                                                href={getEnquetePainelUrl(baseUrl, e.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-9 px-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold flex items-center gap-1.5"
                                            >
                                                Telão <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            <IconBtn title="Editar" onClick={() => openEdit(e)} disabled={isOpen || temVotos}><Edit className="w-3.5 h-3.5" /></IconBtn>
                                            <IconBtn title="Zerar votos" onClick={() => handleZerar(e)} disabled={!temVotos}><RotateCcw className="w-3.5 h-3.5" /></IconBtn>
                                            <IconBtn title="Excluir" onClick={() => handleDelete(e)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                                        </div>
                                    </div>

                                    <div className="bg-[#0A162B] rounded-2xl border border-white/5 p-4">
                                        <EnqueteResultadosChart enquete={e} resultados={res ?? null} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: criar / editar */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="bg-[#0E1C38] border-white/10 text-white rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-black text-xl">{form.id ? "Editar Enquete" : "Nova Enquete"}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            {(["individual", "disputa"] as EnqueteTipo[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => changeTipo(t)}
                                    aria-pressed={form.tipo === t}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all ${form.tipo === t ? "border-amber-400 bg-amber-500/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}
                                >
                                    <span className="font-black text-sm flex items-center gap-2">
                                        {t === "disputa" ? <Swords className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
                                        {t === "disputa" ? "Disputa" : "Individual"}
                                    </span>
                                    <span className="text-[11px] text-white/50 block mt-1">
                                        {t === "disputa" ? "Escolher uma opção entre várias (ex.: SP × DF)" : "SIM ou NÃO em cada item"}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="enq-titulo">Título da enquete</Label>
                            <Input id="enq-titulo" value={form.titulo} onChange={(ev) => setForm({ ...form, titulo: ev.target.value })} placeholder={form.tipo === "disputa" ? "Ex.: Sede do próximo CONTEFFA" : "Ex.: Aprovação das moções"} className="bg-white/5 border-white/10 text-white" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="enq-desc">Descrição (opcional)</Label>
                            <Textarea id="enq-desc" value={form.descricao} onChange={(ev) => setForm({ ...form, descricao: ev.target.value })} rows={2} className="bg-white/5 border-white/10 text-white" />
                        </div>

                        <div className="space-y-2">
                            <Label>{form.tipo === "disputa" ? "Opções em disputa" : "Itens para aprovação (SIM / NÃO)"}</Label>
                            {form.opcoes.map((o, idx) => (
                                <div key={o.id ?? `new-${idx}`} className="flex items-center gap-2">
                                    <span className="w-7 h-7 shrink-0 rounded-lg bg-white/10 text-white/70 text-xs font-black flex items-center justify-center">{idx + 1}</span>
                                    <Input
                                        value={o.titulo}
                                        onChange={(ev) => updateOpcao(idx, ev.target.value)}
                                        placeholder={form.tipo === "disputa" ? (idx === 0 ? "Ex.: São Paulo" : "Ex.: Pará") : "Descrição do item"}
                                        aria-label={`Opção ${idx + 1}`}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeOpcao(idx)}
                                        disabled={form.opcoes.length <= MIN_OPCOES[form.tipo]}
                                        aria-label={`Remover opção ${idx + 1}`}
                                        className="w-9 h-9 shrink-0 rounded-lg text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, opcoes: [...form.opcoes, { titulo: "" }] })}
                                className="text-amber-400 hover:underline text-xs font-bold flex items-center gap-1 pt-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Adicionar {form.tipo === "disputa" ? "opção" : "item"}
                            </button>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} className="bg-white/5 hover:bg-white/10 text-white">Cancelar</Button>
                            <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white font-black">
                                {saving ? "Salvando..." : "Salvar Enquete"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: QR Code */}
            <Dialog open={!!qrEnquete} onOpenChange={(o) => !o && setQrEnquete(null)}>
                <DialogContent className="bg-[#0E1C38] border-white/10 text-white rounded-3xl max-w-md text-center">
                    {qrEnquete && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-heading font-black text-xl text-center">{qrEnquete.titulo}</DialogTitle>
                            </DialogHeader>
                            <div className="bg-white p-5 rounded-3xl mx-auto">
                                <QRCodeSVG value={getEnqueteVotarUrl(baseUrl, qrEnquete.id)} size={260} level="M" />
                            </div>
                            <p className="text-xs text-white/50 break-all font-mono">{getEnqueteVotarUrl(baseUrl, qrEnquete.id)}</p>
                            <Button onClick={() => copy(getEnqueteVotarUrl(baseUrl, qrEnquete.id))} className="bg-white/10 hover:bg-white/20 text-white gap-2">
                                <Copy className="w-4 h-4" /> Copiar link de votação
                            </Button>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

const IconBtn = ({ children, title, onClick, disabled, danger }: {
    children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) => (
    <button
        type="button"
        title={title}
        aria-label={title}
        onClick={onClick}
        disabled={disabled}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${danger ? "border-rose-500/40 text-rose-400 hover:bg-rose-500/20" : "border-white/10 text-white/70 hover:bg-white/10"}`}
    >
        {children}
    </button>
);

export default PainelEnquetesAdmin;

