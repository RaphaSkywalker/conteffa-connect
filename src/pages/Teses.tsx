import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { FileText, BookOpen, Download, ExternalLink, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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

const Teses = () => {
  const [regulamentos, setRegulamentos] = useState<any[]>([]);
  const [cadernos, setCadernos] = useState<any[]>([]);
  const [selectedCaderno, setSelectedCaderno] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: configData, error } = await supabase.from('config').select('*');
        
        if (configData) {
          const regs = configData.find((c: any) => c.key === 'regulamentos_data');
          if (regs && regs.value) {
            try {
              setRegulamentos(typeof regs.value === 'string' ? JSON.parse(regs.value) : regs.value);
            } catch (e) { console.error("Error parsing regulamentos", e); }
          }

          const cads = configData.find((c: any) => c.key === 'cadernos_data');
          if (cads && cads.value) {
            try {
              setCadernos(typeof cads.value === 'string' ? JSON.parse(cads.value) : cads.value);
            } catch (e) { console.error("Error parsing cadernos", e); }
          }
        }
      } catch (err) {
        console.error("Erro ao buscar documentos:", err);
      }
    };

    fetchData();
  }, []);

  // Lista de Regulamentos: Padrões + Novos do Banco
  const allRegConteffas = [...defaultConteffas];
  regulamentos.forEach(r => {
    if (!allRegConteffas.find(def => def.name === r.name || (r.name.includes(def.name) && def.name.length > 5))) {
      allRegConteffas.unshift({ id: r.id?.toString() || Date.now().toString(), name: r.name });
    }
  });

  // Lista de Cadernos: Padrões + Novos do Banco
  const allCadConteffas = [...defaultConteffas];
  cadernos.forEach(c => {
    if (!allCadConteffas.find(def => def.name === c.name || (c.name.includes(def.name) && def.name.length > 5))) {
      allCadConteffas.unshift({ id: c.id?.toString() || Date.now().toString(), name: c.name });
    }
  });

  const getRegulamento = (name: string) => {
    return regulamentos.find(r => r.name === name || (r.name.includes(name) && name.length > 5));
  };

  const getCaderno = (name: string) => {
    return cadernos.find(c => c.name === name || (c.name.includes(name) && name.length > 5));
  };

  return (
    <PageLayout>
      <PageBanner title="TESES DO CONGRESSO" />
      
      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-6xl space-y-24">
          
          {/* Regulamento Section */}
          <div>
            <SectionTitle title="Regulamento" subtitle="Selecione o regulamento desejado para download" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRegConteffas.map((conteffa, idx) => {
                const reg = getRegulamento(conteffa.name);
                const hasFile = reg && reg.fileUrl;

                return (
                  <motion.div 
                    key={`reg-${conteffa.id}-${idx}`}
                    initial={{ opacity: 0, scale: 0.95 }} 
                    whileInView={{ opacity: 1, scale: 1 }} 
                    viewport={{ once: true }} 
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-card rounded-2xl p-8 border border-border shadow-lg flex flex-col items-center text-center transition-all group ${hasFile ? 'hover:-translate-y-2 border-primary/20 bg-primary/5' : ''}`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${hasFile ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-heading font-black text-foreground mb-2">{conteffa.name}</h3>
                    
                    {hasFile ? (
                      <div className="space-y-4">
                        <p className="text-primary font-bold text-sm flex items-center justify-center gap-1">
                          <Download className="w-4 h-4" /> Regulamento Disponível
                        </p>
                        <a 
                          href={reg.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg"
                        >
                          Abrir PDF <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">Download do PDF em breve.</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Caderno de Teses Section */}
          <div>
            <SectionTitle title="Cadernos de Teses" subtitle="Explore as publicações oficiais compilações de todas as teses" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCadConteffas.map((conteffa, idx) => {
                const caderno = getCaderno(conteffa.name);
                const hasItems = caderno && caderno.items && caderno.items.length > 0;

                return (
                  <motion.div 
                    key={`cad-${conteffa.id}-${idx}`}
                    initial={{ opacity: 0, scale: 0.95 }} 
                    whileInView={{ opacity: 1, scale: 1 }} 
                    viewport={{ once: true }} 
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-card rounded-2xl p-8 border border-border shadow-lg flex flex-col items-center text-center transition-all group ${hasItems ? 'hover:-translate-y-2 border-secondary/20 bg-secondary/5' : ''}`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${hasItems ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary'}`}>
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-heading font-black text-foreground mb-2">{conteffa.name}</h3>
                    
                    {hasItems ? (
                      <div className="space-y-4">
                        <p className="text-secondary font-bold text-sm">
                          {caderno.items.length} Teses Publicadas
                        </p>
                        <button 
                          className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-secondary/90 transition-colors shadow-lg"
                          onClick={() => {
                            setSelectedCaderno(caderno);
                            setIsViewerOpen(true);
                          }}
                        >
                          Ver Teses <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">Teses publicadas em breve.</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Visualizador de Teses */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl bg-card border-border shadow-2xl p-0 overflow-hidden rounded-[2rem]">
          <div className="p-8 border-b border-border bg-secondary/5">
            <DialogTitle className="text-2xl font-heading font-black text-foreground flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-secondary" />
              {selectedCaderno?.name} - Caderno de Teses
            </DialogTitle>
          </div>
          
          <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
            {selectedCaderno?.items && selectedCaderno.items.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {selectedCaderno.items.map((tese: any, idx: number) => (
                  <div key={idx} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-background border border-border rounded-2xl hover:border-secondary transition-all group">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-heading font-bold text-lg text-foreground group-hover:text-secondary transition-colors uppercase">{tese.title}</h4>
                      <p className="text-sm text-muted-foreground font-medium">Autor(es): {tese.author}</p>
                    </div>
                    {tese.fileUrl ? (
                      <a 
                        href={tese.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 md:mt-0 flex items-center gap-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        <Download className="w-4 h-4" /> Abrir PDF
                      </a>
                    ) : (
                      <span className="mt-4 md:mt-0 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">PDF em breve</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground italic">Nenhuma tese vinculada a este caderno.</p>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsViewerOpen(false)}
              className="rounded-full px-8 border-slate-200"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Teses;

