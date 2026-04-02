import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import heroBg from "@/assets/hero-home-v3.jpg";

const AdminLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Consulta o Supabase para verificar o usuário
            const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', username)
                .single();

            if (error || !userData) {
                toast.error("Usuário não encontrado.");
                return;
            }

            // Comparação simples (Idealmente deveria ser hashbcrypt, mas mantendo compatibilidade com o esquema atual)
            if (userData.password === password) {
                // Salva a sessão do usuário
                localStorage.setItem("admin_user", JSON.stringify(userData));
                toast.success("Login realizado com sucesso! Bem-vindo ao painel.");
                navigate("/admin/dashboard");
            } else {
                toast.error("Senha incorreta.");
            }
        } catch (err: any) {
            console.error("Erro no login:", err);
            toast.error("Erro ao conectar com o banco de dados.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-fixed bg-center"
                style={{ backgroundImage: `url(${heroBg})` }}
            />
            <div className="absolute inset-0 bg-black/40" />

            {/* Animated background logos */}
            <div className="absolute bottom-[15%] -left-32 w-[420px] h-[420px] opacity-[0.05] pointer-events-none animate-bounce [animation-duration:9s]">
                <img src="/bg-logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="absolute top-[15%] -right-32 w-[420px] h-[420px] opacity-[0.05] pointer-events-none animate-bounce [animation-duration:8s]">
                <img src="/bg-logo.png" alt="" className="w-full h-full object-contain" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="bg-[#0B1B32]/80 backdrop-blur-2xl border border-white/10 p-10 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-bl-[5rem] pointer-events-none" />

                    <div className="flex flex-col items-center mb-8 relative z-10">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-white/10 shadow-lg glow">
                            <ShieldCheck className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-heading font-black text-white text-center">
                            Acesso <span className="text-primary">Restrito</span>
                        </h1>
                        <p className="text-white/60 text-sm mt-3 text-center">
                            Painel de Gestão e Administração do Evento
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-primary transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Usuário"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="h-14 bg-white/5 border-white/10 text-white pl-12 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base placeholder:text-white/40"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-primary transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <Input
                                    type="password"
                                    placeholder="Senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-14 bg-white/5 border-white/10 text-white pl-12 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base placeholder:text-white/40"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 rounded-full text-[15px] font-bold uppercase tracking-wider relative overflow-hidden group shadow-[0_0_30px_rgba(0,171,229,0.3)] hover:shadow-[0_0_40px_rgba(0,171,229,0.5)] transition-all"
                        >
                            <div className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full" />
                            <span className="relative flex items-center justify-center gap-2">
                                {isLoading ? (
                                    "Verificando..."
                                ) : (
                                    <>
                                        Acessar Painel <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </Button>
                    </form>

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="w-full text-center mt-8 text-sm text-white/50 hover:text-white transition-colors uppercase tracking-wider font-medium"
                    >
                        Voltar para o site
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
