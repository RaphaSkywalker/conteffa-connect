import { useState } from "react";
import PageLayout from "@/components/PageLayout";
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
        <section className="section-padding min-h-[60vh] flex items-center">
          <div className="container mx-auto max-w-md text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle className="w-20 h-20 text-primary mx-auto mb-6" />
            </motion.div>
            <h2 className="text-2xl font-display font-bold mb-4 text-foreground">Mensagem Enviada!</h2>
            <p className="text-muted-foreground">Agradecemos seu contato. Responderemos o mais breve possível.</p>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="section-padding">
        <div className="container mx-auto max-w-5xl">
          <SectionTitle title="Contato" subtitle="Entre em contato com a organização do congresso" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5 bg-card rounded-xl p-8 border border-border"
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
                <Button type="submit" size="lg" className="w-full rounded-lg">
                  <Send className="w-4 h-4 mr-2" /> Enviar Mensagem
                </Button>
              </motion.form>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
              {[
                { icon: Mail, label: "Email", value: "contato@conteffa.org.br" },
                { icon: Phone, label: "Telefone", value: "(61) 3333-0000" },
                { icon: MapPin, label: "Endereço", value: "Brasília - DF" },
              ].map((item) => (
                <div key={item.label} className="bg-card rounded-xl p-5 border border-border">
                  <item.icon className="w-6 h-6 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contato;
