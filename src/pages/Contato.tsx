import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

const Contato = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", assunto: "", mensagem: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.mensagem) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    setSent(true);
    toast.success("Mensagem enviada com sucesso!");
  };

  if (sent) {
    return (
      <PageLayout>
        <PageBanner title="CONTATO" />
        <section className="section-padding min-h-[60vh] flex items-center">
          <div className="container mx-auto max-w-md text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle className="w-20 h-20 text-primary mx-auto mb-6" />
            </motion.div>
            <h2 className="text-2xl font-heading font-bold mb-4 text-foreground">Mensagem Enviada!</h2>
            <p className="text-muted-foreground">Agradecemos seu contato. Responderemos o mais breve possível.</p>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageBanner title="CONTATO" />
      <section className="section-padding">
        <div className="container mx-auto max-w-5xl">
          <SectionTitle title="Contato" subtitle="Entre em contato com a organização do congresso" />

          {/* Info Boxes Top */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Mail, label: "Email", value: "congresso@anteffa.org.br" },
              { icon: Phone, label: "Telefone", value: "(61) 3051-4545" },
              { icon: MapPin, label: "Endereço", value: "SHN – QD 02, BL J SL 09 - 21\nED. Garvey Park Hotel  - DF" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border flex flex-col items-center text-center shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{item.label}</p>
                <p className="font-bold text-foreground whitespace-pre-line">{item.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Form & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div>
              <motion.form
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5 bg-card rounded-[2rem] p-8 border border-border shadow-sm h-full"
              >
                <div>
                  <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
                  <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input id="assunto" value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="mensagem">Mensagem <span className="text-destructive">*</span></Label>
                  <Textarea id="mensagem" rows={5} value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} required />
                </div>
                <Button type="submit" size="lg" className="w-full rounded-xl">
                  <Send className="w-4 h-4 mr-2" /> Enviar Mensagem
                </Button>
              </motion.form>
            </div>

            {/* Google Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-[2rem] border border-border shadow-sm h-[400px] lg:h-auto min-h-[400px] p-[10px] flex"
            >
              <div className="w-full h-full rounded-[1.4rem] overflow-hidden relative bg-muted flex-1">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3839.2273634812363!2d-47.889161!3d-15.78997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935a333ad308f069%3A0xec35ed95afcde040!2sAssocia%C3%A7ao%20Nacional%20dos%20T%C3%A9cnicos%20de%20Fiscaliza%C3%A7%C3%A3o%20Federal%20Agropecu%C3%A1ria!5e0!3m2!1sen!2sbr!4v1708940000000!5m2!1sen!2sbr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contato;
