import PageLayout from "@/components/PageLayout";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";

const days = [
  {
    date: "12 de Novembro",
    label: "Dia 1 — Abertura",
    items: [
      { time: "08:00", title: "Credenciamento", speaker: "" },
      { time: "09:00", title: "Cerimônia de Abertura", speaker: "Presidente do CONTEFFA" },
      { time: "10:30", title: "Palestra Magna: O Futuro da Profissão", speaker: "A confirmar" },
      { time: "14:00", title: "Mesa Redonda: Desafios Contemporâneos", speaker: "Palestrantes convidados" },
    ],
  },
  {
    date: "13 de Novembro",
    label: "Dia 2 — Palestras",
    items: [
      { time: "08:30", title: "Painel: Inovação e Tecnologia", speaker: "A confirmar" },
      { time: "10:00", title: "Workshop: Boas Práticas", speaker: "A confirmar" },
      { time: "14:00", title: "Apresentação de Teses — Bloco 1", speaker: "Diversos autores" },
    ],
  },
  {
    date: "14 de Novembro",
    label: "Dia 3 — Debates",
    items: [
      { time: "08:30", title: "Painel: Regulamentação e Legislação", speaker: "A confirmar" },
      { time: "14:00", title: "Apresentação de Teses — Bloco 2", speaker: "Diversos autores" },
      { time: "16:00", title: "Debate Aberto", speaker: "Participantes" },
    ],
  },
  {
    date: "15 de Novembro",
    label: "Dia 4 — Integração",
    items: [
      { time: "08:30", title: "Sessão Plenária", speaker: "Comissão organizadora" },
      { time: "14:00", title: "Atividades Culturais e Turísticas", speaker: "" },
      { time: "20:00", title: "Jantar de Confraternização", speaker: "" },
    ],
  },
  {
    date: "16 de Novembro",
    label: "Dia 5 — Encerramento",
    items: [
      { time: "08:30", title: "Votação de Indicativos", speaker: "Delegados" },
      { time: "10:00", title: "Palestra de Encerramento", speaker: "A confirmar" },
      { time: "12:00", title: "Cerimônia de Encerramento", speaker: "Presidente do CONTEFFA" },
    ],
  },
];

const Programacao = () => {
  return (
    <PageLayout>
      <section className="section-padding">
        <div className="container mx-auto max-w-5xl">
          <SectionTitle title="Programação" subtitle="Confira a agenda completa do IX CONTEFFA 2026" />

          <div className="space-y-8">
            {days.map((day, di) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: di * 0.1 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <div className="bg-primary px-6 py-4">
                  <h3 className="text-lg font-bold text-primary-foreground">{day.date}</h3>
                  <p className="text-primary-foreground/70 text-sm">{day.label}</p>
                </div>
                <div className="divide-y divide-border">
                  {day.items.map((item, i) => (
                    <div key={i} className="px-6 py-4 flex items-start gap-4">
                      <div className="flex items-center gap-2 text-primary shrink-0 w-20">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">{item.time}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        {item.speaker && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="w-3.5 h-3.5" />
                            {item.speaker}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
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
