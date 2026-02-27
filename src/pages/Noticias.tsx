import PageLayout from "@/components/PageLayout";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { Calendar, Newspaper } from "lucide-react";

const noticias = [
  {
    title: "Inscrições abertas para o IX CONTEFFA 2026",
    date: "15 de março de 2026",
    summary: "As inscrições para o IX CONTEFFA 2026 já estão abertas. Garanta sua vaga e participe do maior congresso nacional.",
  },
  {
    title: "Programação preliminar divulgada",
    date: "01 de abril de 2026",
    summary: "Confira a programação preliminar com palestras, mesas redondas e workshops que acontecerão durante os cinco dias de evento.",
  },
  {
    title: "Prazo para submissão de teses se aproxima",
    date: "20 de maio de 2026",
    summary: "Os interessados em submeter teses para apresentação durante o congresso devem se inscrever até 30 de junho de 2026.",
  },
];

const Noticias = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="Notícias" subtitle="Fique por dentro das novidades do congresso" />

        <div className="space-y-6">
          {noticias.map((n, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                {n.date}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-primary shrink-0" />
                {n.title}
              </h3>
              <p className="text-muted-foreground">{n.summary}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  </PageLayout>
);

export default Noticias;
