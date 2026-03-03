import PageLayout from "@/components/PageLayout";
import { useState, useEffect } from "react";
import SectionTitle from "@/components/SectionTitle";
import { supabase } from "@/lib/supabase";
import PageBanner from "@/components/PageBanner";
import { motion } from "framer-motion";
import { User, Quote } from "lucide-react";

const CartaPresidente = () => (
  <PageLayout>
    <PageBanner title="CARTA GERAL" />
    <section className="relative py-24 md:py-32 overflow-hidden bg-[#0B1B32]">
      {/* Decorative background logo */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.03] pointer-events-none -mr-48 -mt-24">
        <img src="/bg-logo.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <SectionTitle
          title="Carta do Presidente"
          subtitle="Uma mensagem de boas-vindas do representante nacional aos participantes do IX CONTEFFA 2026."
          light={true}
        />

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row gap-0 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl"
          >
            {/* Foto e Perfil */}
            <div className="w-full lg:w-96 bg-primary/10 p-12 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 relative">
              <div className="absolute top-6 left-6 opacity-20">
                <Quote className="w-12 h-12 text-primary" />
              </div>
              <div className="relative mb-6">
                <div className="w-48 h-48 rounded-full bg-white/5 flex items-center justify-center border-4 border-white/10 shadow-2xl overflow-hidden relative">
                  <img
                    src="/presidente-jose-v2.jpg"
                    alt="Presidente José Bezerra da Rocha"
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Overlay decorativo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                </div>
                {/* Badge flutuante */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary px-4 py-1.5 rounded-full shadow-lg border border-white/20 whitespace-nowrap">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">PRESIDENTE</span>
                </div>
              </div>
              <div className="text-center">
                <h4 className="text-2xl font-heading font-black text-white mb-1 uppercase tracking-tighter">José Bezerra da Rocha</h4>
                <p className="text-primary font-bold text-xs uppercase tracking-widest">Presidente da ANTEFFA</p>
              </div>
            </div>

            {/* Texto da Carta */}
            <div className="flex-1 p-10 md:p-16 relative">
              <div className="prose prose-invert max-w-none">
                <p className="text-white/70 text-lg md:text-xl font-body leading-relaxed mb-8">
                  Prezados colegas e participantes, é com imensa satisfação que convido todos para o <span className="text-white font-bold">IX CONTEFFA 2026</span>. Este congresso representa um marco na nossa história, reunindo os melhores profissionais para debates, teses e discussões que moldarão o futuro da nossa categoria.
                </p>
                <p className="text-white/70 text-lg md:text-xl font-body leading-relaxed mb-8">
                  Ao longo de cinco dias intensos de programação, teremos a oportunidade de trocar experiências, apresentar trabalhos e construir caminhos para os desafios que se apresentam no cenário da defesa agropecuária nacional. Recife nos recebe com braços abertos para este momento de união e fortalecimento técnico-acadêmico.
                </p>
                <p className="text-white/70 text-lg md:text-xl font-body leading-relaxed mb-12 italic">
                  "Sua presença é fundamental para o fortalecimento da nossa representação e para o sucesso deste evento que é de todos nós."
                </p>

                {/* Assinatura Simbolizada */}
                <div className="flex flex-col items-start pt-8 border-t border-white/5">
                  <div className="font-heading text-3xl text-white/90 mb-2 italic opacity-80" style={{ fontFamily: "'Dancing Script', cursive" }}>
                    José Bezerra da Rocha
                  </div>
                  <div className="h-px w-48 bg-gradient-to-r from-primary/50 to-transparent mb-4" />
                  <p className="text-white/40 text-xs font-black uppercase tracking-widest">COMISSÃO ORGANIZADORA — IX CONTEFFA</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  </PageLayout>
);

const Historico = () => {
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [institutionalText, setInstitutionalText] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tentar carregar do Supabase primeiro
        const { data: events, error: eventsError } = await supabase
          .from('timeline_events')
          .select('*')
          .order('year', { ascending: true });

        const { data: settings, error: settingsError } = await supabase
          .from('site_settings')
          .select('content')
          .eq('id', 'institutional_text')
          .single();

        if (events && events.length > 0) {
          // Remover duplicados (mesmo ano e título)
          const uniqueEvents = events.filter((v: any, i: number, a: any[]) =>
            a.findIndex((t: any) => t.year === v.year && t.title === v.title) === i
          );
          setTimelineData(uniqueEvents);
        } else {
          // Fallback para o localStorage se falhar o Supabase
          const savedEvents = localStorage.getItem("conteffa_timeline_events");
          if (savedEvents) {
            const parsed = JSON.parse(savedEvents);
            setTimelineData([...parsed].sort((a: any, b: any) => (a.year || '').localeCompare(b.year || '')));
          } else {
            // Dados estáticos originais como último recurso
            setTimelineData([
              { year: "2002", title: "Fundação da ANTEFFA", description: "Início da trajetória oficial da Associação Nacional dos Técnicos de Fiscalização Federal Agropecuária." },
              { year: "2003", title: "1º Encontro Nacional", description: "Primeira grande reunião de mobilização da categoria." },
              { year: "2004", title: "2º Encontro Nacional", description: "Evento que consolidou a mobilização da categoria e preparou o caminho para a criação do congresso nacional." },
              { year: "2005", title: "I CONTEFFA — Ilhéus", description: "O primeiro Congresso Nacional dos Técnicos de Fiscalização Federal Agropecuária." },
              { year: "2006", title: "II CONTEFFA — Fortaleza", description: "Segunda edição com foco em estratégias de valorização." },
              { year: "2008", title: "III CONTEFFA — Rondônia", description: "Terceira edição expandindo as fronteiras do debate técnico." },
              { year: "2010", title: "IV CONTEFFA — Foz do Iguaçu", description: "Quarta edição em um dos principais polos turísticos e técnicos." },
              { year: "2012", title: "V CONTEFFA — Uberlândia", description: "Um marco na discussão sobre a modernização da fiscalização." },
              { year: "2014", title: "VI CONTEFFA — Bento Gonçalves", description: "Debates técnicos no sul do país, fortalecendo a união." },
              { year: "2016", title: "VII CONTEFFA — Caldas Novas", description: "Sétima edição focada em inovação e novos processos." },
              { year: "2023", title: "VIII CONTEFFA — Florianópolis", description: "Retomada histórica pós-pandemia com recorde de participação." },
              { year: "2026", title: "IX CONTEFFA — Recife", description: "A nona edição, consolidada como o maior evento da história da ANTEFFA.", active: true },
            ]);
          }
        }

        if (settings && !settingsError) {
          setInstitutionalText(settings.content);
        } else {
          const savedText = localStorage.getItem("conteffa_timeline_text");
          setInstitutionalText(savedText || `A Associação Nacional dos Técnicos de Fiscalização Federal Agropecuária – ANTEFFA, fundada em 2002, é a entidade representativa da categoria no âmbito federal. Nossa missão é lutar pela valorização profissional e pelo reconhecimento da importância técnica de nossos associados no cenário da agropecuária nacional.
  
  Ao longo de mais de duas décadas, a ANTEFFA tem sido protagonista em negociações fundamentais para a carreira dos técnicos, promovendo congressos nacionais (CONTEFFAs) e articulando diálogos institucionais para o fortalecimento da defesa agropecuária no Brasil. Nosso compromisso é com a excelência técnica e com a defesa dos interesses de nossos associados em todo o território nacional.`);
        }
      } catch (err) {
        console.error("Erro ao carregar do Supabase:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <PageLayout>
      <PageBanner title="HISTÓRICO" />
      <section className="relative py-24 md:py-32 overflow-hidden bg-[#0B1B32]">
        {/* Decorative background logo */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] opacity-[0.03] pointer-events-none -ml-48 mt-24 rotate-12">
          <img src="/bg-logo.png" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <SectionTitle
            title="Histórico de Lutas e Vitórias"
            subtitle="Uma trajetória marcada pela união e pelo fortalecimento da fiscalização agropecuária federal."
            light={true}
          />

          <div className="max-w-5xl mx-auto mt-20 relative">
            {/* Linha Central da Timeline */}
            <div className="absolute left-[30px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0 -translate-x-1/2" />

            {timelineData.map((item, index) => {
              const isActive = item.active || item.year === "2026";
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center mb-16 last:mb-0 ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}
                >
                  {/* O Ponto (Bullet) */}
                  <div className="absolute left-[30px] md:left-1/2 -translate-x-1/2 z-20">
                    <div className={`w-4 h-4 rounded-full border-2 ${isActive ? 'bg-primary border-primary shadow-[0_0_15px_rgba(0,171,229,0.8)]' : 'bg-[#0B1B32] border-primary/50'}`}>
                      {isActive && <div className="absolute inset-0 rounded-full animate-ping bg-primary opacity-50" />}
                    </div>
                  </div>

                  {/* Conteúdo à Esquerda/Direita */}
                  <div className="w-full md:w-[45%] pl-20 md:pl-0">
                    <div className={`p-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/5 shadow-2xl transition-all duration-500 hover:bg-white/[0.06] hover:-translate-y-1 group ${isActive ? 'border-primary/20' : ''}`}>
                      {item.year && (
                        <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary font-black text-xs uppercase tracking-[0.2em] mb-4">
                          {item.year}
                        </span>
                      )}
                      <h3 className={`text-xl md:text-2xl font-heading font-black mb-3 ${isActive ? 'text-white' : 'text-white/90'} group-hover:text-primary transition-colors`}>
                        {item.title}
                      </h3>
                      <p className="text-white/50 text-base font-body leading-relaxed line-clamp-2 md:line-clamp-none">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Ano flutuante opcional no lado oposto na desktop */}
                  <div className="hidden md:flex w-[45%] items-center justify-center">
                    {item.year && (
                      <div className="text-7xl font-heading font-black opacity-[0.03] text-white">
                        {item.year}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Texto Detalhado Pós-Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32 p-10 md:p-16 rounded-[3rem] bg-white/[0.02] backdrop-blur-xl border border-white/5 shadow-2xl relative overflow-hidden"
          >
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[10rem] -mr-20 -mt-20 pointer-events-none" />

            <div className="prose prose-invert max-w-none relative z-10">
              <h3 className="text-2xl md:text-4xl font-heading font-black text-white mb-12 border-b border-white/10 pb-8 uppercase tracking-tight text-center leading-tight">
                Associação Nacional dos Técnicos de <br />
                Fiscalização Federal Agropecuária – ANTEFFA
              </h3>

              <div className="space-y-8 text-white/70 text-lg leading-relaxed font-body">
                {institutionalText.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

const Evento = () => (
  <PageLayout>
    <PageBanner title="O EVENTO" />
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="O Evento" subtitle="Conheça o IX CONTEFFA 2026" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-muted-foreground leading-relaxed">
          <p>O IX CONTEFFA 2026 será realizado de 12 a 16 de novembro de 2026, no <strong>Mar Hotel Conventions</strong>, em Recife - PE. O evento reunirá profissionais de todo o Brasil em cinco dias de palestras, debates, apresentações de teses e atividades de integração.</p>
          <p>Organizado pela ANTEFFA, o congresso focará no fortalecimento da categoria e nos desafios da fiscalização federal agropecuária.</p>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

const Regimento = () => (
  <PageLayout>
    <PageBanner title="REGIMENTO" />
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="Regimento do Congresso" subtitle="Normas e regulamentos do IX CONTEFFA 2026" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className="bg-navy rounded-[3rem] p-12 text-white/80 leading-relaxed text-xl shadow-2xl">
          <p>O regimento completo do IX CONTEFFA 2026 será disponibilizado em breve. Fique atento às atualizações.</p>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

export { CartaPresidente, Historico, Evento, Regimento };
