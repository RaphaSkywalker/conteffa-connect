import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { FileText, BookOpen, Eye } from "lucide-react";

const defaultConteffas = [
  { id: "9", name: "IX CONTEFFA" },
  { id: "8", name: "VIII CONTEFFA" },
  { id: "7", name: "VII CONTEFFA" },
  { id: "6", name: "VI CONTEFFA" },
  { id: "5", name: "V CONTEFFA" },
  { id: "4", name: "IV CONTEFFA" },
  { id: "3", name: "III CONTEFFA" },
  { id: "2", name: "II CONTEFFA" },
  { id: "1", name: "I CONTEFFA" },
];

const Teses = () => (
  <PageLayout>
    <PageBanner title="TESES DO CONGRESSO" />
    
    <section className="section-padding bg-background">
      <div className="container mx-auto max-w-6xl space-y-24">
        
        {/* Regulamento Section */}
        <div>
          <SectionTitle title="Regulamento" subtitle="Selecione o regulamento desejado para download" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultConteffas.map((conteffa, idx) => (
              <motion.div 
                key={`reg-${conteffa.id}`}
                initial={{ opacity: 0, scale: 0.95 }} 
                whileInView={{ opacity: 1, scale: 1 }} 
                viewport={{ once: true }} 
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl p-8 border border-border shadow-lg flex flex-col items-center text-center hover:-translate-y-1 transition-transform group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <FileText className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-heading font-black text-foreground mb-2">{conteffa.name}</h3>
                <p className="text-muted-foreground text-sm">Download do PDF em breve.</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Caderno de Teses Section */}
        <div>
          <SectionTitle title="Cadernos de Teses" subtitle="Explore as publicações oficiais compilações de todas as teses" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultConteffas.map((conteffa, idx) => (
              <motion.div 
                key={`cad-${conteffa.id}`}
                initial={{ opacity: 0, scale: 0.95 }} 
                whileInView={{ opacity: 1, scale: 1 }} 
                viewport={{ once: true }} 
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl p-8 border border-border shadow-lg flex flex-col items-center text-center hover:-translate-y-1 transition-transform group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <BookOpen className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-heading font-black text-foreground mb-2">{conteffa.name}</h3>
                <p className="text-muted-foreground text-sm">Teses publicadas em breve.</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  </PageLayout>
);

export default Teses;
