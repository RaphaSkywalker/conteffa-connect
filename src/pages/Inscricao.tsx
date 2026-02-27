import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import SectionTitle from "@/components/SectionTitle";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

const Inscricao = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    profissao: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    // In a real app, this would send to a database
    setSubmitted(true);
    toast.success("Inscrição realizada com sucesso!");
  };

  if (submitted) {
    return (
      <PageLayout>
        <section className="section-padding min-h-[60vh] flex items-center">
          <div className="container mx-auto max-w-md text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle className="w-20 h-20 text-primary mx-auto mb-6" />
            </motion.div>
            <h2 className="text-2xl font-display font-bold mb-4 text-foreground">Inscrição Confirmada!</h2>
            <p className="text-muted-foreground">Você receberá mais informações no email cadastrado. Nos vemos no IX CONTEFFA 2026!</p>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="section-padding">
        <div className="container mx-auto max-w-lg">
          <SectionTitle title="Inscrição" subtitle="Preencha o formulário abaixo para garantir sua vaga." />

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-5 bg-card rounded-xl p-8 border border-border shadow-sm"
          >
            {[
              { key: "nome", label: "Nome Completo", type: "text", required: true },
              { key: "email", label: "Email", type: "email", required: true },
              { key: "telefone", label: "Telefone", type: "tel", required: false },
              { key: "cidade", label: "Cidade", type: "text", required: false },
              { key: "profissao", label: "Profissão", type: "text", required: false },
            ].map((field) => (
              <div key={field.key}>
                <Label htmlFor={field.key} className="mb-1.5 block text-sm font-medium">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={field.key}
                  type={field.type}
                  required={field.required}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              </div>
            ))}

            <Button type="submit" size="lg" className="w-full rounded-lg">
              Confirmar Inscrição
            </Button>
          </motion.form>
        </div>
      </section>
    </PageLayout>
  );
};

export default Inscricao;
