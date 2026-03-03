import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Calendar, MapPin, ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Galeria = () => {
  const [albuns, setAlbuns] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchAlbuns = async () => {
      try {
        const { data, error } = await supabase.from('albums').select('*').order('id', { ascending: false });
        if (data && data.length > 0) {
          setAlbuns(data);
        } else {
          loadDefaults();
        }
      } catch (err) {
        console.error("Failed to fetch albums from Supabase", err);
        loadDefaults();
      }
    };

    const loadDefaults = () => {
      const saved = localStorage.getItem("conteffa_albuns");
      if (saved) {
        const parsed = JSON.parse(saved);
        setAlbuns([...parsed].sort((a: any, b: any) => (b.id || 0) - (a.id || 0)));
      }
    };

    fetchAlbuns();
  }, []);

  const photosToDisplay = selectedAlbum?.photos?.length > 0
    ? selectedAlbum.photos
    : Array.from({ length: selectedAlbum?.count || 0 }).map((_, i) =>
      `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=1200&q=80`
    );

  const handleNext = () => {
    if (photoIndex !== null) {
      setPhotoIndex((photoIndex + 1) % photosToDisplay.length);
    }
  };

  const handlePrev = () => {
    if (photoIndex !== null) {
      setPhotoIndex((photoIndex - 1 + photosToDisplay.length) % photosToDisplay.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (photoIndex === null) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setPhotoIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photoIndex]);

  return (
    <PageLayout>
      <PageBanner title="GALERIA DE FOTOS" />
      <section className="section-padding min-h-[60vh]">
        <div className="container mx-auto px-4 max-w-7xl">
          <AnimatePresence mode="wait">
            {!selectedAlbum ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <SectionTitle
                  label="REGISTROS"
                  title="Momentos e Memórias"
                  subtitle="Fotos dos congressos anteriores e registros do IX CONTEFFA 2026"
                />

                {albuns.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {albuns.map((album) => (
                      <motion.div
                        key={album.id}
                        whileHover={{ y: -10 }}
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 cursor-pointer"
                        onClick={() => setSelectedAlbum(album)}
                      >
                        <div className="h-64 bg-slate-100 relative overflow-hidden">
                          {album.cover ? (
                            <img
                              src={album.cover}
                              alt={album.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-16 h-16 text-slate-300" />
                            </div>
                          )}
                          <div className="absolute top-6 left-6">
                            <span className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-tighter shadow-lg">
                              {(album.photos?.length || album.count || 0)} FOTOS
                            </span>
                          </div>
                        </div>
                        <div className="p-8">
                          <h4 className="font-heading font-black text-2xl text-[#0B1B32] mb-4 leading-tight group-hover:text-primary transition-colors">
                            {album.title}
                          </h4>
                          <div className="space-y-2">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" /> {album.date}
                            </p>
                            {album.location && (
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> {album.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
                    <ImageIcon className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-heading font-black text-[#0B1B32] mb-2">Nenhum álbum encontrado</h3>
                    <p className="text-slate-500 max-w-md mx-auto">As fotos estão sendo processadas e serão publicadas em breve pela nossa equipe.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div className="flex items-center gap-6">
                    <Button
                      onClick={() => setSelectedAlbum(null)}
                      variant="outline"
                      className="rounded-full w-14 h-14 p-0 shrink-0 border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-heading font-black text-[#0B1B32] mb-2">{selectedAlbum.title}</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-4">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedAlbum.date}</span>
                        {selectedAlbum.location && <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {selectedAlbum.location}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {photosToDisplay.map((photo: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="aspect-square rounded-3xl bg-slate-100 overflow-hidden group relative cursor-zoom-in shadow-md"
                      onClick={() => setPhotoIndex(i)}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500">
                          <img src="/bg-logo.png" alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Light-box Modal */}
          <AnimatePresence>
            {photoIndex !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-[#0B1B32]/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
              >
                <div className="absolute top-8 right-8 flex gap-4 z-50">
                  <span className="text-white/40 text-xs font-black uppercase tracking-widest self-center">
                    {photoIndex + 1} / {photosToDisplay.length}
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
                  className="absolute left-4 md:left-8 rounded-full w-14 h-14 bg-white/5 hover:bg-white/20 text-white z-50"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>

                <Button
                  onClick={handleNext}
                  variant="ghost"
                  className="absolute right-4 md:right-8 rounded-full w-14 h-14 bg-white/5 hover:bg-white/20 text-white z-50"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>

                <motion.div
                  key={photoIndex}
                  initial={{ opacity: 0, scale: 0.9, x: 50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -50 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <img
                    src={photosToDisplay[photoIndex]}
                    alt="Full View"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl selection:bg-transparent"
                  />
                </motion.div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white/60 text-xs font-bold uppercase tracking-[0.2em]">
                  {selectedAlbum.title}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageLayout>
  );
};

export default Galeria;
