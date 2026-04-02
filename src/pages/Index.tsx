import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, animate, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarDays, Users, Mic, MapPin, FileText, ArrowRight, User, Calendar, Newspaper, ChevronLeft, ChevronRight, Instagram, Linkedin, Twitter } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import Countdown from "@/components/Countdown";
import SectionTitle from "@/components/SectionTitle";
import heroBg from "@/assets/hero-home-v3.jpg";
import { Button } from "@/components/ui/button";

const stats = [
  { icon: Users, value: "320+", label: "Inscritos" },
  { icon: Mic, value: "45", label: "Palestrantes" },
  { icon: CalendarDays, value: "5", label: "Dias de Evento" },
  { icon: FileText, value: "80+", label: "Teses" },
];

const highlights = [
  {
    icon: Mic,
    title: "Unificação dos Cargos",
    description: "Abordagem sintética do anteprojeto de lei - APL que trata da reorganização dos cargos de nível intermediário do PCTAF",
  },
  {
    icon: Users,
    title: "Nivelamento dos Cargos de Nível Auxiliar",
    description: "Equiparação da Tabela Remuneratória entre os cargos AL e AOA.",
  },
  {
    icon: FileText,
    title: "PL da Indenização de Folga Remunerada",
    description: "Institui a indenização de serviço voluntário em folga remunerada.",
  },
  {
    icon: MapPin,
    title: "Regras para Aposentadoria",
    description: "A integralidade e paridade são garantias dos Servidores Federais.",
  },
];

const StatCounter = ({ value }: { value: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref);
  const [displayValue, setDisplayValue] = useState("0");
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const numericPart = parseInt(value.replace(/\D/g, "")) || 0;
    
    // Only animate if value is > 0 and isInView, but only once
    if (isInView && !hasAnimated && numericPart > 0) {
      const suffix = value.replace(/[0-9]/g, "");
      const controls = animate(0, numericPart, {
        duration: 2,
        ease: "easeOut",
        onUpdate(v) {
          setDisplayValue(Math.floor(v).toLocaleString('pt-BR') + suffix);
        },
      });
      setHasAnimated(true);
      return () => controls.stop();
    } else if (!hasAnimated) {
      // If not yet animated, keep updating with the raw value (from Supabase)
      setDisplayValue(value);
    }
  }, [value, isInView, hasAnimated]);

  return <span ref={ref}>{displayValue}</span>;
};

const Index = () => {
  const [palestrantes, setPalestrantes] = useState<any[]>([]);
  const [noticias, setNoticias] = useState<any[]>([]);
  const [inscritosCount, setInscritosCount] = useState(0);
  const [tesesCount, setTesesCount] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth / 1.5
        : scrollLeft + clientWidth / 1.5;

      scrollContainerRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  const highlightsScrollRef = useRef<HTMLDivElement>(null);
  
  const scrollHighlights = (direction: 'left' | 'right') => {
    if (highlightsScrollRef.current) {
      const { scrollLeft, clientWidth } = highlightsScrollRef.current;
      // Scroll by exactly 1 item width on mobile
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth
        : scrollLeft + clientWidth;

      highlightsScrollRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Palestrantes do Supabase
        const { data: speakersData } = await supabase.from('speakers').select('*').limit(6);

        // 2. Notícias do Supabase
        const { data: newsData } = await supabase.from('news').select('*').order('created_at', { ascending: false }).limit(3);

        // 3. Contagem de Inscritos do Supabase (Otimizado)
        const { count, error: regError } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
        const regCount = count || 0;
        if (regError) {
          console.error("Erro ao carregar inscritos:", regError.message);
        }

        // 4. Contagem de Teses (PDFs em Cadernos) do Supabase
        const { data: configData } = await supabase.from('config').select('*');
        if (configData) {
          const cadsEntry = configData.find((c: any) => c.key === 'cadernos_data');
          if (cadsEntry && cadsEntry.value) {
            try {
              const cadsArr = typeof cadsEntry.value === 'string' ? JSON.parse(cadsEntry.value) : cadsEntry.value;
              let totalPDFs = 0;
              if (Array.isArray(cadsArr)) {
                cadsArr.forEach((c: any) => {
                  if (c.items && Array.isArray(c.items)) {
                    // Conta apenas itens que têm fileUrl (PDF)
                    totalPDFs += c.items.filter((item: any) => item.fileUrl && item.fileUrl.trim() !== "").length;
                  }
                });
              }
              setTesesCount(totalPDFs);
            } catch (e) {
              console.error("Erro ao processar contagem de teses:", e);
            }
          }
        }

        if (speakersData && speakersData.length > 0) {
          setPalestrantes(speakersData);
        }

        if (newsData && newsData.length > 0) {
          setNoticias(newsData);
        }

        let finalCount = regCount;

        // 5. Buscar do localStorage
        const savedInscricoes = localStorage.getItem("conteffa_inscricoes");
        if (savedInscricoes) {
          try {
            const parsed = JSON.parse(savedInscricoes);
            finalCount = Math.max(finalCount, parsed.length);
          } catch (e) {
            console.error("Erro ao ler localStorage de inscritos", e);
          }
        }

        setInscritosCount(finalCount);

      } catch (err) {
        console.error("Failed to fetch home data", err);
      }
    };

    const loadDefaultData = () => {
      // Speakers
      const savedPalestrantes = localStorage.getItem("conteffa_palestrantes");
      if (savedPalestrantes) {
        const parsed = JSON.parse(savedPalestrantes);
        if (parsed.length > 0) {
          setPalestrantes(parsed);
          return;
        }
      }

      setPalestrantes([
        { id: 1, name: "José Bezerra da Rocha", cargo: "Presidente da ANTEFFA", bio: "Liderando a organização do IX CONTEFFA para fortalecer a categoria.", photo: "/presidente-jose-v2.jpg" },
        { id: 2, name: "Dr. Roberto Silva", cargo: "Especialista em Defesa Agropecuária", bio: "Palestrante confirmado para discutir os novos rumos da fiscalização federal.", photo: null },
        { id: 3, name: "Comissão Organizadora", cargo: "Recife 2026", bio: "Equipe dedicada ao planejamento estratégico do evento no Mar Hotel Conventions.", photo: null }
      ]);
    };

    const loadDefaultNews = () => {
      // News
      const savedNoticias = localStorage.getItem("conteffa_noticias");
      if (savedNoticias) {
        const parsed = JSON.parse(savedNoticias);
        if (parsed.length > 0) {
          setNoticias(parsed);
          return;
        }
      }

      setNoticias([
        { title: "Inscrições abertas para o IX CONTEFFA 2026", date: "15 de março de 2026", photo: "https://images.unsplash.com/photo-1591115765373-520b7a217157?w=800&auto=format&fit=crop&q=60" },
        { title: "Programação preliminar divulgada", date: "01 de abril de 2026", photo: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60" },
        { title: "Previsão de recorde de público", date: "10 de abril de 2026", photo: "https://images.unsplash.com/photo-1505373676834-4bd3dec6e73c?w=800&auto=format&fit=crop&q=60" }
      ]);
    };

    const loadInscritosCount = () => {
      const savedInscricoes = localStorage.getItem("conteffa_inscricoes");
      if (savedInscricoes) {
        setInscritosCount(JSON.parse(savedInscricoes).length);
      }
    };

    fetchAllData();

    // -- REALTIME SUBSCRIPTIONS --
    const channel = supabase
      .channel('home_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speakers' },
        () => fetchAllData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        () => fetchAllData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => fetchAllData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'config' },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-fixed bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Animated background logos */}
        <div className="absolute bottom-[15%] -left-32 w-[420px] h-[420px] opacity-[0.05] pointer-events-none animate-bounce [animation-duration:9s]">
          <img src="/bg-logo.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute top-[15%] -right-32 w-[420px] h-[420px] opacity-[0.05] pointer-events-none animate-bounce [animation-duration:8s]">
          <img src="/bg-logo.png" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-primary/20 backdrop-blur-md px-6 py-2 rounded-full border border-primary/30 text-primary font-bold text-sm uppercase tracking-widest mb-4"
          >
            INSCRIÇÕES ABERTAS
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-heading text-[38px] sm:text-[49.5px] md:text-[74.2px] lg:text-[93px] font-black text-white mb-0 leading-tight tracking-tighter"
          >
            IX CONTEFFA
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}
            className="text-[23px] text-white/95 font-medium tracking-wide -mt-2 mb-1 md:-mt-4 md:mb-1 max-w-5xl mx-auto drop-shadow-md leading-snug md:leading-relaxed text-center"
          >
            Construindo o futuro em tempos de mudança.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[21px] sm:text-[27px] md:text-[31px] text-[#00ABE5] max-w-5xl mx-auto mt-1 md:-mt-1 mb-6 md:mb-4 font-black uppercase tracking-wider leading-snug md:leading-relaxed"
          >
            12 a 15 NOV 2026, RECIFE-PE
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col md:flex-row justify-center items-center gap-5"
          >
            <Link to="/inscricao">
              <Button className="text-[15px] font-medium uppercase tracking-wider px-10 h-12 rounded-full group shadow-xl shadow-primary/20">
                INSCRIÇÃO
              </Button>
            </Link>
            <Link to="/programacao">
              <Button variant="outline" className="text-[15px] font-medium uppercase tracking-wider px-10 h-12 rounded-full border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white transition-all">
                VER PROGRAMAÇÃO
              </Button>
            </Link>
          </motion.div>

        </div>
      </section>

      {/* Highlights & Countdown Union */}
      <section className="relative pb-24 overflow-visible bg-primary">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 flex items-center justify-center pointer-events-none">
          <img src="/bg-logo.png" alt="" className="w-[500px] h-[500px] object-contain -rotate-12" />
        </div>

        {/* Countdown Overlapping the boundary */}
        <div className="container mx-auto px-4 flex justify-center relative z-30 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="bg-[#0B1B32]/90 backdrop-blur-xl rounded-[2.5rem] p-5 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 max-w-fit relative mt-8 md:mt-0"
          >
            {/* Countdown Badge Title */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary px-4 sm:px-6 md:px-8 py-2 md:py-2.5 rounded-full shadow-lg border border-white/20 whitespace-nowrap">
              <h3 className="text-[10px] sm:text-xs md:text-[14px] font-bold text-white uppercase tracking-[0.1em]">
                NOSSO EVENTO COMEÇA EM:
              </h3>
            </div>

            <Countdown />
          </motion.div>
        </div>

        <div className="container relative z-10 mx-auto px-10 md:px-4 -mt-12 md:-mt-20">
          <SectionTitle
            title="Destaques do IX CONTEFFA"
            subtitle="Uma jornada de 5 dias pensada para impulsionar sua carreira e expandir seus horizontes profissionais."
            light={true}
          />

          <div className="relative">
            <button
              onClick={() => scrollHighlights('left')}
              className="absolute -left-6 md:-left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center bg-[#0B1B32]/80 backdrop-blur-sm text-white hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90 xl:hidden"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={() => scrollHighlights('right')}
              className="absolute -right-6 md:-right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center bg-[#0B1B32]/80 backdrop-blur-sm text-white hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90 xl:hidden"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div 
              ref={highlightsScrollRef}
              className="flex xl:grid xl:grid-cols-4 overflow-x-auto gap-6 xl:gap-10 py-4 px-1 xl:px-0 no-scrollbar scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {highlights.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="w-full min-w-full xl:min-w-0 xl:w-auto flex-shrink-0 xl:flex-shrink snap-center group relative p-8 md:p-10 rounded-[3rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[5rem] group-hover:bg-white/10 transition-colors" />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform duration-500">
                      <item.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-heading font-black mb-3 md:mb-4 text-white group-hover:text-white/80 transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-base md:text-lg text-white/70 font-body leading-relaxed mb-6 flex-grow">
                      {item.description}
                    </p>
                    <div className="flex items-center text-white font-bold gap-2 group-hover:translate-x-2 transition-transform mt-auto">
                      Saiba mais <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Palestrantes Section */}
      <section className="py-16 bg-background relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="relative mb-4">
            <SectionTitle
              title="Palestrantes Confirmados"
              subtitle="Conheça os especialistas que irão compartilhar seus conhecimentos e experiências no palco principal."
              centered={true}
              className="mb-0"
            />
          </div>

          {palestrantes.length > 0 && (
            <div className="relative px-12 md:px-20">
              {palestrantes.length > 1 && (
                <>
                  <button
                    onClick={() => scroll('left')}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center bg-white text-primary hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90 ${palestrantes.length <= 3 ? 'md:hidden' : ''}`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => scroll('right')}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center bg-white text-primary hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90 ${palestrantes.length <= 3 ? 'md:hidden' : ''}`}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <div
                ref={scrollContainerRef}
                className={`flex overflow-x-auto gap-8 py-12 px-4 -mx-4 no-scrollbar scroll-smooth ${palestrantes.length <= 3 ? 'md:justify-center' : ''}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {palestrantes.map((p: any, i: number) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="w-full max-w-[300px] flex-shrink-0 group relative p-6 rounded-[2.5rem] bg-[#0B1B32] border border-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden text-center flex flex-col items-center"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-[4rem] group-hover:bg-primary/10 transition-colors" />

                    <div className="relative z-10 w-full flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border-[3px] border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                        {p.photo ? (
                          <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <h3 className="text-xl font-heading font-black mb-1 text-white group-hover:text-primary transition-colors leading-tight">
                        {p.name}
                      </h3>
                      <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-3">
                        {p.cargo}
                      </p>
                      {p.bio && (
                        <p className="text-xs text-white/60 font-body leading-relaxed mb-4 line-clamp-2">
                          {p.bio}
                        </p>
                      )}

                      <div className="flex items-center justify-center gap-3 mt-auto pt-4 border-t border-border/10 w-full">
                        {p.instagram && (
                          <a href={p.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300">
                            <Instagram className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {p.linkedin && (
                          <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300">
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {p.twitter && (
                          <a href={p.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-all duration-300">
                            <Twitter className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {!p.instagram && !p.linkedin && !p.twitter && (
                          <div className="flex items-center justify-center text-primary text-xs font-bold gap-2 group-hover:translate-x-1 transition-transform cursor-pointer">
                            Ver detalhes <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 flex items-center justify-center pointer-events-none">
          <img src="/bg-logo.png" alt="" className="w-[400px] h-[400px] object-contain" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, value: String(inscritosCount), label: "Inscritos" },
              { icon: Mic, value: String(palestrantes.length), label: "Palestrantes" },
              { icon: CalendarDays, value: "5", label: "Dias de Evento" },
              { icon: FileText, value: String(tesesCount), label: "Teses" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-4 group transition-transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-all duration-500 border border-white/20">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl md:text-6xl font-heading font-black text-white mb-2 drop-shadow-md">
                  <StatCounter value={stat.value} />
                </div>
                <div className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News & Blog Section */}
      <section className="bg-[#0B1B32] py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        <div className="container mx-auto px-10 md:px-4 relative z-10">
          <SectionTitle
            label="NOTÍCIAS"
            title="Últimas Notícias"
            subtitle="Fique por dentro das novidades e atualizações do CONTEFFA em tempo real através do nosso canal oficial de notícias."
            centered={true}
            light={true}
          />

          {noticias.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {noticias.slice(0, 3).map((post: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="relative h-64 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {post.photo ? (
                      <img
                        src={post.photo}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <Newspaper className="w-12 h-12 text-slate-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-primary font-bold uppercase tracking-wider mb-3">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Assessoria Conteffa
                      </div>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-slate-500 font-medium">{post.date}</span>
                    </div>

                    <h3 className="text-xl font-heading font-black mb-6 leading-tight text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <div className="mt-auto">
                      <Link to="/noticias">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl border-primary/20 text-primary font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all h-11"
                        >
                          LER MAIS
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-primary">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 flex items-center justify-center pointer-events-none">
          <img src="/bg-logo.png" alt="" className="w-[500px] h-[500px] object-contain rotate-12" />
        </div>

        <div className="container relative z-10 mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-7xl font-heading font-black text-white mb-8 leading-[1.1]">
              Sua presença é fundamental <br /> para o <span className="underline decoration-white/30 decoration-8 underline-offset-8">sucesso do CONTEFFA</span>.
            </h2>
            <p className="text-white/80 text-xl md:text-2xl max-w-2xl font-body mx-auto mb-12">
              Garanta agora sua participação no maior evento nacional da categoria. O primeiro lote está disponível por tempo limitado.
            </p>
            <Link to="/inscricao">
              <Button
                size="lg"
                variant="secondary"
                className="font-body font-medium text-[15px] px-10 h-12 rounded-full hover:scale-105 transition-transform shadow-2xl shadow-black/20 uppercase tracking-widest"
              >
                FAÇA SUA INSCRIÇÃO
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
