import PageLayout from "@/components/PageLayout";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { User } from "lucide-react";

const CartaPresidente = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="Carta do Presidente" subtitle="Mensagem de abertura do IX CONTEFFA 2026" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-48 h-48 rounded-2xl bg-muted flex items-center justify-center shrink-0 mx-auto md:mx-0">
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
          <div className="prose max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Prezados colegas e participantes, é com imensa satisfação que convido todos para o IX CONTEFFA 2026. Este congresso representa um marco na nossa história, reunindo os melhores profissionais para debates, teses e discussões que moldarão o futuro da nossa categoria.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Ao longo de cinco dias intensos de programação, teremos a oportunidade de trocar experiências, apresentar trabalhos e construir caminhos para os desafios que se apresentam.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Contamos com a presença de todos. Juntos, somos mais fortes.
            </p>
            <p className="mt-6 font-semibold text-foreground">Presidente do CONTEFFA</p>
          </div>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

const Historico = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="Histórico" subtitle="A trajetória do CONTEFFA ao longo dos anos" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-muted-foreground leading-relaxed">
          <p>O CONTEFFA é um dos congressos mais tradicionais e relevantes do cenário nacional. Desde sua primeira edição, o evento tem reunido milhares de profissionais para debater os rumos da profissão.</p>
          <p>Com oito edições realizadas com sucesso, o congresso se consolidou como referência em discussões técnicas, acadêmicas e de representação profissional.</p>
          <p>O IX CONTEFFA 2026 promete ser a maior e mais impactante edição, com uma programação ainda mais completa e diversificada.</p>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

const Evento = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="O Evento" subtitle="Conheça o IX CONTEFFA 2026" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-muted-foreground leading-relaxed">
          <p>O IX CONTEFFA 2026 será realizado de 12 a 16 de novembro de 2026, reunindo profissionais de todo o Brasil em cinco dias de palestras, debates, apresentações de teses e atividades de integração.</p>
          <p>O evento contará com mais de 45 palestrantes confirmados, mesas redondas, workshops e espaços para networking, proporcionando uma experiência completa para todos os participantes.</p>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

const Regimento = () => (
  <PageLayout>
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle title="Regimento do Congresso" subtitle="Normas e regulamentos do IX CONTEFFA 2026" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-muted rounded-xl p-8 text-muted-foreground leading-relaxed">
          <p>O regimento completo do IX CONTEFFA 2026 será disponibilizado em breve. Fique atento às atualizações.</p>
        </motion.div>
      </div>
    </section>
  </PageLayout>
);

export { CartaPresidente, Historico, Evento, Regimento };
