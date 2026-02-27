import PageLayout from "@/components/PageLayout";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { MapPin, Hotel, Plane, Bus, HelpCircle, Camera } from "lucide-react";

const SubPage = ({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: any; children: React.ReactNode }) => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title={title} subtitle={subtitle} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {children}
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

const LocalPage = () => (
  <SubPage title="Local do Evento" subtitle="Informações sobre o local de realização do IX CONTEFFA 2026" icon={MapPin}>
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold mb-2 text-foreground">Centro de Convenções</h3>
        <p className="text-muted-foreground mb-4">Brasília - DF. Endereço completo será divulgado em breve.</p>
        <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
          <MapPin className="w-12 h-12 text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Mapa será integrado em breve</span>
        </div>
      </div>
    </div>
  </SubPage>
);

const Atracoes = () => (
  <SubPage title="Atrações Turísticas" subtitle="Conheça os pontos turísticos da cidade" icon={Camera}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {["Catedral de Brasília", "Congresso Nacional", "Praça dos Três Poderes", "Ponte JK"].map((a, i) => (
        <div key={i} className="bg-card rounded-xl p-5 border border-border">
          <Camera className="w-6 h-6 text-primary mb-2" />
          <h4 className="font-semibold text-foreground">{a}</h4>
          <p className="text-sm text-muted-foreground mt-1">Informações detalhadas em breve.</p>
        </div>
      ))}
    </div>
  </SubPage>
);

const ComoChegar = () => (
  <SubPage title="Como Chegar" subtitle="Informações de acesso ao evento" icon={MapPin}>
    <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground leading-relaxed">
      <p>Informações detalhadas sobre como chegar ao local do evento serão publicadas em breve, incluindo rotas de carro, transporte público e orientações gerais.</p>
    </div>
  </SubPage>
);

const Transfer = () => (
  <SubPage title="Empresas de Transfer" subtitle="Transporte do aeroporto ao hotel e evento" icon={Bus}>
    <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground">
      <p>Lista de empresas de transfer credenciadas será divulgada em breve.</p>
    </div>
  </SubPage>
);

const Hospedagem = () => (
  <SubPage title="Hospedagem" subtitle="Hotéis recomendados próximos ao evento" icon={Hotel}>
    <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground">
      <p>Lista de hotéis conveniados com preços especiais para participantes do congresso será divulgada em breve.</p>
    </div>
  </SubPage>
);

const Passagem = () => (
  <SubPage title="Passagem Aérea" subtitle="Informações sobre voos e passagens" icon={Plane}>
    <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground">
      <p>Informações sobre passagens aéreas e parcerias com companhias serão divulgadas em breve.</p>
    </div>
  </SubPage>
);

const Apoio = () => (
  <SubPage title="Serviço de Apoio" subtitle="Serviços úteis para os participantes" icon={HelpCircle}>
    <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground">
      <p>Informações sobre serviços de apoio, como alimentação, farmácias e emergências, serão publicadas em breve.</p>
    </div>
  </SubPage>
);

export { LocalPage, Atracoes, ComoChegar, Transfer, Hospedagem, Passagem, Apoio };
