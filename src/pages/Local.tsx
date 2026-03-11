import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Hotel, Plane, Bus, HelpCircle, Camera, X, ChevronLeft, ChevronRight, Info, ExternalLink, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const LocalPage = () => {
  const [config, setConfig] = useState({
    name: "Mar Hotel Conventions",
    address: "Rua Barão de Souza Leão, 451 - Boa Viagem, Recife - PE",
    contact: "(81) 3302-4444",
    website: "https://www.marhotel.com.br",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3949.7004562243865!2d-34.906957524109!3d-8.13194718141222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7ab1fcb08ad1401%3A0xd24bd3d576e3012a!2sMar%20Hotel%20Conventions!5e0!3m2!1spt-BR!2sbr!4v1773178155045!5m2!1spt-BR!2sbr",
    photos: [] as string[],
    attractions: [] as string[]
  });

  const [photoIndex, setPhotoIndex] = useState<{ type: 'hotel' | 'attraction', index: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase.from('config').select('value').eq('key', 'hotel_settings').maybeSingle();
        if (data && data.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          // Merge with explicit mapUrl in case DB is outdated/incorrect
          setConfig(prev => ({ ...prev, ...parsed, mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3949.7004562243865!2d-34.906957524109!3d-8.13194718141222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7ab1fcb08ad1401%3A0xd24bd3d576e3012a!2sMar%20Hotel%20Conventions!5e0!3m2!1spt-BR!2sbr!4v1773178155045!5m2!1spt-BR!2sbr" }));
        } else {
          const local = localStorage.getItem("conteffa_hotel");
          if (local) setConfig(JSON.parse(local));
        }
      } catch (e) {
        console.error("Error fetching local config", e);
      }
    };
    fetchData();
  }, []);

  const currentGallery = photoIndex?.type === 'hotel' ? config.photos : config.attractions;

  const handleNext = () => {
    if (photoIndex) {
      setPhotoIndex({ ...photoIndex, index: (photoIndex.index + 1) % currentGallery.length });
    }
  };

  const handlePrev = () => {
    if (photoIndex) {
      setPhotoIndex({ ...photoIndex, index: (photoIndex.index - 1 + currentGallery.length) % currentGallery.length });
    }
  };

  return (
    <PageLayout>
      <PageBanner title="LOCAL DO EVENTO" />
      <section className="section-padding bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none">
          <img src="/bg-logo.png" alt="" className="w-full h-full object-contain scale-150 rotate-12" />
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <SectionTitle
            label="HOSPEDAGEM E LOCALIZAÇÃO"
            title="Onde tudo acontece"
            subtitle="Confira os detalhes do local oficial do IX CONTEFFA e as belezas de Recife."
            centered={true}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
            {/* 1. Galeria do Hotel */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-[#122442] rounded-[3rem] overflow-hidden shadow-2xl h-full flex flex-col">
                <div
                  className="relative h-72 cursor-zoom-in overflow-hidden"
                  onClick={() => config.photos.length > 0 && setPhotoIndex({ type: 'hotel', index: 0 })}
                >
                  {config.photos.length > 0 ? (
                    <img src={config.photos[0]} alt="Hotel" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Hotel className="w-16 h-16 text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#122442] via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-primary/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5" /> Ver Galeria do Hotel
                    </div>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-heading font-black text-white mb-4 uppercase tracking-tighter">{config.name}</h3>
                  <div className="space-y-4 mb-8 text-white/60 text-sm">
                    <p className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary shrink-0" /> {config.address}
                    </p>
                    <p className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary shrink-0" /> {config.contact}
                    </p>
                  </div>
                  <div className="mt-auto pt-6 border-t border-white/5">
                    <a href={config.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group/link text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                      Visitar Site Oficial <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. Mapa */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-[#122442] rounded-[3rem] overflow-hidden shadow-2xl h-full flex flex-col p-4">
                <div className="flex-1 rounded-[2.5rem] overflow-hidden relative">
                  <iframe
                    src={config.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </motion.div>

            {/* 3. Atrações Turísticas */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group"
            >
              <div className="bg-[#122442] rounded-[3rem] overflow-hidden shadow-2xl h-full flex flex-col">
                <div
                  className="relative h-72 cursor-zoom-in overflow-hidden"
                  onClick={() => config.attractions.length > 0 && setPhotoIndex({ type: 'attraction', index: 0 })}
                >
                  {config.attractions.length > 0 ? (
                    <img src={config.attractions[0]} alt="Atrações" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Camera className="w-16 h-16 text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#122442] via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-primary/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5" /> Explorar Atrações
                    </div>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-heading font-black text-white mb-4 uppercase tracking-tighter">Descubra Pernambuco</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-8">
                    Recife e Olinda oferecem um mix inesquecível de história, praias paradisíacas e uma das gastronomias mais ricas do Brasil.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <span className="bg-white/5 text-[10px] font-bold text-white/40 px-3 py-1.5 rounded-full border border-white/5">Praia de Boa Viagem</span>
                    <span className="bg-white/5 text-[10px] font-bold text-white/40 px-3 py-1.5 rounded-full border border-white/5">Recife Antigo</span>
                    <span className="bg-white/5 text-[10px] font-bold text-white/40 px-3 py-1.5 rounded-full border border-white/5">Olinda</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {photoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0B1B32]/98 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
          >
            <div className="absolute top-8 right-8 flex gap-4 z-50">
              <span className="text-white/40 text-xs font-black uppercase tracking-widest self-center">
                {photoIndex.index + 1} / {currentGallery.length}
              </span>
              <Button
                onClick={() => setPhotoIndex(null)}
                variant="ghost"
                className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <Button
              onClick={handlePrev}
              variant="ghost"
              className="absolute left-4 md:left-8 rounded-full w-14 h-14 bg-primary hover:bg-primary/80 text-white z-50 shadow-xl transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <Button
              onClick={handleNext}
              variant="ghost"
              className="absolute right-4 md:left-auto md:right-8 rounded-full w-14 h-14 bg-primary hover:bg-primary/80 text-white z-50 shadow-xl transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>

            <motion.div
              key={photoIndex.index}
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src={currentGallery[photoIndex.index]}
                alt="View"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

const Atracoes = () => <LocalPage />;
const ComoChegar = () => <LocalPage />;
const Transfer = () => <LocalPage />;
const Hospedagem = () => <LocalPage />;
const Passagem = () => <LocalPage />;
const Apoio = () => <LocalPage />;

export { LocalPage, Atracoes, ComoChegar, Transfer, Hospedagem, Passagem, Apoio };
