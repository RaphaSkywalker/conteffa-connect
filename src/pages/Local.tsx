import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Hotel, Plane, Bus, HelpCircle, Camera, X, ChevronLeft, ChevronRight, Info, ExternalLink, Phone, CreditCard, Users, Globe, List, CheckCircle2, Ticket, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const LocalPage = () => {
  const [config, setConfig] = useState({
    hotel: {
      name: "Mar Hotel Conventions",
      address: "Rua Barão de Souza Leão, 451 - Boa Viagem, Recife - PE",
      contact: "(81) 3302-4444",
      website: "https://www.marhotel.com.br",
      cover: "",
      gallery: [] as string[]
    },
    maps: {
      url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3949.7004562243865!2d-34.906957524109!3d-8.13194718141222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7ab1fcb08ad1401%3A0xd24bd3d576e3012a!2sMar%20Hotel%20Conventions!5e0!3m2!1spt-BR!2sbr!4v1773178155045!5m2!1spt-BR!2sbr"
    },
    discovery: {
      name: "Descubra Pernambuco",
      description: "Recife e Olinda oferecem um mix inesquecível de história, praias paradisíacas e uma das gastronomias mais ricas do Brasil.",
      cover: "",
      gallery: [] as string[]
    }
  });

  const [photoIndex, setPhotoIndex] = useState<{ type: 'hotel' | 'attraction', index: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from system albums (shares=99001 for hotel, shares=99002 for discovery)
        const { data: albumData } = await supabase.from('albums').select('*').in('shares', [99001, 99002]);
        
        if (albumData && albumData.length > 0) {
          const hotelAlbum = albumData.find((a: any) => a.shares === 99001);
          const discoveryAlbum = albumData.find((a: any) => a.shares === 99002);
          
          const merged = {
            hotel: hotelAlbum ? {
              name: hotelAlbum.title || config.hotel.name,
              address: hotelAlbum.date || config.hotel.address,
              contact: hotelAlbum.location || config.hotel.contact,
              cover: hotelAlbum.cover || config.hotel.cover,
              gallery: hotelAlbum.photos || config.hotel.gallery,
              website: config.hotel.website
            } : config.hotel,
            maps: discoveryAlbum ? {
              url: discoveryAlbum.location || config.maps.url
            } : config.maps,
            discovery: discoveryAlbum ? {
              name: discoveryAlbum.title || config.discovery.name,
              description: discoveryAlbum.date || config.discovery.description,
              cover: discoveryAlbum.cover || config.discovery.cover,
              gallery: discoveryAlbum.photos || config.discovery.gallery
            } : config.discovery
          };
          setConfig(merged);
        } else {
          // Fallback to legacy config table if system albums don't exist yet
          const { data } = await supabase.from('config').select('value').eq('key', 'hotel_settings').maybeSingle();
          if (data && data.value) {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (parsed.hotel) {
              setConfig({
                hotel: { ...config.hotel, ...parsed.hotel },
                maps: { ...config.maps, ...(parsed.maps || {}) },
                discovery: { ...config.discovery, ...(parsed.discovery || {}) }
              });
            } else {
              setConfig(prev => ({
                ...prev,
                hotel: {
                  ...prev.hotel,
                  name: parsed.name || prev.hotel.name,
                  address: parsed.address || prev.hotel.address,
                  contact: parsed.contact || prev.hotel.contact,
                  website: parsed.website || prev.hotel.website,
                  gallery: parsed.photos || prev.hotel.gallery
                }
              }));
            }
          }
        }
      } catch (e) {
        console.error("Error fetching local config", e);
      }
    };
    fetchData();
  }, []);

  const currentGallery = photoIndex?.type === 'hotel' ? config.hotel.gallery : config.discovery.gallery;

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
                  onClick={() => (config.hotel.cover || config.hotel.gallery.length > 0) && setPhotoIndex({ type: 'hotel', index: 0 })}
                >
                  {(config.hotel.cover || config.hotel.gallery.length > 0) ? (
                    <img src={config.hotel.cover || config.hotel.gallery[0]} alt="Hotel" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                  <h3 className="text-2xl font-heading font-black text-white mb-4 uppercase tracking-tighter">{config.hotel.name}</h3>
                  <div className="space-y-4 mb-8 text-white/60 text-sm">
                    <p className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary shrink-0" /> {config.hotel.address}
                    </p>
                    <p className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary shrink-0" /> {config.hotel.contact}
                    </p>
                  </div>
                  <div className="mt-auto pt-6 border-t border-white/5">
                    <a href={config.hotel.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group/link text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
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
                    src={config.maps.url}
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
                  onClick={() => (config.discovery.cover || config.discovery.gallery.length > 0) && setPhotoIndex({ type: 'attraction', index: 0 })}
                >
                  {(config.discovery.cover || config.discovery.gallery.length > 0) ? (
                    <img src={config.discovery.cover || config.discovery.gallery[0]} alt="Atrações" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                  <h3 className="text-2xl font-heading font-black text-white mb-4 uppercase tracking-tighter">{config.discovery.name}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-8">
                    {config.discovery.description}
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

          <div className="mt-12 pt-12 border-t border-border/30">
            <SectionTitle
              label="ACOMODAÇÕES"
              title="Hospedagem"
              subtitle="Mar Hotel Conventions"
              centered={true}
            />

            {/* Informações de Hospedagem */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[3rem] border border-border/50 card-shadow overflow-hidden max-w-5xl mx-auto mt-8"
            >
              <div className="bg-navy p-8 md:p-12 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-primary/30 inline-block mb-4">
                      Tarifa Especial IX CONTEFFA
                    </span>
                    <h4 className="text-2xl md:text-4xl font-heading font-black leading-tight uppercase">
                      Orientações para Hospedagem
                    </h4>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4 group hover:bg-primary/20 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-1">Valor por Apartamento</p>
                      <p className="text-2xl font-black text-white leading-none">R$ 500,00</p>
                      <p className="text-[10px] font-bold text-white/40 mt-1 uppercase">+ 5% de taxa de serviço</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-12 text-foreground">
                {/* 1. Acomodações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Hotel className="w-5 h-5 text-primary" />
                      </div>
                      <h5 className="text-xl font-heading font-black text-navy uppercase tracking-tight">Acomodações Disponíveis</h5>
                    </div>
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary/30 transition-colors">
                        <p className="font-heading font-bold text-navy">Classic (Duas camas de solteiro)</p>
                        <p className="text-sm text-muted-foreground mt-1">Valor: R$ 500,00 + R$ 25,00 (5% taxa)</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary/30 transition-colors">
                        <p className="font-heading font-bold text-navy">Classic (Casal)</p>
                        <p className="text-sm text-muted-foreground mt-1">Valor: R$ 500,00 + 5% de taxa de serviço</p>
                      </div>
                      <div className="flex items-center gap-2 text-primary bg-primary/5 p-4 rounded-xl">
                        <CreditCard className="w-4 h-4" />
                        <p className="text-xs font-bold uppercase tracking-wide">Parcelamento em até 6x no cartão de crédito</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <h5 className="text-xl font-heading font-black text-navy uppercase tracking-tight">Datas de Validade</h5>
                    </div>
                    <div className="bg-navy p-6 rounded-2xl text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-bl-full opacity-50" />
                      <p className="text-sm text-white/70 mb-4 leading-relaxed relative z-10">
                        Tarifas promocionais disponíveis de <strong className="text-white">12 a 15 de novembro de 2026</strong>.
                      </p>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-[11px] leading-relaxed relative z-10">
                        <p className="font-black text-primary uppercase mb-1 tracking-widest">Extensão da Estadia:</p>
                        Para quem desejar ampliar a estadia, o valor especial poderá ser aplicado entre <strong className="text-white">11 e 17 de novembro de 2026</strong>.
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-border/30" />

                {/* 2. Como realizar a reserva */}
                <div className="space-y-8">
                  <div className="text-center max-w-2xl mx-auto space-y-3">
                    <h5 className="text-2xl font-heading font-black text-navy uppercase">Como realizar a reserva</h5>
                    <p className="text-muted-foreground text-sm font-medium">Escolha uma das duas formas oficiais abaixo para garantir sua vaga.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 border border-border/50 p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:bg-white hover:border-primary/30 transition-all duration-300">
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                      <h6 className="text-lg font-heading font-black text-navy uppercase mb-3 text-center">1. Reserva em Grupo (via ATEFFA)</h6>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                        Organizadas pelas ATEFFAs Estaduais. O associado deve procurar sua representação estadual vinculada para solicitar a inclusão na reserva.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-border/50 p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:bg-white hover:border-primary/30 transition-all duration-300">
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Globe className="w-8 h-8 text-primary" />
                      </div>
                      <h6 className="text-lg font-heading font-black text-navy uppercase mb-3 text-center">2. Reserva Individual (via Hotel)</h6>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                        Utilize o código promocional disponibilizado pela ANTEFFA diretamente no site oficial do Mar Hotel Conventions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Passo a Passo */}
                <div className="bg-slate-50 rounded-[3rem] p-8 md:p-10 border border-border/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                        <List className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h6 className="text-xl font-heading font-black text-navy uppercase tracking-tight">Passo a passo - Booking Individual</h6>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Siga as instruções exatas abaixo</p>
                      </div>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-2xl border border-primary/20 shadow-sm flex flex-col items-center text-center">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Código Promocional</span>
                      <span className="text-2xl font-heading font-black text-navy tracking-widest lowercase">anteffa2026</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 md:grid-flow-col md:grid-rows-5 gap-x-12 gap-y-4 text-navy/80">
                    {[
                      { step: <>Acesse: <a href="https://marhotel.com.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">marhotel.com.br</a></>, id: 1 },
                      { step: "No rodapé procure “Faça sua Reserva”", id: 2 },
                      { step: "Informe o período e hóspedes", id: 3 },
                      { step: "Clique em Buscar", id: 4 },
                      { step: "No espaço TENHO UM CÓDIGO, insira anteffa2026", id: 5 },
                      { step: "Clique em BUSCAR novamente", id: 6 },
                      { step: "Acesse as opções Classic (Cama de Solteiro ou Casal)", id: 7 },
                      { step: "Clique em “ESCOLHER”", id: 8 },
                      { step: "Clique em “RESERVA AGORA”", id: 9 },
                      { step: "Escolha o pagamento e finalize a RESERVA", id: 10 }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-3 hover:bg-white rounded-xl transition-colors">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 font-heading">
                          {item.id}
                        </span>
                        <p className="text-sm font-medium">
                          {typeof item.step === 'string' 
                            ? item.step.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-navy">{part}</strong> : part)
                            : item.step
                          }
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-muted-foreground font-medium text-center md:text-left italic">
                      "TFFAs de todo o Brasil: reservem a data e preparem-se para este encontro histórico!"
                    </p>
                    <div className="flex gap-2">
                      <span className="text-[9px] font-bold bg-navy/5 text-navy/40 px-3 py-1 rounded-full">#ANTEFFA</span>
                      <span className="text-[9px] font-bold bg-navy/5 text-navy/40 px-3 py-1 rounded-full">#IXCONTEFFA</span>
                      <span className="text-[9px] font-bold bg-navy/5 text-navy/40 px-3 py-1 rounded-full">#TFFA</span>
                    </div>
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
