import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginOficina } from "@/services/votacaoService";
import { toast } from "sonner";
import { Lock, User, FileText, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

const LoginOficina: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error("Por favor, preencha o usuário e a senha.");
            return;
        }

        setLoading(true);
        try {
            const user = await loginOficina(username, password);
            if (user) {
                localStorage.setItem("conteffa_oficina_session", JSON.stringify(user));
                toast.success(`Bem-vindo, ${user.nome_operador || user.username}!`);
                navigate("/oficina/sala");
            } else {
                toast.error("Usuário ou senha incorretos ou acesso desativado.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao realizar login na Oficina.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background Decorative Gradients */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-inner">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Portal de Oficina</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Área restrita do Relator / Operador da Sala de Tese
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            Usuário da Sala
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="ex: sala-tese-01"
                                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            Senha de Acesso
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <span>Autenticando...</span>
                        ) : (
                            <>
                                <span>Acessar Sala de Oficina</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        CONTEFFA Connect
                    </span>
                    <span>Sistema de Votação</span>
                </div>
            </div>
        </div>
    );
};

export default LoginOficina;
