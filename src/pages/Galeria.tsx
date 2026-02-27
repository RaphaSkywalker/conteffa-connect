import PageLayout from "@/components/PageLayout";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { Image } from "lucide-react";

const Galeria = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-5xl">
        <SectionTitle title="Galeria" subtitle="Fotos e vídeos dos congressos anteriores e do IX CONTEFFA 2026" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-xl font-semibold mb-6 text-foreground">IX CONTEFFA 2026</h3>
          <div className="bg-muted rounded-xl p-12 text-center mb-12">
            <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Galeria em breve. As fotos serão publicadas durante e após o evento.</p>
          </div>

          <h3 className="text-xl font-semibold mb-6 text-foreground">Congressos Anteriores</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                <Image className="w-8 h-8 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

export default Galeria;
