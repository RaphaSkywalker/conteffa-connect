import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarDays, Users, Mic, MapPin, FileText, ArrowRight } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import Countdown from "@/components/Countdown";
import SectionTitle from "@/components/SectionTitle";
import heroBg from "@/assets/hero-congress.jpg";
import { Button } from "@/components/ui/button";

const stats = [
  { icon: Users, value: "1.200+", label: "Inscritos" },
  { icon: Mic, value: "45", label: "Palestrantes" },
  { icon: CalendarDays, value: "5", label: "Dias de Evento" },
  { icon: FileText, value: "80+", label: "Teses" },
];

const highlights = [
  {
    icon: Mic,
    title: "Palestras de Alto Nível",
    description: "Especialistas renomados compartilhando conhecimentos e experiências.",
  },
  {
    icon: Users,
    title: "Networking Nacional",
    description: "Conecte-se com profissionais de todo o Brasil durante o congresso.",
  },
  {
    icon: FileText,
    title: "Apresentação de Teses",
    description: "Espaço para discussão e apresentação de trabalhos acadêmicos.",
  },
  {
    icon: MapPin,
    title: "Localização Privilegiada",
    description: "Evento realizado em um dos melhores centros de convenções do país.",
  },
];

const Index = () => {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--hero-overlay)/0.85)] via-[hsl(var(--hero-overlay)/0.7)] to-[hsl(var(--hero-overlay)/0.9)]" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-primary-foreground/70 text-sm md:text-base uppercase tracking-[0.3em] mb-4"
          >
            Congresso Nacional
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-4"
          >
            IX CONTEFFA 2026
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8"
          >
            Reunindo os maiores profissionais do país para discutir, debater e construir
            o futuro juntos. Cinco dias de imersão, conhecimento e transformação.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-2 mb-10"
          >
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <CalendarDays className="w-5 h-5" />
              <span className="font-medium">12 a 16 de novembro de 2026 — Início às 08:00</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center mb-12"
          >
            <Countdown />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Link to="/inscricao">
              <Button size="lg" className="text-lg px-10 py-6 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow">
                Inscreva-se no Congresso
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-16 z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-lg border border-border text-center"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="section-padding">
        <div className="container mx-auto">
          <SectionTitle
            title="Destaques do Evento"
            subtitle="O IX CONTEFFA 2026 oferece uma experiência completa para todos os participantes."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary section-padding">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Garanta sua vaga no IX CONTEFFA 2026
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8">
              Não perca a oportunidade de participar do maior congresso nacional.
              Vagas limitadas.
            </p>
            <Link to="/inscricao">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-10 py-6 rounded-full"
              >
                Fazer Inscrição
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
