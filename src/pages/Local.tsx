import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { MapPin, Hotel, Plane, Bus, HelpCircle, Camera } from "lucide-react";

const SubPage = ({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: any; children: React.ReactNode }) => (
  <PageLayout>
    <PageBanner title={title.toUpperCase()} />
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
        <h3 className="text-lg font-semibold mb-2 text-foreground">Mar Hotel Conventions</h3>
        <p className="text-muted-foreground mb-4">Recife - PE. O evento será realizado no renomado Mar Hotel, localizado no bairro de Boa Viagem.</p>
        <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
          <MapPin className="w-12 h-12 text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Rua Barão de Souza Leão, 451 - Boa Viagem, Recife - PE</span>
        </div>
      </div>
    </div>
  </SubPage>
);

const Atracoes = () => (
  <SubPage title="Atrações Turísticas" subtitle="Conheça os encantos de Recife e Olinda" icon={Camera}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {["Praia de Boa Viagem", "Recife Antigo", "Instituto Ricardo Brennand", "Olinda (Patrimônio Histórico)"].map((a, i) => (
        <div key={i} className="bg-card rounded-xl p-5 border border-border">
          <Camera className="w-6 h-6 text-primary mb-2" />
          <h4 className="font-semibold text-foreground">{a}</h4>
          <p className="text-sm text-muted-foreground mt-1">Explore a cultura e as belezas naturais de Pernambuco.</p>
        </div>
      ))}
    </div>
  </SubPage>
);

const ComoChegar = () => (
  <SubPage title="Como Chegar" subtitle="Informações de acesso ao evento" icon={MapPin}>
    <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground leading-relaxed">
      <p>O Mar Hotel Conventions fica a apenas 5 minutos do Aeroporto Internacional do Recife (Guararapes), facilitando o acesso para participantes de todo o Brasil.</p>
    </div>
  </SubPage>
);

const Transfer = () => (
  <SubPage title="Empresas de Transfer" subtitle="Transporte do aeroporto ao hotel e evento" icon={Bus}>
    <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground">
      <p>O trajeto aeroporto-hotel é curto e pode ser feito facilmente por táxi ou aplicativos de transporte disponíveis no desembarque.</p>
    </div>
  </SubPage>
);

const Hospedagem = () => (
  <SubPage title="Hospedagem" subtitle="Hotel oficial e parcerias" icon={Hotel}>
    <div className="bg-card rounded-xl p-6 border border-border text-muted-foreground">
      <p className="mb-4">O <strong>Mar Hotel Conventions</strong> é o local oficial do evento. Utilize o cupom de desconto exclusivo para participantes.</p>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-primary">
        <p className="font-bold text-sm uppercase tracking-wider">Código Promocional:</p>
        <p className="text-2xl font-black">anteffa2026</p>
        <p className="text-xs mt-2 italic">* Validade para o período de 11 a 17 de novembro de 2026.</p>
      </div>
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
