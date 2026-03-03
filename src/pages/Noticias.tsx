import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Newspaper, Image as ImageIcon, Instagram, Megaphone, User, ChevronLeft, ChevronRight, Heart, Share2, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Noticias = () => {
  const [noticias, setNoticias] = useState<any[]>([]);
  const [instaConfig, setInstaConfig] = useState({ handle: "@anteffa", url: "#", photos: [] as string[] });
  const [sidebarTab, setSidebarTab] = useState<'recentes' | 'populares' | 'tags'>('recentes');
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [viewedPosts, setViewedPosts] = useState<number[]>([]);
  const [adImage, setAdImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: newsData } = await supabase.from('news').select('*').order('created_at', { ascending: false });
        if (newsData) {
          setNoticias(newsData);

          // Auto-increment views for visible news (just for demo/initial load)
          newsData.forEach(async (n: any) => {
            if (!viewedPosts.includes(n.id)) {
              await supabase.from('news').update({ views: (n.views || 0) + 1 }).eq('id', n.id);
              setViewedPosts(prev => [...prev, n.id]);
            }
          });
        }

        const { data: instaConfigData } = await supabase.from('config').select('value').eq('key', 'instagram').maybeSingle();
        if (instaConfigData && instaConfigData.value) {
          const config = typeof instaConfigData.value === 'string'
            ? JSON.parse(instaConfigData.value)
            : instaConfigData.value;

          setInstaConfig(prev => ({ ...prev, ...config }));
        }
        const { data: adData } = await supabase.from('config').select('value').eq('key', 'divulgacao').maybeSingle();
        if (adData && adData.value) {
          setAdImage(adData.value);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };

    fetchAllData();

    const channel = supabase
      .channel('news_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getNoticiasByMonth = (monthIndex: number, monthName: string) => {
    return noticias.filter(n => {
      if (!n.date) return false;
      const dateStr = n.date.toLowerCase();
      const monthNumber = (monthIndex + 1).toString().padStart(2, '0');
      return dateStr.includes(monthName.toLowerCase()) || dateStr.includes(`/${monthNumber}/`) || dateStr.startsWith(`${monthNumber}/`);
    });
  }

  const toggleMonth = (monthName: string) => {
    setExpandedMonths(prev =>
      prev.includes(monthName) ? prev.filter(m => m !== monthName) : [...prev, monthName]
    );
  };

  const handleLike = async (id: number, currentLikes: number) => {
    if (likedPosts.includes(id)) {
      toast.info("Você já curtiu esta matéria!");
      return;
    }

    try {
      const { error } = await supabase.from('news').update({ likes: (currentLikes || 0) + 1 }).eq('id', id);
      if (!error) {
        setNoticias(prev => prev.map(n => n.id === id ? { ...n, likes: (n.likes || 0) + 1 } : n));
        setLikedPosts(prev => [...prev, id]);
        toast.success("Obrigado pelo seu Like!", { icon: "❤️" });
      }
    } catch (err) {
      console.error("Erro ao curtir:", err);
    }
  };

  const handleShare = (title: string) => {
    if (navigator.share) {
      navigator.share({
        title: title,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link da notícia copiado!");
    }
  };

  const mesesFull = [
    { name: "Janeiro", index: 0 }, { name: "Fevereiro", index: 1 }, { name: "Março", index: 2 },
    { name: "Abril", index: 3 }, { name: "Maio", index: 4 }, { name: "Junho", index: 5 },
    { name: "Julho", index: 6 }, { name: "Agosto", index: 7 }, { name: "Setembro", index: 8 },
    { name: "Outubro", index: 9 }, { name: "Novembro", index: 10 }, { name: "Dezembro", index: 11 },
  ].map(m => ({
    ...m,
    count: getNoticiasByMonth(m.index, m.name).length,
    noticiasDoc: getNoticiasByMonth(m.index, m.name)
  }));

  const meses = mesesFull.filter(m => m.count > 0);
  const allTags = Array.from(new Set(noticias.flatMap(n => n.tags ? n.tags.split(',').map((t: string) => t.trim()) : []))).filter(Boolean);
  const populares = [...noticias].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <PageLayout>
      <PageBanner title="NOTÍCIAS" />
      <section className="section-padding bg-slate-50/50">
        <div className="container mx-auto">
          <SectionTitle
            title="Canal de Notícias"
            subtitle="Fique por dentro de tudo o que acontece no maior congresso de fiscalização agropecuária do Brasil."
            centered={true}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
            <div className="lg:col-span-8 space-y-10">
              {noticias.length > 0 ? (
                noticias.map((n, i) => (
                  <motion.article
                    key={i}
                    id={`noticia-${i}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 flex flex-col h-auto"
                  >
                    <div className="w-full relative overflow-hidden bg-slate-100 h-64">
                      {n.photo ? (
                        <img src={n.photo} alt={n.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute top-6 left-6">
                        <span className="bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                          Destaque
                        </span>
                      </div>
                    </div>

                    <div className="p-10 flex flex-col">
                      <div className="flex items-center gap-4 text-[11px] font-bold text-primary uppercase tracking-widest mb-4">
                        <div className="flex items-center gap-1.5 opacity-80">
                          <User className="w-3.5 h-3.5" /> Assessoria Conteffa
                        </div>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <div className="flex items-center gap-1.5 opacity-80">
                          <Calendar className="w-3.5 h-3.5" /> {n.date}
                        </div>
                        {n.tags && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                              #{n.tags.split(',')[0]}
                            </div>
                          </>
                        )}
                      </div>

                      <h3 className="text-2xl md:text-3xl font-heading font-black mb-5 text-slate-900 group-hover:text-primary transition-colors leading-tight">
                        {n.title}
                      </h3>

                      <p className="text-muted-foreground font-body text-base leading-relaxed mb-10 whitespace-pre-line">
                        {n.summary}
                      </p>

                      <div className="flex items-center justify-between py-6 border-t border-slate-100 mb-2">
                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => handleLike(n.id, n.likes)}
                            className="flex items-center gap-2 group/like cursor-pointer transition-all active:scale-95"
                          >
                            <Heart className={`w-5 h-5 transition-colors ${likedPosts.includes(n.id) ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover/like:text-red-500'}`} />
                            <span className="text-sm font-bold text-slate-500">{(n.likes || 0)} Curtidas</span>
                          </button>

                          <button
                            onClick={() => handleShare(n.title)}
                            className="flex items-center gap-2 group/share cursor-pointer transition-all active:scale-95"
                          >
                            <Share2 className="w-5 h-5 text-slate-400 group-hover/share:text-primary transition-colors" />
                            <span className="text-sm font-bold text-slate-500">Compartilhar</span>
                          </button>
                        </div>

                        <div className="hidden md:flex items-center gap-2 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                          <ThumbsUp className="w-3 h-3" /> Relevância Alta
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-4 bg-primary rounded-full" />
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Últimas Notícias</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {noticias.slice(0, 2).map((latest, idx) => (
                            <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group/mini">
                              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                                {latest.photo ? (
                                  <img src={latest.photo} alt={latest.title} className="w-full h-full object-cover" />
                                ) : (
                                  <Newspaper className="w-6 h-6 text-slate-400 m-auto mt-5" />
                                )}
                              </div>
                              <div className="flex flex-col justify-center">
                                <span className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1">{latest.date}</span>
                                <h5 className="text-xs font-bold text-slate-700 line-clamp-2 leading-snug group-hover/mini:text-primary transition-colors">
                                  {latest.title}
                                </h5>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Newspaper className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">Nenhuma notícia encontrada</h3>
                </div>
              )}
            </div>

            <aside className="lg:col-span-4 space-y-10">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-l-4 border-pink-500 pl-4">
                  <Instagram className="w-6 h-6 text-pink-500" />
                  <div>
                    <h4 className="font-heading font-black text-slate-900 leading-none">Seguidores</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Siga {instaConfig.handle || "@anteffa"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-xl">
                  {instaConfig.photos && instaConfig.photos.length > 0 ? (
                    instaConfig.photos.map((photo, i) => (
                      <div key={i} className="aspect-square bg-slate-100 relative group cursor-pointer overflow-hidden">
                        <img src={photo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    ))
                  ) : (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="aspect-square bg-slate-100 relative group cursor-pointer overflow-hidden">
                        <img src={`https://images.unsplash.com/photo-${i}?w=200&h=200&auto=format&fit=crop`} alt="" className="w-full h-full object-cover opacity-80" />
                      </div>
                    ))
                  )}
                </div>
                <Button className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl shadow-lg">
                  Ver Perfil Completo
                </Button>
              </div>

              <div className="bg-[#0B1B32] rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6 border-l-4 border-primary pl-4">
                    <Megaphone className="w-6 h-6 text-primary" />
                    <h4 className="font-heading font-black leading-none">Divulgação</h4>
                  </div>
                  <div className="aspect-[4/5] bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-6 group-hover:bg-white/10 transition-colors overflow-hidden">
                    {adImage ? (
                      <img src={adImage} alt="Propaganda" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-white/20" />
                    )}
                  </div>
                  {!adImage && <p className="text-white/60 text-sm font-body leading-relaxed mb-6">Seja um patrocinador do IX CONTEFFA e dê visibilidade à sua marca.</p>}
                  <Button className="w-full bg-white text-[#0B1B32] hover:bg-slate-200 rounded-xl font-bold">SAIBA MAIS</Button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
                <div className="bg-primary px-8 py-5">
                  <h4 className="font-heading font-black text-white text-base uppercase tracking-[0.2em]">ARQUIVO</h4>
                </div>

                <div className="flex bg-slate-50/80 border-b border-slate-100">
                  <button onClick={() => setSidebarTab('recentes')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'recentes' ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}>Recentes</button>
                  <button onClick={() => setSidebarTab('populares')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-l border-slate-200/60 ${sidebarTab === 'populares' ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}>Populares</button>
                  <button onClick={() => setSidebarTab('tags')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-l border-slate-200/60 ${sidebarTab === 'tags' ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}>Tags</button>
                </div>

                <div className="p-0">
                  {sidebarTab === 'recentes' && (
                    <div className="divide-y divide-slate-100">
                      {meses.map((mes, idx) => (
                        <div key={idx} className="flex flex-col">
                          <div onClick={() => toggleMonth(mes.name)} className={`flex items-center justify-between px-8 py-4 hover:bg-slate-50 cursor-pointer ${expandedMonths.includes(mes.name) ? 'bg-slate-50' : ''}`}>
                            <span className={`text-[11px] font-black uppercase tracking-widest ${expandedMonths.includes(mes.name) ? 'text-primary' : 'text-slate-900'}`}>{mes.name} 2026</span>
                            <span className="text-[11px] font-black text-slate-400">({mes.count})</span>
                          </div>
                          <AnimatePresence>
                            {expandedMonths.includes(mes.name) && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/50 px-8 pb-5 overflow-hidden">
                                <ul className="space-y-3 pt-3 border-t border-slate-200/50">
                                  {mes.noticiasDoc.map((doc: any, dIdx: number) => (
                                    <li key={dIdx}>
                                      <a href={`#noticia-${noticias.findIndex(n => n.title === doc.title)}`} className="text-[11px] font-bold text-slate-500 hover:text-primary flex items-start gap-3 leading-snug">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                        {doc.title}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}

                  {sidebarTab === 'populares' && (
                    <div className="p-6 space-y-4">
                      {populares.map((pop, idx) => (
                        <div key={idx} className="flex gap-4 group cursor-pointer">
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                            {pop.photo ? <img src={pop.photo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <Newspaper className="w-6 h-6 text-slate-300 m-auto mt-4" />}
                          </div>
                          <div className="flex flex-col justify-center">
                            <h5 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-primary uppercase">{pop.title}</h5>
                            <span className="text-[9px] font-black text-primary/50 tracking-widest mt-1">{pop.views || 0} visualizações</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sidebarTab === 'tags' && (
                    <div className="p-8">
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-slate-100 hover:bg-primary hover:text-white text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-lg cursor-pointer transition-all">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Noticias;
