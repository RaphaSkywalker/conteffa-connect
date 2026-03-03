import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { Calendar, Newspaper, Image as ImageIcon, Instagram, Megaphone, Archive, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Noticias = () => {
  const [noticias, setNoticias] = useState<any[]>([]);
  const [instaConfig, setInstaConfig] = useState({ handle: "@anteffa", url: "#", photos: [] as string[] });

  useEffect(() => {
    const loadDefaults = () => {
      const savedNoticias = localStorage.getItem("conteffa_noticias");
      if (savedNoticias) {
        setNoticias(JSON.parse(savedNoticias));
      } else {
        setNoticias([
          {
            title: "Preparativos avançam para o IX CONTEFFA em Recife",
            date: "26 de fevereiro de 2026",
            summary: "A comissão organizadora se reuniu para definir os eixos temáticos e a estrutura logística no Mar Hotel Conventions. O evento promete ser um marco histórico para os Técnicos de Fiscalização Federal Agropecuária.",
            photo: null
          },
          {
            title: "Código promocional disponível para hospedagem",
            date: "15 de fevereiro de 2026",
            summary: "Participantes já podem garantir sua reserva com tarifas diferenciadas utilizando o código 'anteffa2026' diretamente no portal do hotel oficial.",
            photo: null
          },
          {
            title: "ANTEFFA discute programação estratégica",
            date: "01 de fevereiro de 2026",
            summary: "Lideranças da categoria debatem a inclusão de painéis sobre modernização da carreira e novos marcos regulatórios na programação oficial.",
            photo: null
          },
        ]);
      }

      const savedInsta = localStorage.getItem("conteffa_instagram");
      if (savedInsta) setInstaConfig(JSON.parse(savedInsta));
    };

    const fetchData = async () => {
      try {
        const newsRes = await fetch("http://localhost:3001/api/news");
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          if (newsData.length > 0) setNoticias(newsData);
          else loadDefaults();
        } else {
          loadDefaults();
        }

        const instaRes = await fetch("http://localhost:3001/api/config/instagram");
        if (instaRes.ok) {
          const config = await instaRes.json();
          if (config && config.handle) setInstaConfig(config);
        }
      } catch (err) {
        console.error("Failed to fetch news", err);
        loadDefaults();
      }
    };

    fetchData();
  }, []);

  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  const getMonthCount = (monthIndex: number, monthName: string) => {
    return getNoticiasByMonth(monthIndex, monthName).length;
  };

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
      prev.includes(monthName)
        ? prev.filter(m => m !== monthName)
        : [...prev, monthName]
    );
  };

  const mesesFull = [
    { name: "Janeiro", index: 0 },
    { name: "Fevereiro", index: 1 },
    { name: "Março", index: 2 },
    { name: "Abril", index: 3 },
    { name: "Maio", index: 4 },
    { name: "Junho", index: 5 },
    { name: "Julho", index: 6 },
    { name: "Agosto", index: 7 },
    { name: "Setembro", index: 8 },
    { name: "Outubro", index: 9 },
    { name: "Novembro", index: 10 },
    { name: "Dezembro", index: 11 },
  ].map(m => ({
    ...m,
    count: getMonthCount(m.index, m.name),
    noticiasDoc: getNoticiasByMonth(m.index, m.name)
  }));

  const meses = mesesFull.filter(m => m.count > 0);

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
            {/* Main Content */}
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
                      </div>

                      <h3 className="text-2xl md:text-3xl font-heading font-black mb-5 text-slate-900 group-hover:text-primary transition-colors leading-tight">
                        {n.title}
                      </h3>

                      <p className="text-muted-foreground font-body text-base leading-relaxed mb-10 whitespace-pre-line">
                        {n.summary}
                      </p>

                      {/* Mini News Bar at the bottom of the article */}
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

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-10">
              {/* Instagram Section */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-l-4 border-pink-500 pl-4">
                  <Instagram className="w-6 h-6 text-pink-500" />
                  <div>
                    <h4 className="font-heading font-black text-slate-900 leading-none">Seguidores</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Siga {instaConfig.handle}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-xl">
                  {instaConfig.photos && instaConfig.photos.length > 0 ? (
                    instaConfig.photos.map((photo, i) => (
                      <div key={i} className="aspect-square bg-slate-100 relative group cursor-pointer overflow-hidden">
                        <img
                          src={photo}
                          alt="Instagram Feed Content"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  ) : (
                    [
                      "1590650153855-d9e808231d41", // meeting
                      "1590650516494-0c8e4a4dd67e", // desk
                      "1556761175-4b46a572b786", // team
                      "1542744094-24638eff58bb", // analytics
                      "1522202176988-66273c2fd55f", // students
                      "1521737604893-d14cc237f11d"  // office
                    ].map((id, i) => (
                      <div key={i} className="aspect-square bg-slate-100 relative group cursor-pointer overflow-hidden">
                        <img
                          src={`https://images.unsplash.com/photo-${id}?w=200&h=200&auto=format&fit=crop&q=80`}
                          alt="Instagram Placeholder"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  )}
                </div>
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-pink-200"
                  onClick={() => window.open(`https://instagram.com/${instaConfig.handle.replace('@', '')}`, '_blank')}
                >
                  Ver Perfil Completo
                </Button>
              </div>

              {/* Divulgação Section */}
              <div className="bg-[#0B1B32] rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6 border-l-4 border-primary pl-4">
                    <Megaphone className="w-6 h-6 text-primary" />
                    <h4 className="font-heading font-black leading-none">Divulgação</h4>
                  </div>
                  <div className="aspect-[4/3] bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-6 group-hover:bg-white/10 transition-colors">
                    <ImageIcon className="w-12 h-12 text-white/20" />
                  </div>
                  <p className="text-white/60 text-sm font-body leading-relaxed mb-6">
                    Seja um patrocinador do IX CONTEFFA e dê visibilidade à sua marca para os maiores especialistas do setor.
                  </p>
                  <Button className="w-full bg-white text-[#0B1B32] hover:bg-slate-200 rounded-xl font-bold">
                    SAIBA MAIS
                  </Button>
                </div>
              </div>

              {/* Arquivo Section */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
                <div className="bg-primary px-6 py-4">
                  <h4 className="font-heading font-black text-white text-sm uppercase tracking-[0.2em]">Arquivo</h4>
                </div>
                <div className="p-0">
                  <div className="divide-y divide-slate-100">
                    {meses.map((mes, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div
                          onClick={() => toggleMonth(mes.name)}
                          className={`flex items-center justify-between px-6 py-4 transition-all hover:bg-slate-50 group cursor-pointer ${expandedMonths.includes(mes.name) ? 'bg-slate-50' : ''}`}
                        >
                          <span className={`text-[11px] font-black uppercase tracking-widest ${expandedMonths.includes(mes.name) ? 'text-primary' : 'text-slate-900'}`}>
                            {mes.name} 2026
                          </span>
                          <span className="text-[11px] font-black text-slate-400">
                            ({mes.count})
                          </span>
                        </div>

                        {expandedMonths.includes(mes.name) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="bg-slate-50/50 px-6 pb-4 overflow-hidden"
                          >
                            <ul className="space-y-3 pt-2 border-t border-slate-100">
                              {mes.noticiasDoc.map((doc: any, dIdx: number) => {
                                const originalIndex = noticias.findIndex(n => n.title === doc.title);
                                return (
                                  <li key={dIdx}>
                                    <a
                                      href={`#noticia-${originalIndex}`}
                                      className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors flex items-start gap-2 leading-tight"
                                    >
                                      <div className="w-1 h-1 rounded-full bg-primary mt-1 shrink-0" />
                                      {doc.title}
                                    </a>
                                  </li>
                                );
                              })}
                            </ul>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Tabs from Reference */}
                <div className="flex bg-slate-50 border-t border-slate-100">
                  <button className="flex-1 py-3 text-[9px] font-black bg-primary text-white uppercase tracking-wider">Recentes</button>
                  <button className="flex-1 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider border-l border-slate-200 hover:text-primary transition-colors">Populares</button>
                  <button className="flex-1 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider border-l border-slate-200 hover:text-primary transition-colors">Tags</button>
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
