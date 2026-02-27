import PageLayout from "@/components/PageLayout";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const Indicativos = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="Indicativos" subtitle="Documentos e orientações oficiais do congresso" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-8 border border-border text-center">
          <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Os indicativos aprovados pelo congresso serão publicados nesta seção.</p>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

export default Indicativos;
