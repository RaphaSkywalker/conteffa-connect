import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import PageLayout from "@/components/PageLayout";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Camera, User, Mail, Phone, MapPin, Info, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

const Inscricao = () => {
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    foto: null as string | null,
    nomeCompleto: "",
    endereco: "",
    bairro: "",
    cidade: "",
    cep: "",
    ateffa: "",
    telefone: "",
    celularWhatsapp: "",
    email: "",
    cargo: "",
    formaDeslocamento: "",
    problemaSaude: "NÃO",
    qualSaude: "",
    cuidadosEspeciais: "NÃO",
    quaisCuidados: "",
    acompanhantes: "NÃO",
    parentesco: "",
    quantosAcompanhantes: "",
    nomeAcompanhante: "",
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.loading("Enviando sua foto...", { id: "upload" });
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `registrations/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        setForm({ ...form, foto: publicUrl });
        toast.success("Foto carregada com sucesso!", { id: "upload" });
      } catch (err) {
        console.error("Erro no upload:", err);
        toast.error("Erro ao carregar foto.", { id: "upload" });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomeCompleto || !form.email) {
      toast.error("Por favor, preencha pelo menos o Nome e E-mail.");
      return;
    }

    try {
      // Prepare data to save
      const newInscricao = {
        ...form,
        data: new Date().toLocaleDateString('pt-BR'),
        status: "Pendente"
      };

      // Save to Supabase
      const { data: dbData, error } = await supabase.from('registrations').insert([newInscricao]).select();
      if (error) throw error;

      // Also save to localStorage for fallback/resilience
      const saved = localStorage.getItem("conteffa_inscricoes");
      const current = saved ? JSON.parse(saved) : [];
      const updated = [...current, { ...newInscricao, id: dbData?.[0]?.id || Date.now() }];
      localStorage.setItem("conteffa_inscricoes", JSON.stringify(updated));

      // 3. Save to local server (Express)
      try {
        await fetch("http://localhost:3001/api/registrations", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newInscricao)
        });
      } catch (localErr) {
        console.warn("Local server not available for registration sync");
      }

      // Trigger Success Modal
      setSubmitted(true);
      toast.success("Inscrição realizada com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar inscrição:", err);
      // Fallback to local storage if DB fails
      const saved = localStorage.getItem("conteffa_inscricoes");
      const current = saved ? JSON.parse(saved) : [];
      const updated = [...current, { ...form, id: Date.now(), data: new Date().toLocaleDateString('pt-BR'), status: "Pendente" }];
      localStorage.setItem("conteffa_inscricoes", JSON.stringify(updated));

      setSubmitted(true);
      toast.success("Inscrito salvo no navegador.");
    }
  };

  // Success Modal removed from conditional return to use Dialog instead


  return (
    <PageLayout>
      <PageBanner title="INSCRIÇÃO" />
      <section className="section-padding">
        <div className="container mx-auto">
          <SectionTitle
            title="Garanta sua Participação"
            subtitle="Preencha a ficha oficial de inscrição para o IX CONTEFFA."
          />

          <div className="max-w-4xl mx-auto mt-12">
            <motion.form
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-10 bg-[#122442] rounded-[3rem] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48" />

              {/* Photo Upload Section */}
              <div className="flex flex-col items-center gap-6 pb-10 border-b border-white/5 relative z-10">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full bg-white/5 flex items-center justify-center border-4 border-white/10 shadow-2xl overflow-hidden relative transition-all duration-500 group-hover:border-primary/50">
                    {form.foto ? (
                      <img src={form.foto} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <User className="w-16 h-16 text-white/10 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Sem Foto</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#122442] hover:scale-110 active:scale-95 transition-all duration-300"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-center">
                  <h4 className="text-white font-bold text-lg mb-1">SUA FOTO AQUI!</h4>
                  <p className="text-white/40 text-[11px] font-black uppercase tracking-widest">Clique no ícone para enviar sua foto</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {/* Nome Completo */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Nome Completo <span className="text-primary">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      required
                      value={form.nomeCompleto}
                      onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                      className="h-14 pl-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 transition-all font-medium"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                {/* Endereço & Bairro */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Endereço</Label>
                  <Input
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                    className="h-14 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50"
                    placeholder="Rua, número, apto"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Bairro</Label>
                  <Input
                    value={form.bairro}
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                    className="h-14 rounded-xl bg-white/5 border-white/10 text-white focus:border-primary/50"
                    placeholder="Nome do bairro"
                  />
                </div>

                {/* Cidade & CEP */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Cidade</Label>
                  <Input
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="h-14 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50"
                    placeholder="Sua cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">CEP</Label>
                  <Input
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                    className="h-14 rounded-xl bg-white/5 border-white/10 text-white focus:border-primary/50"
                    placeholder="00000-000"
                  />
                </div>

                {/* ATEFFA */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">ATEFFA</Label>
                  <Select onValueChange={(v) => setForm({ ...form, ateffa: v })}>
                    <SelectTrigger className={`h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/50 ${form.ateffa ? "text-white" : "text-white/20"}`}>
                      <SelectValue placeholder="Selecione a Associação Vinculada" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#122442] border-white/10 text-white shadow-2xl max-h-80">
                      <SelectItem value="ATEFFA/RS">ATEFFA/RS</SelectItem>
                      <SelectItem value="ATEFFA/GO">ATEFFA/GO</SelectItem>
                      <SelectItem value="ATEFFA/SC">ATEFFA/SC</SelectItem>
                      <SelectItem value="ATEFFA/PR">ATEFFA/PR</SelectItem>
                      <SelectItem value="ATEFFA/SP">ATEFFA/SP</SelectItem>
                      <SelectItem value="ATEFFA/MG">ATEFFA/MG</SelectItem>
                      <SelectItem value="ATEFFA/ES">ATEFFA/ES</SelectItem>
                      <SelectItem value="ATEFFA/SE">ATEFFA/SE</SelectItem>
                      <SelectItem value="ATEFFA/PI">ATEFFA/PI</SelectItem>
                      <SelectItem value="ATEFFA/RJ">ATEFFA/RJ</SelectItem>
                      <SelectItem value="ATEFFA/MS">ATEFFA/MS</SelectItem>
                      <SelectItem value="ATEFFA/MT">ATEFFA/MT</SelectItem>
                      <SelectItem value="ATEFFA/BA">ATEFFA/BA</SelectItem>
                      <SelectItem value="ATEFFA/CE">ATEFFA/CE</SelectItem>
                      <SelectItem value="ATEFFA/Região Norte">ATEFFA/Região Norte</SelectItem>
                      <SelectItem value="ATEFFA/Região Nordeste">ATEFFA/Região Nordeste</SelectItem>
                      <SelectItem value="Diretoria Executiva">Diretoria Executiva</SelectItem>
                      <SelectItem value="Palestrante">Palestrante</SelectItem>
                      <SelectItem value="Funcionário">Funcionário</SelectItem>
                      <SelectItem value="Convidado">Convidado</SelectItem>
                      <SelectItem value="Apoio Operacional">Apoio Operacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Telefone & WhatsApp */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Telefone Fixo</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                      className="h-14 pl-12 rounded-xl bg-white/5 border-white/10 text-white focus:border-primary/50"
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Celular / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      value={form.celularWhatsapp}
                      onChange={(e) => setForm({ ...form, celularWhatsapp: e.target.value })}
                      className="h-14 pl-12 rounded-xl bg-white/5 border-white/10 text-white focus:border-primary/50"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">E-mail <span className="text-primary">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-14 pl-12 rounded-xl bg-white/5 border-white/10 text-white focus:border-primary/50"
                      placeholder="exemplo@email.com"
                    />
                  </div>
                </div>

                {/* Cargo */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Cargo</Label>
                  <Select onValueChange={(v) => setForm({ ...form, cargo: v })}>
                    <SelectTrigger className={`h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/50 ${form.cargo ? "text-white" : "text-white/20"}`}>
                      <SelectValue placeholder="Selecione seu cargo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#122442] border-white/10 text-white shadow-2xl">
                      <SelectItem value="Agente de Atividades Agropecuária">Agente de Atividades Agropecuária</SelectItem>
                      <SelectItem value="Agente de Inspeção Sanitária e Industrial de Produtos de Origem Animal">Agente de Inspeção Sanitária e Industrial de Produtos de Origem Animal</SelectItem>
                      <SelectItem value="Técnico de Laboratório">Técnico de Laboratório</SelectItem>
                      <SelectItem value="Auxiliar de laboratório">Auxiliar de laboratório</SelectItem>
                      <SelectItem value="Auxiliar Operacional em Agropecuária">Auxiliar Operacional em Agropecuária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Forma de Deslocamento */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Forma de deslocamento ao IX CONTEFFA</Label>
                  <Select onValueChange={(v) => setForm({ ...form, formaDeslocamento: v })}>
                    <SelectTrigger className={`h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/50 ${form.formaDeslocamento ? "text-white" : "text-white/20"}`}>
                      <SelectValue placeholder="Como você viajará?" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#122442] border-white/10 text-white shadow-2xl">
                      <SelectItem value="Transporte Aéreo">Transporte Aéreo</SelectItem>
                      <SelectItem value="Ônibus">Ônibus</SelectItem>
                      <SelectItem value="Veículo Próprio">Veículo Próprio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Problema de Saúde */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Possui algum problema de saúde?</Label>
                  <Select onValueChange={(v) => setForm({ ...form, problemaSaude: v })} defaultValue="NÃO">
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#122442] border-white/10 text-white shadow-2xl">
                      <SelectItem value="SIM">SIM</SelectItem>
                      <SelectItem value="NÃO">NÃO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Qual?</Label>
                  <Input
                    disabled={form.problemaSaude === "NÃO"}
                    value={form.qualSaude}
                    onChange={(e) => setForm({ ...form, qualSaude: e.target.value })}
                    className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:border-primary/50 disabled:opacity-30"
                  />
                </div>

                {/* Cuidados Especiais */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Necessita de cuidados especiais?</Label>
                  <Select onValueChange={(v) => setForm({ ...form, cuidadosEspeciais: v })} defaultValue="NÃO">
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#122442] border-white/10 text-white shadow-2xl">
                      <SelectItem value="SIM">SIM</SelectItem>
                      <SelectItem value="NÃO">NÃO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Quais?</Label>
                  <Input
                    disabled={form.cuidadosEspeciais === "NÃO"}
                    value={form.quaisCuidados}
                    onChange={(e) => setForm({ ...form, quaisCuidados: e.target.value })}
                    className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:border-primary/50 disabled:opacity-30"
                  />
                  <p className="text-[12px] text-white/30 italic mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> Inciso XIII do Art. 6º do Regimento do Congresso
                  </p>
                </div>

                {/* Acompanhante Section */}
                <div className="md:col-span-2 pt-6 mt-6 border-t border-white/5">
                  <h5 className="font-heading font-black text-white uppercase tracking-wider text-sm mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    Informações de Acompanhante
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-white ml-1">Possui Acompanhante(s)?</Label>
                      <Select onValueChange={(v) => setForm({ ...form, acompanhantes: v })} defaultValue="NÃO">
                        <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#122442] border-white/10 text-white shadow-2xl">
                          <SelectItem value="SIM">SIM</SelectItem>
                          <SelectItem value="NÃO">NÃO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-white ml-1">Parentesco</Label>
                      <Select
                        disabled={form.acompanhantes === "NÃO"}
                        onValueChange={(v) => setForm({ ...form, parentesco: v })}
                      >
                        <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white disabled:opacity-30">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#122442] border-white/10 text-white shadow-2xl">
                          <SelectItem value="Esposa(o)">Esposa(o)</SelectItem>
                          <SelectItem value="Filho(a)">Filho(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-white ml-1">Quantos?</Label>
                      <Input
                        disabled={form.acompanhantes === "NÃO"}
                        type="number"
                        min="0"
                        value={form.quantosAcompanhantes}
                        onChange={(e) => setForm({ ...form, quantosAcompanhantes: e.target.value })}
                        className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:border-primary/50 disabled:opacity-30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-white ml-1">Nome do Acompanhante</Label>
                      <Input
                        disabled={form.acompanhantes === "NÃO"}
                        value={form.nomeAcompanhante}
                        onChange={(e) => setForm({ ...form, nomeAcompanhante: e.target.value })}
                        className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:border-primary/50 disabled:opacity-30"
                        placeholder="Nome completo"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 flex flex-col items-center relative z-10">
                <Button type="submit" size="lg" className="h-16 px-12 rounded-full bg-primary font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/40 hover:scale-101 active:scale-95 transition-all">
                  Finalizar Inscrição
                </Button>
                <div className="mt-8 flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle className="w-4 h-4 text-primary" /> Dados protegidos pela LGPD
                </div>
              </div>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Success Modal (Suspending Window) */}
      <Dialog open={submitted} onOpenChange={setSubmitted}>
        <DialogContent className="max-w-md bg-[#122442] border-white/10 rounded-[2.5rem] p-10 text-center overflow-hidden">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10"
          >
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <Check className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="font-heading font-black text-2xl text-white mb-4 uppercase tracking-tighter">CADASTRO FINALIZADO COM SUCESSO!</h3>
            <p className="text-white/60 text-lg font-medium leading-relaxed">
              Sua inscrição para o IX CONTEFFA foi registrada. <br />
              <span className="text-primary font-black mt-4 block text-xl">Até mais no IX CONTEFFA!</span>
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              className="mt-10 w-full h-14 rounded-xl bg-primary font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
            >
              ENTENDIDO
            </Button>
          </motion.div>

          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32" />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Inscricao;
