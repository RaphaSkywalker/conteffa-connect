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
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const [sidebarPage, setSidebarPage] = useState(0);
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
          // Carregar stats locais (likes/views) como fallback
          const localStats = JSON.parse(localStorage.getItem('news_stats') || '{}');

          const enrichedNews = newsData.map((n: any) => ({
            ...n,
            likes: n.likes || 0,
            views: n.views || 0,
            shares: n.shares || 0
          }));

          setNoticias(enrichedNews);

          // Sincronizar posts já curtidos para evitar duplicidade após Refresh
          const likedStats = JSON.parse(localStorage.getItem('news_liked_status') || '[]');
          setLikedPosts(likedStats);

          // Auto-increment views
          enrichedNews.forEach(async (n: any) => {
            if (!viewedPosts.includes(n.id)) {
              // Atualizar local
              const stats = JSON.parse(localStorage.getItem('news_stats') || '{}');
              if (!stats[n.id]) stats[n.id] = { likes: 0, views: 0 };
              stats[n.id].views = (stats[n.id].views || 0) + 1;
              localStorage.setItem('news_stats', JSON.stringify(stats));

              // Tentar atualizar remoto (falha silenciosamente se a coluna não existir)
              try {
                await supabase.from('news').update({ views: (n.views || 0) + 1 }).eq('id', n.id);
              } catch (e) { }

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

  const handleLike = async (id: number | string, currentLikes: number) => {
    if (likedPosts.includes(id as any)) {
      toast.info("Você já curtiu esta matéria!");
      return;
    }

    try {
      // 1. Atualizar LocalStorage imediatamente para feedback instantâneo
      const stats = JSON.parse(localStorage.getItem('news_stats') || '{}');
      if (!stats[id]) stats[id] = { likes: 0, views: 0 };
      stats[id].likes = (stats[id].likes || 0) + 1;
      localStorage.setItem('news_stats', JSON.stringify(stats));

      // 2. Atualizar estado UI
      setNoticias(prev => prev.map(n => n.id === id ? { ...n, likes: (n.likes || 0) + 1 } : n));

      const newLikedStatus = [...likedPosts, id as any];
      setLikedPosts(newLikedStatus);
      localStorage.setItem('news_liked_status', JSON.stringify(newLikedStatus));

      toast.success("Obrigado pelo seu Like!", { icon: "❤️" });

      // 3. Tentar atualizar banco de dados de forma assíncrona
      supabase.from('news').update({ likes: (currentLikes || 0) + 1 }).eq('id', id).then(({ error }) => {
        if (error) console.warn("Supabase: Coluna 'likes' não encontrada, usando apenas LocalStorage.");
      });

    } catch (err) {
      console.error("Erro ao curtir:", err);
    }
  };

  const handleShare = async (newsItem: any) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: newsItem.title,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link da notícia copiado!");
      }

      // Incrementa o contador de compartilhamentos no Supabase
      const { error } = await supabase
        .from('news')
        .update({ shares: (newsItem.shares || 0) + 1 })
        .eq('id', newsItem.id);

      if (error) console.error("Erro ao atualizar shares no Supabase:", error);

      // Atualiza o estado local para feedback imediato (opcional, já que o dashboard é quem mais consome isso)
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };

  const handleSaibaMaisClick = async () => {
    try {
      // Sincronização Global via Supabase Config
      const { data: currentClicks } = await supabase.from('config').select('value').eq('key', 'ad_clicks').maybeSingle();
      const nextValue = currentClicks ? Number(JSON.parse(currentClicks.value)) + 1 : 1;

      await supabase.from('config').upsert({
        key: 'ad_clicks',
        value: JSON.stringify(nextValue)
      });
    } catch (err) {
      console.error("Erro ao registrar clique na nuvem:", err);
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
                (() => {
                  const n = noticias[activeNewsIndex];
                  if (!n) return null;
                  return (
                    <motion.article
                      key={activeNewsIndex}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 flex flex-col h-auto"
                    >
                      <div className="w-full relative overflow-hidden bg-slate-100 h-80 md:h-[450px]">
                        {n.photo ? (
                          <img src={n.photo} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-6 left-6">
                          <span className="bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                            Materia Atual
                          </span>
                        </div>
                      </div>

                      <div className="p-8 md:p-12 flex flex-col">
                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-primary uppercase tracking-widest mb-6">
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

                        <h3 className="text-3xl md:text-4xl font-heading font-black mb-6 text-slate-900 leading-tight">
                          {n.title}
                        </h3>

                        <p className="text-slate-600 font-body text-lg leading-relaxed mb-12 whitespace-pre-line text-justify">
                          {n.summary}
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-between py-6 border-t border-slate-100 mb-4 gap-6">
                          <div className="flex items-center gap-6">
                            <button
                              onClick={() => handleLike(n.id, n.likes)}
                              className="flex items-center gap-2 group/like cursor-pointer transition-all active:scale-95"
                            >
                              <Heart className={`w-5 h-5 transition-colors ${likedPosts.includes(n.id) ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover/like:text-red-500'}`} />
                              <span className="text-sm font-bold text-slate-500">{(n.likes || 0)} Curtidas</span>
                            </button>

                            <button
                              onClick={() => handleShare(n)}
                              className="flex items-center gap-2 group/share cursor-pointer transition-all active:scale-95"
                            >
                              <Share2 className="w-5 h-5 text-slate-400 group-hover/share:text-primary transition-colors" />
                              <span className="text-sm font-bold text-slate-500">Compartilhar</span>
                            </button>
                          </div>

                          {/* Paginação Estilizada - Agora à direita */}
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              disabled={activeNewsIndex === 0}
                              onClick={() => {
                                setActiveNewsIndex(activeNewsIndex - 1);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className="w-8 h-8 rounded-xl border-slate-200 hover:border-primary hover:text-primary"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-1 mx-1">
                              {noticias.map((_, i) => {
                                if (Math.abs(i - activeNewsIndex) > 1 && i !== 0 && i !== noticias.length - 1) {
                                  if (Math.abs(i - activeNewsIndex) === 2) return <span key={i} className="text-slate-300">...</span>;
                                  return null;
                                }
                                return (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      setActiveNewsIndex(i);
                                      window.scrollTo({ top: 300, behavior: 'smooth' });
                                    }}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${activeNewsIndex === i 
                                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                                  >
                                    {i + 1}
                                  </button>
                                );
                              })}
                            </div>

                            <Button 
                              variant="outline" 
                              size="icon" 
                              disabled={activeNewsIndex === noticias.length - 1}
                              onClick={() => {
                                setActiveNewsIndex(activeNewsIndex + 1);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className="w-8 h-8 rounded-xl border-slate-200 hover:border-primary hover:text-primary"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Ultimas Noticias Footer 2x2 */}
                        <div className="pt-8 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-4 bg-primary rounded-full" />
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mais Conteúdo</h4>
                            </div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase">Sugestões de Leitura</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {noticias.filter((_, idx) => idx !== activeNewsIndex).slice(0, 2).map((latest, idx) => (
                              <div 
                                key={idx} 
                                onClick={() => {
                                  setActiveNewsIndex(noticias.findIndex(n => n.id === latest.id));
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                                className="flex gap-4 p-4 rounded-[1.5rem] bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group/mini border border-transparent hover:border-slate-100"
                              >
                                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                                  {latest.photo ? (
                                    <img src={latest.photo} alt={latest.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <Newspaper className="w-6 h-6 text-slate-400 m-auto mt-5" />
                                  )}
                                </div>
                                <div className="flex flex-col justify-center flex-1">
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
                  );
                })()
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
                      <div key={i} className="aspect-square bg-slate-200/50 relative group cursor-pointer overflow-hidden flex items-center justify-center">
                        <Instagram className="w-5 h-5 text-slate-300" />
                      </div>
                    ))
                  )}
                </div>
                <a 
                  href={`https://www.instagram.com/${instaConfig.handle?.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-6"
                >
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl shadow-lg">
                    Ver Perfil Completo
                  </Button>
                </a>
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
                  <Button
                    onClick={handleSaibaMaisClick}
                    className="w-full bg-white text-[#0B1B32] hover:bg-slate-200 rounded-xl font-bold"
                  >
                    SAIBA MAIS
                  </Button>
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
                    <div className="flex flex-col">
                      <div className="p-6 space-y-4">
                        {noticias.slice(sidebarPage * 10, (sidebarPage + 1) * 10).map((n, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setActiveNewsIndex(noticias.findIndex(notic => notic.id === n.id));
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="group cursor-pointer flex items-center gap-4 transition-colors"
                          >
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                              {n.photo ? (
                                <img src={n.photo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <Newspaper className="w-6 h-6 text-slate-300 m-auto mt-4" />
                              )}
                            </div>
                            <div className="flex flex-col justify-center flex-1">
                              <h5 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors uppercase">
                                {n.title}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{n.date}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">{n.views || 0} views</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Paginação do Sidebar */}
                      {noticias.length > 10 && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-1.5">
                          <button 
                            disabled={sidebarPage === 0}
                            onClick={() => setSidebarPage(sidebarPage - 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          
                          {Array.from({ length: Math.ceil(noticias.length / 10) }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setSidebarPage(i)}
                              className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${sidebarPage === i 
                                ? "bg-primary text-white shadow-md shadow-primary/20" 
                                : "text-slate-400 hover:bg-slate-100"}`}
                            >
                              {i + 1}
                            </button>
                          ))}

                          <button 
                            disabled={(sidebarPage + 1) * 10 >= noticias.length}
                            onClick={() => setSidebarPage(sidebarPage + 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {sidebarTab === 'populares' && (
                    <div className="p-6 space-y-4">
                      {populares.map((pop, idx) => (
                          <div 
                            onClick={() => {
                              setActiveNewsIndex(noticias.findIndex(n => n.id === pop.id));
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="flex gap-4 group cursor-pointer"
                          >
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
