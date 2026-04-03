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
import { CheckCircle, Camera, User, Mail, Phone, MapPin, Info, AlertCircle, Check, Hotel, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const initialFormState = {
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
  acompanhantesNames: [] as string[],
  cpf: "",
  dataNascimento: "",
  tamanhoCamiseta: "",
  hotel: "MarHotel",
  qualHotel: "",
};

const Inscricao = () => {
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialFormState);

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const maskDate = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\/\d{4})\d+?$/, "$1");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.loading("Enviando sua foto...", { id: "upload" });
      try {
        // 1. Upload to Supabase (original)
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

  const sendConfirmationEmail = async (data: typeof form & { data: string }) => {
    try {
      await supabase.functions.invoke('send-confirmation-email', {
        body: {
          nomeCompleto: data.nomeCompleto,
          email: data.email,
          ateffa: data.ateffa,
          cargo: data.cargo,
          cidade: data.cidade,
          data: data.data,
          hotel: data.hotel,
          tamanhoCamiseta: data.tamanhoCamiseta,
          acompanhantes: data.acompanhantes,
          quantosAcompanhantes: data.quantosAcompanhantes,
        },
      });
    } catch (err) {
      // Não bloqueia o fluxo caso o email falhe
      console.warn("Email de confirmação não pôde ser enviado:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomeCompleto || !form.email || !form.cpf || !form.dataNascimento) {
      toast.error("Por favor, preencha os campos obrigatórios (Nome, E-mail, CPF e Data de Nascimento).");
      return;
    }

    try {
      const finalNomeAcompanhante = form.acompanhantesNames.filter(n => n.trim()).join(", ");
      const dataInscricao = new Date().toLocaleDateString('pt-BR');

      const newInscricao = {
        ...form,
        full_name: form.nomeCompleto,
        nomeAcompanhante: finalNomeAcompanhante,
        data: dataInscricao,
        status: "Pendente"
      };

      delete (newInscricao as any).acompanhantesNames;

      // 1. Save to Supabase
      const { data: dbData, error } = await supabase
        .from('registrations')
        .insert([newInscricao])
        .select()
        .single();

      if (error) throw error;

      // 2. Save to localStorage as fallback
      const saved = localStorage.getItem("conteffa_inscricoes");
      const current = saved ? JSON.parse(saved) : [];
      const updated = [...current, { ...newInscricao, id: dbData?.id || Date.now() }];
      localStorage.setItem("conteffa_inscricoes", JSON.stringify(updated));

      // 3. Send confirmation email (non-blocking)
      sendConfirmationEmail({ ...form, data: dataInscricao });

      setSubmitted(true);
      toast.success("Inscrição realizada com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar inscrição:", err);

      // Fallback: save locally and still try to send email
      const finalNomeAcompanhante = form.acompanhantesNames.filter(n => n.trim()).join(", ");
      const dataInscricao = new Date().toLocaleDateString('pt-BR');
      const newInscricao = {
        ...form,
        full_name: form.nomeCompleto,
        nomeAcompanhante: finalNomeAcompanhante,
        id: Date.now(),
        data: dataInscricao,
        status: "Pendente"
      };
      delete (newInscricao as any).acompanhantesNames;

      const saved = localStorage.getItem("conteffa_inscricoes");
      const current = saved ? JSON.parse(saved) : [];
      localStorage.setItem("conteffa_inscricoes", JSON.stringify([...current, newInscricao]));

      sendConfirmationEmail({ ...form, data: dataInscricao });

      setSubmitted(true);
      toast.success("Inscrito salvo no navegador.");
    }
  };


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

                {/* CPF & Data de Nascimento */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">CPF <span className="text-primary">*</span></Label>
                  <Input
                    required
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                    className="h-14 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-white ml-1">Data de Nascimento <span className="text-primary">*</span></Label>
                  <Input
                    required
                    value={form.dataNascimento}
                    onChange={(e) => setForm({ ...form, dataNascimento: maskDate(e.target.value) })}
                    className="h-14 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50"
                    placeholder="DD/MM/AAAA"
                  />
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
                  <Select onValueChange={(v) => {
                    const isDisabling = ["Palestrante", "Colaborador", "Convidado", "Apoio Operacional"].includes(v);
                    setForm({ 
                      ...form, 
                      ateffa: v,
                      cargo: isDisabling ? "" : form.cargo 
                    });
                  }}>
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
                      <SelectItem value="ATEFFA/PI">ATEFFA/PI</SelectItem>
                      <SelectItem value="ATEFFA/RJ">ATEFFA/RJ</SelectItem>
                      <SelectItem value="ATEFFA/MS">ATEFFA/MS</SelectItem>
                      <SelectItem value="ATEFFA/MT">ATEFFA/MT</SelectItem>
                      <SelectItem value="ATEFFA/BA">ATEFFA/BA</SelectItem>
                      <SelectItem value="ANTEFFA">ANTEFFA</SelectItem>
                      <SelectItem value="ATEFFA/Região Norte">ATEFFA/Região Norte</SelectItem>
                      <SelectItem value="ATEFFA/Região Nordeste">ATEFFA/Região Nordeste</SelectItem>
                      <SelectItem value="Diretoria Executiva">Diretoria Executiva</SelectItem>
                      <SelectItem value="Palestrante">Palestrante</SelectItem>
                      <SelectItem value="Colaborador">Colaborador</SelectItem>
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
                  <Label className={`text-sm font-bold text-white ml-1 ${["Palestrante", "Colaborador", "Convidado", "Apoio Operacional"].includes(form.ateffa) ? "opacity-30" : ""}`}>Cargo</Label>
                  <Select 
                    value={form.cargo}
                    onValueChange={(v) => setForm({ ...form, cargo: v })}
                    disabled={["Palestrante", "Colaborador", "Convidado", "Apoio Operacional"].includes(form.ateffa)}
                  >
                    <SelectTrigger className={`h-14 rounded-xl bg-white/5 border-white/10 focus:ring-primary/50 transition-all ${form.cargo ? "text-white" : "text-white/20"} disabled:opacity-30`}>
                      <SelectValue placeholder={["Palestrante", "Colaborador", "Convidado", "Apoio Operacional"].includes(form.ateffa) ? "Não aplicável para esta categoria" : "Selecione seu cargo"} />
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

                {/* Tamanho Camiseta */}
                <div className="md:col-span-2 space-y-4">
                  <Label className="text-sm font-bold text-white ml-1 uppercase tracking-widest text-[10px]">Tamanho da Camiseta</Label>
                  <div className="flex flex-wrap gap-3">
                    {["PP", "P", "M", "G", "GG", "XXG"].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setForm({ ...form, tamanhoCamiseta: size })}
                        className={`px-6 py-3 rounded-xl border-2 transition-all font-black text-xs ${form.tamanhoCamiseta === size
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105"
                          : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
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

                {/* Hospedagem Section */}
                <div className="md:col-span-2 pt-6 mt-6 border-t border-white/5">
                  <h5 className="font-heading font-black text-white uppercase tracking-wider text-sm mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Hotel className="w-4 h-4 text-primary" />
                    </div>
                    HOSPEDAGEM
                  </h5>

                  <div className={`grid gap-8 ${form.hotel === 'Outros...' ? 'md:grid-cols-2' : 'max-w-sm'}`}>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-white ml-1">Hotel</Label>
                      <Select value={form.hotel} onValueChange={(v) => setForm({ ...form, hotel: v })}>
                        <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#122442] border-white/10 text-white shadow-2xl">
                          <SelectItem value="MarHotel">MarHotel</SelectItem>
                          <SelectItem value="Outros...">Outros...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {form.hotel === 'Outros...' && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300">
                        <Label className="text-sm font-bold text-white ml-1">Qual?</Label>
                        <Input
                          value={form.qualHotel}
                          onChange={(e) => setForm({ ...form, qualHotel: e.target.value })}
                          placeholder="Nome do hotel/pousada"
                          className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:border-primary/50"
                        />
                      </div>
                    )}
                  </div>
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
                      <Select onValueChange={(v) => {
                        setForm({ 
                          ...form, 
                          acompanhantes: v,
                          quantosAcompanhantes: v === "NÃO" ? "" : "0",
                          acompanhantesNames: []
                        });
                      }} defaultValue="NÃO">
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
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-white ml-1">Quantos?</Label>
                      <div className="relative group">
                        <Input
                          disabled={form.acompanhantes === "NÃO"}
                          type="number"
                          min="0"
                          max="10"
                          value={form.quantosAcompanhantes}
                          onChange={(e) => {
                            const val = e.target.value;
                            const count = parseInt(val) || 0;
                            
                            // update array size
                            let newNames = [...form.acompanhantesNames];
                            if (count > newNames.length) {
                               newNames = [...newNames, ...Array(count - newNames.length).fill("")];
                            } else if (count < newNames.length) {
                               newNames = newNames.slice(0, count);
                            }
                            
                            setForm({ 
                              ...form, 
                              quantosAcompanhantes: val,
                              acompanhantesNames: newNames
                            });
                          }}
                          className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:border-primary/50 disabled:opacity-30 pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                        />
                        <div className="absolute right-0 top-0 h-full flex flex-col border-l border-white/10 overflow-hidden w-10 rounded-r-2xl">
                          <button
                            type="button"
                            onClick={() => {
                              const currentCount = parseInt(form.quantosAcompanhantes) || 0;
                              if (currentCount < 10) {
                                const nextCount = currentCount + 1;
                                const newNames = [...form.acompanhantesNames, ""];
                                setForm({ ...form, quantosAcompanhantes: nextCount.toString(), acompanhantesNames: newNames });
                              }
                            }}
                            className="flex-1 hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-primary transition-all border-b border-white/5"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const currentCount = parseInt(form.quantosAcompanhantes) || 0;
                              if (currentCount > 0) {
                                const nextCount = currentCount - 1;
                                const newNames = form.acompanhantesNames.slice(0, -1);
                                setForm({ ...form, quantosAcompanhantes: nextCount.toString(), acompanhantesNames: newNames });
                              }
                            }}
                            className="flex-1 hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-primary transition-all"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      {form.acompanhantesNames.map((name, idx) => (
                        <div key={idx} className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                          <Label className="text-sm font-bold text-white ml-1">
                            Nome do Acompanhante {form.acompanhantesNames.length > 1 ? `#${idx + 1}` : ""}
                          </Label>
                          <Input
                            disabled={form.acompanhantes === "NÃO"}
                            value={name}
                            onChange={(e) => {
                              const newNames = [...form.acompanhantesNames];
                              newNames[idx] = e.target.value;
                              setForm({ ...form, acompanhantesNames: newNames });
                            }}
                            className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:border-primary/50 disabled:opacity-30"
                            placeholder={`Nome completo do acompanhante ${idx + 1}`}
                          />
                        </div>
                      ))}
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
              <span className="text-primary font-black mt-4 block text-xl mb-4">Te vejo no IX CONTEFFA</span>
              <span className="block text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center justify-center gap-2">
                <CheckCircle className="w-3 h-3 text-primary" /> Dados protegidos pela LGPD
              </span>
            </p>
            <Button
              onClick={() => {
                setForm(initialFormState);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setSubmitted(false);
              }}
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
