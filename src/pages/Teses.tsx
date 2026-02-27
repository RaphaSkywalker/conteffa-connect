import PageLayout from "@/components/PageLayout";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { FileText, BookOpen, Eye } from "lucide-react";

const CadernoTeses = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="Caderno de Teses" subtitle="Publicação oficial com todas as teses do congresso" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-8 border border-border text-center">
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">O caderno de teses será publicado após o encerramento do prazo de submissão.</p>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

const RegulamentoTeses = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="Regulamento de Teses" subtitle="Regras para submissão de teses" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-8 border border-border">
          <FileText className="w-12 h-12 text-primary mb-4" />
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>O regulamento completo para submissão de teses será disponibilizado em breve. Os interessados devem observar os seguintes critérios gerais:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>As teses devem ser inéditas e relevantes para o tema do congresso.</li>
              <li>O prazo para submissão será divulgado na seção de notícias.</li>
              <li>Cada autor poderá submeter até 2 teses.</li>
              <li>As teses aprovadas serão apresentadas durante o congresso.</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

const VisualizarTeses = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="Visualizar Teses" subtitle="Teses submetidas para o IX CONTEFFA 2026" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-8 border border-border text-center">
          <Eye className="w-16 h-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma tese publicada ainda. As teses serão listadas aqui após a aprovação pela comissão organizadora.</p>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

export { CadernoTeses, RegulamentoTeses, VisualizarTeses };
