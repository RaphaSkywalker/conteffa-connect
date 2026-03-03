import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";

const Programacao = () => {
  const [days, setDays] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Carregar Palestrantes e Convidados do Supabase
        const [{ data: speakers }, { data: guests }] = await Promise.all([
          supabase.from('speakers').select('*'),
          supabase.from('guests').select('*')
        ]);

        let allPeople: any[] = [];
        if (speakers) allPeople = [...allPeople, ...speakers];
        if (guests) allPeople = [...allPeople, ...guests];
        setPeople(allPeople);

        // 2. Carregar Programação do Supabase
        const { data: progData } = await supabase.from('programming').select('*').order('id');
        if (progData && progData.length > 0) {
          setDays(progData);
        } else {
          loadDefaults();
        }
      } catch (err) {
        console.error("Failed to fetch programming data from Supabase", err);
        loadDefaults();
      }
    };

    const loadDefaults = () => {
      // Fallback for people
      const savedPalestrantes = localStorage.getItem("conteffa_palestrantes");
      const savedConvidados = localStorage.getItem("conteffa_convidados");
      let allPeople: any[] = [];
      if (savedPalestrantes) allPeople = [...allPeople, ...JSON.parse(savedPalestrantes)];
      if (savedConvidados) allPeople = [...allPeople, ...JSON.parse(savedConvidados)];
      setPeople(allPeople);

      // Fallback for days
      const saved = localStorage.getItem("conteffa_programacao");
      if (saved) {
        setDays(JSON.parse(saved));
      } else {
        setDays([
          {
            date: "12 de Novembro", label: "Dia 1 — Abertura",
            items: [
              { time: "08:00", title: "Credenciamento", speaker: "" },
              { time: "09:00", title: "Cerimônia de Abertura", speaker: "Presidente do CONTEFFA" }
            ]
          }
        ]);
      }
    };

    fetchAllData();
  }, []);

  return (
    <PageLayout>
      <PageBanner title="PROGRAMAÇÃO" />
      <section className="section-padding">
        <div className="container mx-auto max-w-7xl">
          <SectionTitle title="Programação" subtitle="Confira a agenda completa do IX CONTEFFA 2026" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {days.map((day, di) => (
              <motion.div
                key={day.id || day.date}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: di * 0.1 }}
                className="group bg-white rounded-[2rem] border border-border/50 card-shadow overflow-hidden h-fit"
              >
                <div className="bg-navy px-8 py-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-bl-[3rem]" />
                  <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-heading font-black">{day.date}</h3>
                    <p className="text-white/60 font-medium uppercase tracking-widest text-[10px] mt-1">{day.label}</p>
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {day.items.map((item: any, i: number) => {
                    const speakerObj = people.find((p: any) => p.name === item.speaker);
                    return (
                      <div key={i} className="px-8 py-5 flex items-center justify-between gap-4 hover:bg-primary/5 transition-colors group/row">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                          <div className="flex items-center gap-2 text-primary shrink-0 sm:w-28 bg-primary/10 px-3 py-1.5 rounded-full justify-center sm:justify-start">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-sm font-black">{item.time}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-heading font-bold text-foreground leading-tight group-hover/row:text-primary transition-colors">{item.title}</p>
                            {item.speaker && item.speaker !== "none" && (
                              <div className="flex items-center gap-2 mt-2">
                                <User className="w-3 h-3 text-primary" />
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.speaker}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {item.speaker && item.speaker !== "none" && speakerObj && (
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-100 border-2 border-white shadow-lg overflow-hidden shrink-0 transition-transform group-hover/row:scale-110 duration-300">
                            {speakerObj.photo ? (
                              <img src={speakerObj.photo} alt={speakerObj.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                <User className="w-6 h-6 text-primary/20" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Programacao;
