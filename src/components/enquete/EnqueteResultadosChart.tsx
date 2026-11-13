import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Enquete, EnqueteResultados } from "@/types/enquete";

const DISPUTA_COLORS = ["#22d3ee", "#f59e0b", "#a3e635", "#f472b6", "#60a5fa", "#fb923c"];
const SIM_COLOR = "#10b981";
const NAO_COLOR = "#f43f5e";

interface Props {
    enquete: Enquete;
    resultados: EnqueteResultados | null;
    /** Telão usa fontes maiores */
    large?: boolean;
}

export const EnqueteResultadosChart = ({ enquete, resultados, large = false }: Props) => {
    const opcoes = resultados?.opcoes ?? [];
    const tick = { fill: "#cbd5e1", fontSize: large ? 16 : 11, fontWeight: 700 };
    const height = large ? Math.max(320, opcoes.length * 110) : Math.max(180, opcoes.length * 60);

    if (opcoes.length === 0) {
        return <p className="text-center text-white/40 text-sm py-8">Nenhuma opção cadastrada.</p>;
    }

    if (enquete.tipo === "disputa") {
        const data = opcoes.map((o) => ({ name: o.titulo, votos: o.total, pct: o.percentual }));
        const lider = Math.max(...data.map((d) => d.votos));

        return (
            <div className="space-y-4">
                <ResponsiveContainer width="100%" height={height}>
                    <BarChart data={data} layout="vertical" margin={{ left: 10, right: 60 }}>
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={tick} width={large ? 180 : 100} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#0E1C38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                        <Bar dataKey="votos" radius={[0, 12, 12, 0]} isAnimationActive>
                            {data.map((d, i) => (
                                <Cell key={d.name} fill={DISPUTA_COLORS[i % DISPUTA_COLORS.length]} opacity={lider > 0 && d.votos < lider ? 0.7 : 1} />
                            ))}
                            <LabelList dataKey="votos" position="right" fill="#fff" fontSize={large ? 22 : 13} fontWeight={900} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                <div className={`grid gap-3 ${data.length > 2 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"}`}>
                    {data.map((d, i) => (
                        <div key={d.name} className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                            <span className="block text-xs font-bold uppercase tracking-wider truncate" style={{ color: DISPUTA_COLORS[i % DISPUTA_COLORS.length] }}>{d.name}</span>
                            <span className={`block font-heading font-black text-white ${large ? "text-5xl" : "text-2xl"}`}>{d.pct}%</span>
                            <span className="text-xs text-white/50">{d.votos} votos</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const data = opcoes.map((o) => ({ name: o.titulo, SIM: o.sim, NAO: o.nao, psim: o.percentual_sim, pnao: o.percentual_nao }));

    return (
        <div className="space-y-4">
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} layout="vertical" margin={{ left: 10, right: 50 }} barGap={4}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={tick} width={large ? 220 : 110} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#0E1C38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v: number, k: string) => [v, k === "NAO" ? "NÃO" : k]} />
                    <Bar dataKey="SIM" fill={SIM_COLOR} radius={[0, 10, 10, 0]}>
                        <LabelList dataKey="SIM" position="right" fill="#fff" fontSize={large ? 18 : 12} fontWeight={900} />
                    </Bar>
                    <Bar dataKey="NAO" fill={NAO_COLOR} radius={[0, 10, 10, 0]}>
                        <LabelList dataKey="NAO" position="right" fill="#fff" fontSize={large ? 18 : 12} fontWeight={900} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="space-y-2">
                {data.map((d) => (
                    <div key={d.name} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-4">
                        <span className={`font-bold text-white truncate ${large ? "text-lg" : "text-xs"}`}>{d.name}</span>
                        <div className={`flex items-center gap-4 shrink-0 font-black ${large ? "text-2xl" : "text-sm"}`}>
                            <span className="text-emerald-400">SIM {d.psim}%</span>
                            <span className="text-rose-400">NÃO {d.pnao}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EnqueteResultadosChart;

