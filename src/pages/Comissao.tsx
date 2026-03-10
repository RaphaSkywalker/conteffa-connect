import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { User, Instagram, Linkedin, Twitter, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Comissao = () => {
    const [comissao, setComissao] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComissao = async () => {
            try {
                setLoading(true);
                let allGuests: any[] = [];

                // 1. Tenta Supabase (Nuvem)
                try {
                    const { data, error } = await supabase.from('guests').select('*');
                    if (!error && data && data.length > 0) {
                        allGuests = data;
                    }
                } catch (e) {
                    console.warn("Supabase fetch failed", e);
                }

                // 2. Tenta API Local se Supabase retornar vazio ou falhar
                if (allGuests.length === 0) {
                    try {
                        const res = await fetch("http://localhost:3001/api/guests");
                        if (res.ok) {
                            const data = await res.json();
                            if (data && data.length > 0) allGuests = data;
                        }
                    } catch (e) {
                        console.warn("Local API fetch failed", e);
                    }
                }

                // 3. Tenta LocalStorage (Fallback sincronizado do navegador)
                if (allGuests.length === 0) {
                    const saved = localStorage.getItem("conteffa_convidados");
                    if (saved) {
                        try {
                            allGuests = JSON.parse(saved);
                        } catch (e) {
                            console.error("Error parsing localstorage data", e);
                        }
                    }
                }

                // Filtra apenas membros da categoria Comissão (aceita com ou sem acento)
                const membros = allGuests.filter((g: any) =>
                    g.category === "Comissão" || g.category === "Comissao"
                );
                setComissao(membros);
            } catch (err) {
                console.error("Failed to fetch comissao", err);
            } finally {
                setLoading(false);
            }
        };

        fetchComissao();

        // -- REALTIME SUBSCRIPTION --
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
                {/* Decorative background logo */}
                <div className="absolute top-20 right-0 w-[500px] h-[500px] opacity-[0.02] pointer-events-none -mr-32">
                    <img src="/bg-logo.png" alt="" className="w-full h-full object-contain" />
                </div>

                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <SectionTitle
                        label="EQUIPE"
                        title="Nossa Comissão"
                        subtitle="Conheça os profissionais dedicados à organização e sucesso do IX CONTEFFA 2026."
                        centered={true}
                    />

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : comissao.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-16">
                            {comissao.map((p, i) => (
                                <motion.div
                                    key={p.id || i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="group relative p-8 rounded-[3rem] bg-[#0B1B32] border border-white/5 shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-center flex flex-col items-center"
                                >
                                    {/* Decorative Corner */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-[4rem] group-hover:bg-primary/10 transition-colors" />

                                    <div className="relative z-10 w-full flex flex-col items-center">
                                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border-[4px] border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-700 overflow-hidden">
                                            {p.photo ? (
                                                <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-10 h-10 text-primary/50" />
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-heading font-black mb-1 text-white group-hover:text-primary transition-colors leading-tight">
                                            {p.name}
                                        </h3>

                                        <p className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] mb-4">
                                            {p.cargo}
                                        </p>

                                        {p.bio && (
                                            <p className="text-sm text-white/50 font-body leading-relaxed mb-6 line-clamp-3">
                                                {p.bio}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-center gap-4 mt-auto pt-6 border-t border-white/5 w-full">
                                            {p.instagram ? (
                                                <a href={p.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-white/5 text-white/40 hover:bg-pink-500 hover:text-white transition-all duration-300">
                                                    <Instagram className="w-4 h-4" />
                                                </a>
                                            ) : null}
                                            {p.linkedin ? (
                                                <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-white/5 text-white/40 hover:bg-blue-500 hover:text-white transition-all duration-300">
                                                    <Linkedin className="w-4 h-4" />
                                                </a>
                                            ) : null}
                                            {p.twitter ? (
                                                <a href={p.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-white/5 text-white/40 hover:bg-sky-500 hover:text-white transition-all duration-300">
                                                    <Twitter className="w-4 h-4" />
                                                </a>
                                            ) : null}
                                            {!p.instagram && !p.linkedin && !p.twitter && (
                                                <div className="flex items-center justify-center text-primary/60 text-[10px] font-black uppercase tracking-widest gap-2 group-hover:text-primary transition-colors cursor-pointer">
                                                    Membro da Comissão <ArrowRight className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 rounded-[3rem] p-20 text-center border-2 border-dashed border-white/10 mt-16">
                            <User className="w-20 h-20 text-white/10 mx-auto mb-6" />
                            <h3 className="text-2xl font-heading font-black text-white mb-2">Aguardando definição</h3>
                            <p className="text-white/40 max-w-md mx-auto">A lista da comissão organizadora está sendo atualizada e será publicada em breve.</p>
                        </div>
                    )}
                </div>
            </section>
        </PageLayout>
    );
};

export default Comissao;
