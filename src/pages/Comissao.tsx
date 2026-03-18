import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { User, Instagram, Linkedin } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Componente para o Card do Membro no Organograma
const MemberCard = ({ member, small = false }: { member: any, small?: boolean }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className={`group relative ${small ? 'p-4 rounded-[2rem] w-full max-w-[280px]' : 'p-8 rounded-[3rem] w-full max-w-[380px]'} bg-[#0B1B32] border border-white/5 shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden text-center flex flex-col items-center justify-center`}
    >
        <div className={`${small ? 'w-16 h-16 border-[3px]' : 'w-24 h-24 border-[5px]'} rounded-full bg-white/5 flex items-center justify-center mb-4 border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-700 overflow-hidden shrink-0`}>
            {member.photo ? (
                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
            ) : (
                <User className={`${small ? 'w-6 h-6' : 'w-12 h-12'} text-primary/50`} />
            )}
        </div>

        <h3 className={`${small ? 'text-lg' : 'text-2xl'} font-heading font-black mb-1 text-white group-hover:text-primary transition-colors leading-tight`}>
            {member.name}
        </h3>

        <p className={`${small ? 'text-[10px]' : 'text-[12px]'} font-bold text-primary uppercase tracking-[0.2em] mb-4`}>
            {member.cargo}
        </p>

        <div className="flex items-center justify-center gap-4 w-full">
            {member.instagram && (
                <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 text-white/40 hover:bg-pink-500 hover:text-white transition-all">
                    <Instagram className="w-5 h-5" />
                </a>
            )}
            {member.linkedin && (
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 text-white/40 hover:bg-blue-500 hover:text-white transition-all">
                    <Linkedin className="w-5 h-5" />
                </a>
            )}
        </div>
    </motion.div>
);

const Comissao = () => {
    const [comissao, setComissao] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComissao = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase.from('guests').select('*');
                
                if (error) throw error;

                // Filtra apenas membros da categoria Comissão e ordena alfabeticamente
                const membros = (data || []).filter((g: any) =>
                    g.category === "Comissão" || g.category === "Comissao"
                ).sort((a: any, b: any) => a.name.localeCompare(b.name));
                setComissao(membros);
            } catch (err) {
                console.error("Failed to fetch comissao", err);
            } finally {
                setLoading(false);
            }
        };

        fetchComissao();

        const channel = supabase
            .channel('comissao_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'guests' },
                () => fetchComissao()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <PageLayout>
            <PageBanner title="COMISSÃO ORGANIZADORA" />
            <section className="section-padding min-h-[60vh] bg-background relative overflow-hidden">
                {/* Background Decorativo */}
                <div className="absolute top-20 right-0 w-[500px] h-[500px] opacity-[0.02] pointer-events-none -mr-32">
                    <img src="/bg-logo.png" alt="" className="w-full h-full object-contain" />
                </div>

                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <SectionTitle 
                        title="Nossa Comissão" 
                        subtitle="Organograma da Coordenação"
                        className="mb-4 md:mb-4"
                        label="EQUIPE"
                    />

                    <div className="relative">
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : comissao.length > 0 ? (
                            <div className="mt-10 flex flex-col items-center">
                                {/* Presidente - Direção Geral */}
                                {comissao.find(p => p.cargo === "Presidente ANTEFFA") && (() => {
                                    const p = comissao.find(p => p.cargo === "Presidente ANTEFFA");
                                    return (
                                        <div className="mb-16 flex flex-col items-center relative">
                                            <div className="bg-primary/5 px-8 py-2 rounded-full mb-8 border border-primary/10">
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Direção Geral</span>
                                            </div>
                                            <MemberCard member={p} />
                                            {/* Linha para baixo */}
                                            <div className="absolute top-full left-1/2 w-0.5 h-16 bg-gradient-to-b from-primary/50 to-primary/10 -translate-x-1/2" />
                                        </div>
                                    );
                                })()}

                                {/* Linha Horizontal de Distribuição */}
                                <div className="w-full max-w-6xl h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent relative mb-12">
                                    <div className="absolute top-0 left-0 w-px h-8 bg-primary/20" />
                                    <div className="absolute top-0 left-1/4 w-px h-8 bg-primary/20" />
                                    <div className="absolute top-0 left-2/4 w-px h-8 bg-primary/20" />
                                    <div className="absolute top-0 left-3/4 w-px h-8 bg-primary/20" />
                                    <div className="absolute top-0 left-full w-px h-8 bg-primary/20" />
                                </div>

                                {/* Grupos de Coordenação */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 w-full">
                                    {[
                                        { name: "Temática", color: "bg-blue-500" },
                                        { name: "Finanças e Logística", color: "bg-green-500" },
                                        { name: "Comunicação e Marketing", color: "bg-pink-500" },
                                        { name: "Cultural", color: "bg-purple-500" }
                                    ].map((grupo) => {
                                        const members = comissao.filter(p => (p.bio || "").includes(grupo.name) && p.cargo !== "Presidente ANTEFFA");
                                        return (
                                            <div key={grupo.name} className="flex flex-col items-center">
                                                <div className={`${grupo.color}/10 border border-${grupo.color}/20 px-6 py-3 rounded-2xl mb-8 w-full text-center shadow-sm`}>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">{grupo.name}</h4>
                                                </div>
                                                
                                                <div className="space-y-6 w-full flex flex-col items-center">
                                                    {members.map((m, mIdx) => (
                                                        <MemberCard key={m.id || mIdx} member={m} small />
                                                    ))}
                                                    {members.length === 0 && (
                                                        <div className="py-10 opacity-20 text-[10px] font-black uppercase tracking-widest text-slate-400">Pendente</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Membros Adicionais */}
                                {comissao.filter(p => !["Temática", "Finanças e Logística", "Comunicação e Marketing", "Cultural"].some(g => (p.bio || "").includes(g)) && p.cargo !== "Presidente ANTEFFA").length > 0 && (
                                    <div className="mt-24 w-full">
                                        <div className="flex items-center gap-4 mb-10 overflow-hidden">
                                            <div className="h-px bg-slate-200 flex-1" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Outros Membros</span>
                                            <div className="h-px bg-slate-200 flex-1" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                            {comissao.filter(p => !["Temática", "Finanças e Logística", "Comunicação e Marketing", "Cultural"].some(g => (p.bio || "").includes(g)) && p.cargo !== "Presidente ANTEFFA").map((p, i) => (
                                                <MemberCard key={p.id || i} member={p} small />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white/5 rounded-[3rem] p-20 text-center border-2 border-dashed border-white/10 mt-16">
                                <User className="w-20 h-20 text-white/10 mx-auto mb-6" />
                                <h3 className="text-2xl font-heading font-black text-white mb-2">Aguardando definição</h3>
                                <p className="text-white/40 max-w-md mx-auto">A lista da comissão organizadora está sendo atualizada e será publicada em breve.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </PageLayout>
    );
};

export default Comissao;
