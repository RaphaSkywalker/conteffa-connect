import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    LogOut,
    Users,
    Calendar,
    Image as ImageIcon,
    FileText,
    Plus,
    Download,
    Settings,
    Search,
    Filter,
    LayoutDashboard,
    Newspaper,
    TrendingUp,
    Clock,
    User,
    Shield,
    ShieldCheck,
    Camera,
    Lock,
    Smartphone,
    Mail,
    AlertTriangle,
    Check,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AdminDashboard = () => {
    // Load initial user state from localStorage or use default
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("admin_user");
        return savedUser ? JSON.parse(savedUser) : {
            name: "Raphael Skywalker",
            email: "admin@conteffa.com.br",
            role: "admin",
            photo: null,
            association: "ANTEFFA",
            cargo: "Administrador do Sistema",
            phone: "(00) 00000-0000"
        };
    });

    // Load users list from localStorage or use default
    const [activeUsers, setActiveUsers] = useState(() => {
        const savedUsers = localStorage.getItem("conteffa_users");
        return savedUsers ? JSON.parse(savedUsers) : [
            {
                id: 1,
                name: "Raphael Skywalker",
                email: "admin@conteffa.com.br",
                role: "admin",
                association: "ANTEFFA",
                cargo: "Administrador",
                status: "Ativo",
                photo: null
            }
        ];
    });

    // Load news list from localStorage or use default
    const [noticias, setNoticias] = useState(() => {
        const savedNoticias = localStorage.getItem("conteffa_noticias");
        return savedNoticias ? JSON.parse(savedNoticias) : [
            {
                id: 1,
                title: "Inscrições abertas para o IX CONTEFFA 2026",
                date: "15 de março de 2026",
                summary: "As inscrições para o IX CONTEFFA 2026 já estão abertas. Garanta sua vaga.",
                status: "Publicado",
                photo: null
            },
            {
                id: 2,
                title: "Programação preliminar divulgada",
                date: "01 de abril de 2026",
                summary: "Confira a programação preliminar com palestras e workshops.",
                status: "Publicado",
                photo: null
            }
        ];
    });

    const [activeTab, setActiveTab] = useState("painel");
    // Form state for new user
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        cargo: "",
        association: "",
        photo: null as string | null,
        id: null as number | null // To track if we are editing
    });

    const [isAddingUser, setIsAddingUser] = useState(false);
    const [isAddingNoticia, setIsAddingNoticia] = useState(false);

    // Load albums list from localStorage or use default
    const [albuns, setAlbuns] = useState(() => {
        const saved = localStorage.getItem("conteffa_albuns");
        return saved ? JSON.parse(saved) : [
            { id: 1, title: "VIII CONTEFFA - 2025", date: "10/10/2025", cover: null, photos: [], count: 145 }
        ];
    });

    const [isAddingAlbum, setIsAddingAlbum] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const [newAlbum, setNewAlbum] = useState({
        title: "",
        date: "",
        location: "",
        cover: null as string | null,
        photos: [] as string[],
        id: null as number | null
    });

    // Form state for news
    const [newNoticia, setNewNoticia] = useState({
        title: "",
        summary: "",
        date: new Date().toLocaleDateString('pt-BR'),
        status: "Rascunho",
        photo: null as string | null,
        id: null as number | null
    });

    // Load speakers list from localStorage or use default
    const [palestrantes, setPalestrantes] = useState(() => {
        const saved = localStorage.getItem("conteffa_palestrantes");
        return saved ? JSON.parse(saved) : [
            { id: 1, name: "João Silva", cargo: "Especialista Tributário", bio: "Breve descrição sobre a trajetória profissional.", photo: null },
            { id: 2, name: "Maria Santos", cargo: "Consultora Legislativa", bio: "Breve descrição sobre a trajetória profissional.", photo: null },
            { id: 3, name: "Ricardo Oliveira", cargo: "Analista de Sistemas", bio: "Breve descrição sobre a trajetória profissional.", photo: null }
        ];
    });

    // Load schedule from localStorage or use default
    const [programacao, setProgramacao] = useState(() => {
        const saved = localStorage.getItem("conteffa_programacao");
        return saved ? JSON.parse(saved) : [
            {
                date: "12 de Novembro", label: "Dia 1 — Abertura",
                items: [
                    { time: "08:00", title: "Credenciamento", speaker: "" },
                    { time: "09:00", title: "Cerimônia de Abertura", speaker: "Presidente do CONTEFFA" }
                ]
            }
        ];
    });

    const [isAddingPalestrante, setIsAddingPalestrante] = useState(false);
    const [isAddingProgramacao, setIsAddingProgramacao] = useState(false);

    const [newPalestrante, setNewPalestrante] = useState({
        name: "",
        cargo: "",
        bio: "",
        photo: null as string | null,
        id: null as number | null
    });

    const [newProgramacao, setNewProgramacao] = useState({
        date: "",
        label: "",
        items: [] as any[],
        id: null as number | null
    });

    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Persist data when states change
    useEffect(() => {
        localStorage.setItem("admin_user", JSON.stringify(user));
    }, [user]);

    useEffect(() => {
        localStorage.setItem("conteffa_noticias", JSON.stringify(noticias));
    }, [noticias]);

    useEffect(() => {
        localStorage.setItem("conteffa_palestrantes", JSON.stringify(palestrantes));
    }, [palestrantes]);

    useEffect(() => {
        localStorage.setItem("conteffa_programacao", JSON.stringify(programacao));
    }, [programacao]);

    useEffect(() => {
        localStorage.setItem("conteffa_albuns", JSON.stringify(albuns));
    }, [albuns]);

    const noticiaFileInputRef = useRef<HTMLInputElement>(null);
    const palestranteFileInputRef = useRef<HTMLInputElement>(null);
    const albumCoverInputRef = useRef<HTMLInputElement>(null);
    const albumPhotosInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'profile' | 'noticia' | 'palestrante' | 'albumCover' = 'user') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                if (type === 'profile') {
                    const updatedProfile = { ...user, photo: base64String };
                    setUser(updatedProfile);

                    const updatedUsers = activeUsers.map((u: any) =>
                        (u.email === user.email || u.id === 1) ? { ...u, photo: base64String } : u
                    );
                    setActiveUsers(updatedUsers);
                    toast.success("Foto de perfil atualizada!");
                } else if (type === 'noticia') {
                    setNewNoticia({ ...newNoticia, photo: base64String });
                } else if (type === 'palestrante') {
                    setNewPalestrante({ ...newPalestrante, photo: base64String });
                } else if (type === 'albumCover') {
                    setNewAlbum({ ...newAlbum, cover: base64String });
                } else {
                    setNewUser({ ...newUser, photo: base64String });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMultiPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setIsUploading(true);
            setUploadProgress(0);

            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 15) + 5;
                if (progress >= 100) {
                    progress = 100;
                    setUploadProgress(100);
                    clearInterval(interval);

                    // Simulate processing after upload
                    setTimeout(() => {
                        const newPhotos: string[] = [];
                        // Just as a simulation since processing many base64 would be heavy
                        newPhotos.push("photo_placeholder_" + Date.now());

                        setNewAlbum(prev => ({
                            ...prev,
                            photos: [...prev.photos, ...newPhotos]
                        }));

                        setIsUploading(false);
                        toast.success(`${files.length} fotos enviadas com sucesso!`);
                    }, 500);
                } else {
                    setUploadProgress(progress);
                }
            }, 200);
        }
    };

    const handleSaveAlbum = () => {
        if (!newAlbum.title || !newAlbum.date) {
            toast.error("Preencha o nome do evento e a data.");
            return;
        }

        if (newAlbum.id) {
            const updated = albuns.map((a: any) =>
                a.id === newAlbum.id ? { ...a, ...newAlbum, count: a.photos.length + (a.count || 0) } : a
            );
            setAlbuns(updated);
            toast.success("Álbum atualizado!");
        } else {
            const toAdd = {
                ...newAlbum,
                id: Date.now(),
                count: newAlbum.photos.length || 0
            };
            setAlbuns([toAdd, ...albuns]);
            toast.success("Álbum criado com sucesso!");
        }

        setIsAddingAlbum(false);
        setNewAlbum({ title: "", date: "", location: "", cover: null, photos: [], id: null });
    };

    const handleEditAlbum = (album: any) => {
        setNewAlbum(album);
        setIsAddingAlbum(true);
    };

    const handleDeleteAlbum = (id: number) => {
        setAlbuns(albuns.filter((a: any) => a.id !== id));
        toast.success("Álbum removido.");
    };

    const handleSaveUser = () => {
        if (!newUser.name || !newUser.email) {
            toast.error("Por favor, preencha o nome e o e-mail.");
            return;
        }

        if (newUser.id) {
            // Update existing user
            const updatedUsers = activeUsers.map((u: any) =>
                u.id === newUser.id ? {
                    ...u,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    cargo: newUser.cargo,
                    association: newUser.association,
                    photo: newUser.photo || u.photo,
                    id: u.id // Garantir que o ID não seja sobrescrito se newUser.id for diferente
                } : u
            );
            setActiveUsers(updatedUsers);

            // Se o usuário editado for o admin logado, atualizar o estado global do perfil também
            if (newUser.id === 1 || newUser.email === user.email) {
                setUser({
                    ...user,
                    name: newUser.name,
                    phone: newUser.phone,
                    cargo: newUser.cargo,
                    association: newUser.association,
                    photo: newUser.photo || user.photo
                });
            }

            toast.success("Usuário atualizado com sucesso!");
        } else {
            // New user registration
            const userToAdd = {
                ...newUser,
                id: Date.now(), // Garantir que o ID seja gerado APÓS o spread
                role: "editor",
                status: "Ativo"
            };
            setActiveUsers([userToAdd, ...activeUsers]);
            toast.success("Usuário cadastrado com sucesso!");
        }

        setIsAddingUser(false);
        setNewUser({
            name: "",
            email: "",
            password: "",
            phone: "",
            cargo: "",
            association: "",
            photo: null,
            id: null
        });
    };

    const handleAddNewUser = () => {
        setNewUser({
            name: "",
            email: "",
            password: "",
            phone: "",
            cargo: "",
            association: "",
            photo: null,
            id: null
        });
        setIsAddingUser(true);
    };

    const handleEditUser = (userToEdit: any) => {
        setNewUser({
            name: userToEdit.name,
            email: userToEdit.email,
            password: "", // Don't show password
            phone: userToEdit.phone || "",
            cargo: userToEdit.cargo || "",
            association: userToEdit.association || "",
            photo: userToEdit.photo || null,
            id: userToEdit.id
        });
        setIsAddingUser(true);
        // Deslocar para o topo do formulário
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = () => {
        if (userToDelete) {
            setActiveUsers(activeUsers.filter((u: any) => u.id !== userToDelete.id));
            toast.success(`Usuário ${userToDelete.name} removido.`);
            setUserToDelete(null);
        }
    };

    const handleUpdateProfile = () => {
        // Garantir que a lista de usuários ativos também receba essas atualizações do admin
        const updatedUsers = activeUsers.map((u: any) =>
            (u.id === 1 || u.email === user.email) ? {
                ...u,
                name: user.name,
                phone: user.phone,
                cargo: user.cargo,
                association: user.association,
                photo: user.photo
            } : u
        );
        setActiveUsers(updatedUsers);
        toast.success("Dados do perfil atualizados com sucesso!");
    };

    const handleUpdatePassword = () => {
        if (!passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error("Por favor, preencha os dois campos de senha.");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        // Em uma aplicação real, aqui faríamos a chamada para o backend.
        // Como estamos simulando com localStorage:
        const updatedUser = { ...user, password: passwordData.newPassword };
        setUser(updatedUser);

        setPasswordData({ newPassword: "", confirmPassword: "" });
        toast.success("Senha alterada com sucesso!");
    };

    const handleSaveNoticia = () => {
        if (!newNoticia.title || !newNoticia.summary) {
            toast.error("Preencha o título e o resumo.");
            return;
        }

        if (newNoticia.id) {
            const updated = noticias.map((n: any) =>
                n.id === newNoticia.id ? { ...n, ...newNoticia, id: n.id } : n
            );
            setNoticias(updated);
            toast.success("Matéria atualizada!");
        } else {
            const noticiaToAdd = {
                ...newNoticia,
                id: Date.now(),
                status: "Publicado"
            };
            setNoticias([noticiaToAdd, ...noticias]);
            toast.success("Matéria publicada!");
        }

        setIsAddingNoticia(false);
        setNewNoticia({
            title: "",
            summary: "",
            date: new Date().toLocaleDateString('pt-BR'),
            status: "Rascunho",
            photo: null,
            id: null
        });
    };

    const handleEditNoticia = (n: any) => {
        setNewNoticia(n);
        setIsAddingNoticia(true);
    };

    const handleDeleteNoticia = (id: number) => {
        setNoticias(noticias.filter((n: any) => n.id !== id));
        toast.success("Matéria removida.");
    };

    const handleSavePalestrante = () => {
        if (!newPalestrante.name || !newPalestrante.cargo) {
            toast.error("Preencha o nome e o cargo.");
            return;
        }

        if (newPalestrante.id) {
            const updated = palestrantes.map((p: any) =>
                p.id === newPalestrante.id ? { ...p, ...newPalestrante } : p
            );
            setPalestrantes(updated);
            toast.success("Palestrante atualizado!");
        } else {
            const toAdd = { ...newPalestrante, id: Date.now() };
            setPalestrantes([...palestrantes, toAdd]);
            toast.success("Palestrante cadastrado!");
        }

        setIsAddingPalestrante(false);
        setNewPalestrante({ name: "", cargo: "", bio: "", photo: null, id: null });
    };

    const handleEditPalestrante = (p: any) => {
        setNewPalestrante(p);
        setIsAddingPalestrante(true);
    };

    const handleDeletePalestrante = (id: number) => {
        setPalestrantes(palestrantes.filter((p: any) => p.id !== id));
        toast.success("Palestrante removido.");
    };

    const handleSaveProgramacao = () => {
        if (!newProgramacao.date) {
            toast.error("Preencha a data.");
            return;
        }

        if (newProgramacao.id) {
            const updated = programacao.map((p: any) =>
                p.id === newProgramacao.id ? { ...p, ...newProgramacao } : p
            );
            setProgramacao(updated);
            toast.success("Agenda atualizada!");
        } else {
            const toAdd = { ...newProgramacao, id: Date.now() };
            setProgramacao([...programacao, toAdd]);
            toast.success("Dia cadastrado!");
        }

        setIsAddingProgramacao(false);
        setNewProgramacao({ date: "", label: "", items: [], id: null });
    };

    const handleEditProgramacao = (p: any) => {
        setNewProgramacao(p);
        setIsAddingProgramacao(true);
    };

    const handleDeleteProgramacao = (id: number) => {
        setProgramacao(programacao.filter((p: any) => p.id !== id));
        toast.success("Dia removido.");
    };

    const handleLogout = () => {
        navigate("/admin");
    };

    const tabs = [
        { id: "painel", label: "Visão Geral", icon: LayoutDashboard },
        { id: "noticias", label: "Notícias", icon: Newspaper },
        { id: "palestrantes", label: "Palestrantes", icon: Users },
        { id: "programacao", label: "Programação", icon: Calendar },
        { id: "galeria", label: "Galeria de Fotos", icon: ImageIcon },
        { id: "inscricoes", label: "Inscrições", icon: FileText },
        ...(user.role === "admin" ? [{ id: "usuarios", label: "Usuários", icon: Shield }] : []),
        { id: "perfil", label: "Meu Perfil", icon: User },
    ];

    const associacoes = [
        "ANTEFFA", "ATEFFA/RS", "ATEFFA/GO", "ATEFFA/SC", "ATEFFA/PR", "ATEFFA/SP", "ATEFFA/MG",
        "ATEFFA/ES", "ATEFFA/SE", "ATEFFA/PI", "ATEFFA/RJ", "ATEFFA/MS", "ATEFFA/MT", "ATEFFA/BA",
        "ATEFFA/CE", "ATEFFA/Região Norte", "ATEFFA/Região Nordeste"
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                className="w-full md:w-80 bg-[#0B1B32] text-white flex flex-col shadow-2xl z-20"
            >
                <div className="p-8 border-b border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                        <div
                            className="w-7 h-7 bg-primary"
                            style={{
                                WebkitMaskImage: "url(/bg-logo.png)",
                                WebkitMaskSize: "contain",
                                WebkitMaskRepeat: "no-repeat",
                                WebkitMaskPosition: "center",
                                maskImage: "url(/bg-logo.png)",
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                maskPosition: "center"
                            }}
                        />
                    </div>
                    <div>
                        <h2 className="font-heading font-black text-xl leading-none">CONTEFFA</h2>
                        <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Painel Admin</span>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/40"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-medium text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair do Sistema
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col h-screen">
                {/* Top Header */}
                <header className="bg-white px-8 py-6 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <h1 className="text-2xl font-heading font-black text-[#0B1B32]">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                className="pl-10 w-64 bg-slate-100 border-transparent rounded-full"
                                placeholder="Buscar..."
                            />
                        </div>
                    </div>
                </header>

                {/* Dynamic Content Area */}
                <div className="flex-1 overflow-auto p-8 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-6xl mx-auto"
                        >

                            {/* Painel (Visão Geral) Tab */}
                            {activeTab === "painel" && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        <div>
                                            <h3 className="font-bold text-lg text-[#0B1B32]">Visão Geral do Evento</h3>
                                            <p className="text-slate-500 text-sm">Resumo de métricas e andamento em tempo real.</p>
                                        </div>
                                    </div>

                                    {/* Métricas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                        {[
                                            { label: "Inscritos Totais", value: "1.245", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                                            { label: "Palestrantes Confirmados", value: String(palestrantes.length), icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
                                            { label: "Álbuns na Galeria", value: "12", icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-50" },
                                            { label: "Notícias Publicadas", value: String(noticias.length), icon: Newspaper, color: "text-amber-500", bg: "bg-amber-50" },
                                        ].map((metric, i) => (
                                            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                                                <div className={`w-16 h-16 rounded-full ${metric.bg} flex items-center justify-center`}>
                                                    <metric.icon className={`w-8 h-8 ${metric.color}`} />
                                                </div>
                                                <div>
                                                    <div className="text-3xl font-heading font-black text-[#0B1B32]">{metric.value}</div>
                                                    <div className="text-slate-500 text-sm font-medium">{metric.label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Gráfico de Andamento Simulando o Cronograma */}
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Clock className="w-5 h-5 text-primary" />
                                            <h4 className="font-bold text-lg text-[#0B1B32]">Andamento da Programação Hoje</h4>
                                        </div>
                                        <div className="space-y-6">
                                            {[
                                                { time: "08:00 - 09:00", title: "Credenciamento e Welcome Coffee", progress: 100, status: "Cocluído", color: "bg-emerald-500" },
                                                { time: "09:00 - 10:30", title: "Palestra de Abertura Oficial", progress: 65, status: "Em andamento", color: "bg-primary" },
                                                { time: "11:00 - 12:30", title: "Painel: O Futuro da Fiscalização", progress: 0, status: "Aguardando", color: "bg-slate-200" },
                                            ].map((item, i) => (
                                                <div key={i} className="flex flex-col md:flex-row md:items-center gap-4">
                                                    <div className="w-32 text-sm font-bold text-slate-500">{item.time}</div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="font-medium text-[#0B1B32]">{item.title}</span>
                                                            <span className="text-xs font-bold text-slate-400">{item.status}</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.progress}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notícias Tab */}
                            {activeTab === "noticias" && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        <div>
                                            <h3 className="font-bold text-lg text-[#0B1B32]">Mural de Notícias</h3>
                                            <p className="text-slate-500 text-sm">Crie e gerencie artigos, novidades e comunicados do evento.</p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setNewNoticia({
                                                    title: "",
                                                    summary: "",
                                                    date: new Date().toLocaleDateString('pt-BR'),
                                                    status: "Rascunho",
                                                    photo: null,
                                                    id: null
                                                });
                                                setIsAddingNoticia(true);
                                            }}
                                            className="rounded-full gap-2 px-6"
                                        >
                                            <Plus className="w-4 h-4" /> Nova Matéria
                                        </Button>
                                    </div>

                                    {isAddingNoticia && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-md space-y-6"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-primary text-sm uppercase tracking-wider">
                                                    {newNoticia.id ? "Editando Matéria" : "Nova Matéria"}
                                                </h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsAddingNoticia(false)}
                                                    className="rounded-full"
                                                >
                                                    Fechar
                                                </Button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Título da Notícia</label>
                                                    <Input
                                                        value={newNoticia.title}
                                                        onChange={(e) => setNewNoticia({ ...newNoticia, title: e.target.value })}
                                                        placeholder="Ex: Inscrições prorrogadas para o congresso"
                                                        className="rounded-xl h-12"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Resumo / Lead</label>
                                                    <textarea
                                                        value={newNoticia.summary}
                                                        onChange={(e) => setNewNoticia({ ...newNoticia, summary: e.target.value })}
                                                        placeholder="Breve descrição da notícia que aparecerá na listagem..."
                                                        className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50 rounded-2xl">
                                                    <div className="w-40 h-24 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm relative shrink-0">
                                                        {newNoticia.photo ? (
                                                            <img src={newNoticia.photo} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-8 h-8 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 flex flex-col justify-center">
                                                        <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Imagem de Capa</label>
                                                        <input
                                                            type="file"
                                                            ref={noticiaFileInputRef}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => handlePhotoUpload(e, 'noticia')}
                                                        />
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="rounded-full gap-2 w-fit"
                                                            onClick={() => noticiaFileInputRef.current?.click()}
                                                        >
                                                            <Camera className="w-4 h-4" /> Escolher Imagem
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <Button
                                                    onClick={handleSaveNoticia}
                                                    className="rounded-full px-10 bg-primary h-12"
                                                >
                                                    {newNoticia.id ? "Atualizar Matéria" : "Publicar Agora"}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {noticias.map((n: any) => (
                                            <div key={n.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                                <div className="h-40 bg-slate-100 flex items-center justify-center relative group">
                                                    {n.photo ? (
                                                        <img src={n.photo} alt={n.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-10 h-10 text-slate-300" />
                                                    )}
                                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-[#0B1B32]">
                                                        Capa
                                                    </div>
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                            <User className="w-3 h-3 text-primary" />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-500">Por: Assessoria Conteffa • {n.date}</span>
                                                    </div>
                                                    <h4 className="font-bold text-lg text-[#0B1B32] mb-2 leading-snug">{n.title}</h4>
                                                    <p className="text-sm text-slate-500 mb-6 line-clamp-2">{n.summary}</p>

                                                    <div className="flex gap-2 w-full mt-auto">
                                                        <Button
                                                            onClick={() => handleEditNoticia(n)}
                                                            variant="outline"
                                                            className="flex-1 rounded-full"
                                                        >
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteNoticia(n.id)}
                                                            variant="ghost"
                                                            className="flex-1 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            Excluir
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Palestrantes Tab */}
                            {activeTab === "palestrantes" && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        <div>
                                            <h3 className="font-bold text-lg text-[#0B1B32]">Gestão de Palestrantes</h3>
                                            <p className="text-slate-500 text-sm">Adicione, edite ou remova perfis.</p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setNewPalestrante({ name: "", cargo: "", bio: "", photo: null, id: null });
                                                setIsAddingPalestrante(true);
                                            }}
                                            className="rounded-full gap-2 px-6"
                                        >
                                            <Plus className="w-4 h-4" /> Novo Palestrante
                                        </Button>
                                    </div>

                                    {isAddingPalestrante && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-md space-y-6"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-primary text-sm uppercase tracking-wider">
                                                    {newPalestrante.id ? "Editando Palestrante" : "Novo Palestrante"}
                                                </h4>
                                                <Button variant="ghost" size="sm" onClick={() => setIsAddingPalestrante(false)} className="rounded-full">Fechar</Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-slate-400">Nome</label>
                                                        <Input
                                                            value={newPalestrante.name}
                                                            onChange={(e) => setNewPalestrante({ ...newPalestrante, name: e.target.value })}
                                                            className="rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-slate-400">Cargo / Especialidade</label>
                                                        <Input
                                                            value={newPalestrante.cargo}
                                                            onChange={(e) => setNewPalestrante({ ...newPalestrante, cargo: e.target.value })}
                                                            className="rounded-xl"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Bio / Descrição</label>
                                                    <textarea
                                                        value={newPalestrante.bio}
                                                        onChange={(e) => setNewPalestrante({ ...newPalestrante, bio: e.target.value })}
                                                        className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl">
                                                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                                    {newPalestrante.photo ? (
                                                        <img src={newPalestrante.photo} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-8 h-8 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <input
                                                        type="file"
                                                        ref={palestranteFileInputRef}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handlePhotoUpload(e, 'palestrante')}
                                                    />
                                                    <Button variant="secondary" size="sm" className="rounded-full gap-2" onClick={() => palestranteFileInputRef.current?.click()}>
                                                        <Camera className="w-4 h-4" /> Escolher Foto
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <Button onClick={handleSavePalestrante} className="rounded-full px-10 bg-primary h-12">
                                                    {newPalestrante.id ? "Salvar Alterações" : "Cadastrar Palestrante"}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {palestrantes.map((p: any) => (
                                            <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 overflow-hidden border-2 border-white shadow-sm">
                                                    {p.photo ? (
                                                        <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-8 h-8 text-slate-300" />
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-lg text-[#0B1B32]">{p.name}</h4>
                                                <p className="text-primary text-sm font-medium mb-4">{p.cargo}</p>
                                                <div className="flex gap-2 w-full mt-auto">
                                                    <Button onClick={() => handleEditPalestrante(p)} variant="outline" className="flex-1 rounded-full">Editar</Button>
                                                    <Button onClick={() => handleDeletePalestrante(p.id)} variant="ghost" className="flex-1 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50">Excluir</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Programação Tab */}
                            {activeTab === "programacao" && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        <div>
                                            <h3 className="font-bold text-lg text-[#0B1B32]">Agenda do Evento</h3>
                                            <p className="text-slate-500 text-sm">Configure datas, horários, salas e palestrantes.</p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setNewProgramacao({ date: "", label: "", items: [], id: null });
                                                setIsAddingProgramacao(true);
                                            }}
                                            className="rounded-full gap-2 px-6"
                                        >
                                            <Plus className="w-4 h-4" /> Novo Dia
                                        </Button>
                                    </div>

                                    {isAddingProgramacao && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-md space-y-6"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-primary text-sm uppercase tracking-wider">
                                                    {newProgramacao.id ? "Editando Dia" : "Novo Dia na Agenda"}
                                                </h4>
                                                <Button variant="ghost" size="sm" onClick={() => setIsAddingProgramacao(false)} className="rounded-full">Fechar</Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Data (ex: 12 de Novembro)</label>
                                                    <Input
                                                        value={newProgramacao.date}
                                                        onChange={(e) => setNewProgramacao({ ...newProgramacao, date: e.target.value })}
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Rótulo (ex: Dia 1 — Abertura)</label>
                                                    <Input
                                                        value={newProgramacao.label}
                                                        onChange={(e) => setNewProgramacao({ ...newProgramacao, label: e.target.value })}
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h5 className="font-bold text-sm text-[#0B1B32]">Atividades</h5>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setNewProgramacao({
                                                            ...newProgramacao,
                                                            items: [...newProgramacao.items, { time: "", title: "", speaker: "" }]
                                                        })}
                                                        className="gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" /> Add Atividade
                                                    </Button>
                                                </div>
                                                {newProgramacao.items.map((item, idx) => (
                                                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl relative">
                                                        <Input placeholder="08:00" value={item.time} onChange={(e) => {
                                                            const newItems = [...newProgramacao.items];
                                                            newItems[idx].time = e.target.value;
                                                            setNewProgramacao({ ...newProgramacao, items: newItems });
                                                        }} className="rounded-xl" />
                                                        <Input placeholder="Título da Atividade" value={item.title} onChange={(e) => {
                                                            const newItems = [...newProgramacao.items];
                                                            newItems[idx].title = e.target.value;
                                                            setNewProgramacao({ ...newProgramacao, items: newItems });
                                                        }} className="rounded-xl sm:col-span-2" />
                                                        <Input placeholder="Palestrante/Convidado" value={item.speaker} onChange={(e) => {
                                                            const newItems = [...newProgramacao.items];
                                                            newItems[idx].speaker = e.target.value;
                                                            setNewProgramacao({ ...newProgramacao, items: newItems });
                                                        }} className="rounded-xl sm:col-span-3" />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                const newItems = newProgramacao.items.filter((_, i) => i !== idx);
                                                                setNewProgramacao({ ...newProgramacao, items: newItems });
                                                            }}
                                                            className="absolute -top-2 -right-2 w-7 h-7 p-0 rounded-full bg-red-100 text-red-500 hover:bg-red-200"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <Button onClick={handleSaveProgramacao} className="rounded-full px-10 bg-primary h-12">
                                                    Salvar Dia na Agenda
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {programacao.map((day: any) => (
                                            <div key={day.id || day.date} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-bold text-[#0B1B32]">{day.date}</h4>
                                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{day.label}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => handleEditProgramacao(day)} variant="ghost" size="sm" className="rounded-full p-2 h-8 w-8"><Settings className="w-4 h-4" /></Button>
                                                        <Button onClick={() => handleDeleteProgramacao(day.id || day.date)} variant="ghost" size="sm" className="rounded-full p-2 h-8 w-8 text-red-500 hover:bg-red-50"><X className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    {day.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex gap-3 text-sm p-3 rounded-xl hover:bg-slate-50">
                                                            <span className="font-bold text-primary shrink-0">{item.time}</span>
                                                            <div>
                                                                <p className="font-bold text-[#0B1B32]">{item.title}</p>
                                                                {item.speaker && <p className="text-xs text-slate-500">Com: {item.speaker}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Galeria Tab */}
                            {activeTab === "galeria" && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        <div>
                                            <h3 className="font-bold text-lg text-[#0B1B32]">Álbuns de Fotos</h3>
                                            <p className="text-slate-500 text-sm">Gerencie galerias de eventos atuais e passados.</p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setNewAlbum({ title: "", date: "", cover: null, photos: [], id: null });
                                                setIsAddingAlbum(true);
                                            }}
                                            className="rounded-full gap-2 px-6"
                                        >
                                            <Plus className="w-4 h-4" /> Novo Álbum
                                        </Button>
                                    </div>

                                    {isAddingAlbum && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-md space-y-6"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-primary text-sm uppercase tracking-wider">
                                                    {newAlbum.id ? "Editando Álbum" : "Novo Álbum de Fotos"}
                                                </h4>
                                                <Button variant="ghost" size="sm" onClick={() => setIsAddingAlbum(false)} className="rounded-full">Fechar</Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-slate-400">Nome do Evento</label>
                                                        <Input
                                                            value={newAlbum.title}
                                                            onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                                                            placeholder="Ex: IX CONTEFFA - 2026"
                                                            className="rounded-xl h-12"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-slate-400">Data</label>
                                                        <Input
                                                            value={newAlbum.date}
                                                            onChange={(e) => setNewAlbum({ ...newAlbum, date: e.target.value })}
                                                            placeholder="Ex: 12 de Novembro de 2026"
                                                            className="rounded-xl h-12"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-slate-400">Local do Evento</label>
                                                        <Input
                                                            value={newAlbum.location}
                                                            onChange={(e) => setNewAlbum({ ...newAlbum, location: e.target.value })}
                                                            placeholder="Ex: Brasília, DF - Auditório Principal"
                                                            className="rounded-xl h-12"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-4">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Foto de Capa</label>
                                                    <div
                                                        onClick={() => albumCoverInputRef.current?.click()}
                                                        className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden group relative"
                                                    >
                                                        {newAlbum.cover ? (
                                                            <>
                                                                <img src={newAlbum.cover} alt="Capa" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Camera className="w-8 h-8 text-white" />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Camera className="w-8 h-8 text-slate-300 mb-2" />
                                                                <span className="text-xs text-slate-400">Selecionar arquivo</span>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            ref={albumCoverInputRef}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => handlePhotoUpload(e, 'albumCover')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-slate-100">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                    <div>
                                                        <h5 className="font-bold text-[#0B1B32]">Fotos do Evento</h5>
                                                        <p className="text-xs text-slate-500">Selecione todas as fotos deste evento de uma vez.</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => albumPhotosInputRef.current?.click()}
                                                        variant="secondary"
                                                        className="rounded-xl gap-2 h-12 bg-[#0B1B32] text-white hover:bg-[#0B1B32]/90"
                                                        disabled={isUploading}
                                                    >
                                                        <Plus className="w-4 h-4" /> Adicionar Todas Fotos
                                                    </Button>
                                                    <input
                                                        type="file"
                                                        ref={albumPhotosInputRef}
                                                        className="hidden"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={handleMultiPhotoUpload}
                                                    />
                                                </div>

                                                {isUploading && (
                                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                                Enviando Fotos...
                                                            </span>
                                                            <span className="text-xs font-black text-slate-900">{uploadProgress}%</span>
                                                        </div>
                                                        <div className="h-3 w-full bg-white rounded-full border border-slate-200 overflow-hidden p-0.5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${uploadProgress}%` }}
                                                                className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-sm"
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-3 text-center italic">Não feche esta janela enquanto o upload não for concluído.</p>
                                                    </div>
                                                )}

                                                <div className="flex justify-end pt-4">
                                                    <Button
                                                        onClick={handleSaveAlbum}
                                                        className="rounded-full px-12 bg-primary h-14 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                                    >
                                                        {newAlbum.id ? "Salvar Alterações" : "Criar Álbum Completo"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {albuns.map((album: any) => (
                                            <div key={album.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
                                                <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                                    {album.cover ? (
                                                        <img src={album.cover} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                        <ImageIcon className="w-12 h-12 text-slate-300" />
                                                    )}
                                                    <div className="absolute inset-0 bg-[#0B1B32]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => handleEditAlbum(album)}
                                                            className="rounded-full w-full mb-3 font-bold"
                                                        >
                                                            Gerenciar Álbum
                                                        </Button>
                                                    </div>
                                                    <div className="absolute top-4 left-4">
                                                        <span className="bg-white/90 backdrop-blur-sm text-[#0B1B32] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">
                                                            {album.count} Fotos
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-8">
                                                    <h4 className="font-heading font-black text-xl text-[#0B1B32] mb-2 leading-tight group-hover:text-primary transition-colors">{album.title}</h4>
                                                    <div className="space-y-1 mb-6">
                                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5 text-primary/60" /> {album.date}
                                                        </p>
                                                        {album.location && (
                                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                <Users className="w-3.5 h-3.5 text-primary/60" /> {album.location}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 w-full">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handleDeleteAlbum(album.id)}
                                                            className="flex-1 rounded-xl text-red-500 hover:bg-red-50 font-bold h-12"
                                                        >
                                                            Remover
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inscrições Tab */}
                            {activeTab === "inscricoes" && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        <div>
                                            <h3 className="font-bold text-lg text-[#0B1B32]">Relatórios de Inscrição</h3>
                                            <p className="text-slate-500 text-sm">Controle de inscritos, com filtro e exportação de fichas.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="outline" className="rounded-full gap-2">
                                                <Filter className="w-4 h-4" /> Filtros
                                            </Button>
                                            <Button className="rounded-full gap-2 px-6 bg-emerald-500 hover:bg-emerald-600">
                                                <Download className="w-4 h-4" /> Exportar PDF
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Table Placeholder */}
                                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-slate-600">
                                                <thead className="bg-slate-50 border-b border-slate-100 text-[#0B1B32]">
                                                    <tr>
                                                        <th className="px-6 py-4 font-bold">Nome Completo</th>
                                                        <th className="px-6 py-4 font-bold">CPF</th>
                                                        <th className="px-6 py-4 font-bold">E-mail</th>
                                                        <th className="px-6 py-4 font-bold">Data</th>
                                                        <th className="px-6 py-4 font-bold">Status</th>
                                                        <th className="px-6 py-4 font-bold">Ação</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-[#0B1B32]">Exemplo de Inscrito</td>
                                                        <td className="px-6 py-4">000.000.000-00</td>
                                                        <td className="px-6 py-4">exemplo@email.com</td>
                                                        <td className="px-6 py-4">27/02/2026</td>
                                                        <td className="px-6 py-4"><span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Confirmado</span></td>
                                                        <td className="px-6 py-4"><Button variant="ghost" size="sm" className="rounded-full text-primary">Ver Ficha</Button></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Usuários Tab (Admin Only) */}
                            {activeTab === "usuarios" && user.role === "admin" && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                        <div>
                                            <h3 className="font-bold text-lg text-[#0B1B32]">Controle de Acesso</h3>
                                            <p className="text-slate-500 text-sm">Gerencie quem pode publicar conteúdos na plataforma.</p>
                                        </div>
                                        <Button
                                            onClick={handleAddNewUser}
                                            className="rounded-full gap-2 px-6"
                                        >
                                            <Plus className="w-4 h-4" /> Novo Usuário
                                        </Button>
                                    </div>

                                    {isAddingUser && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-md space-y-6"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-primary text-sm uppercase tracking-wider">
                                                    {newUser.id ? "Editando Usuário" : "Novo Cadastro"}
                                                </h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsAddingUser(false)}
                                                    className="rounded-full"
                                                >
                                                    Fechar
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Nome Completo</label>
                                                    <Input
                                                        value={newUser.name}
                                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                        placeholder="Ex: João da Silva"
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">E-mail</label>
                                                    <Input
                                                        type="email"
                                                        value={newUser.email}
                                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                        placeholder="example@conteffa.com.br"
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Senha Temporária</label>
                                                    <Input
                                                        type="password"
                                                        value={newUser.password}
                                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                        placeholder="********"
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Telefone</label>
                                                    <Input
                                                        value={newUser.phone}
                                                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                                        placeholder="(00) 00000-0000"
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Cargo/Função</label>
                                                    <Input
                                                        value={newUser.cargo}
                                                        onChange={(e) => setNewUser({ ...newUser, cargo: e.target.value })}
                                                        placeholder="Ex: Assessor de Imprensa"
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Associação Estadual</label>
                                                    <select
                                                        value={newUser.association}
                                                        onChange={(e) => setNewUser({ ...newUser, association: e.target.value })}
                                                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {associacoes.map(assoc => <option key={assoc} value={assoc}>{assoc}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl">
                                                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm relative">
                                                    {newUser.photo ? (
                                                        <img src={newUser.photo} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-8 h-8 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Foto de Perfil</label>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handlePhotoUpload(e, 'user')}
                                                    />
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="rounded-full gap-2"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <Camera className="w-4 h-4" /> Escolher Foto
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex justify-end pt-4">
                                                <Button
                                                    onClick={handleSaveUser}
                                                    className="rounded-full px-10 bg-primary h-12"
                                                >
                                                    {newUser.id ? "Atualizar Usuário" : "Salvar Usuário"}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-100">
                                            <h4 className="font-bold text-slate-500 text-sm uppercase tracking-wider">Usuários Ativos</h4>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-[#0B1B32] font-bold">
                                                    <tr>
                                                        <th className="px-6 py-4">Usuário</th>
                                                        <th className="px-6 py-4">Associação</th>
                                                        <th className="px-6 py-4">Cargo</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {activeUsers.map((u: any) => (
                                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 flex items-center gap-3">
                                                                <div className="relative">
                                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden border border-slate-100">
                                                                        {u.photo ? <img src={u.photo} alt={u.name} className="w-full h-full object-cover" /> : u.name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    {u.role === 'admin' && (
                                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                                                            <ShieldCheck className="w-3 h-3" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-[#0B1B32] flex items-center gap-2">
                                                                        {u.name}
                                                                        {u.role === 'admin' && (
                                                                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">Admin</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-slate-400">{u.email}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-medium">{u.association}</td>
                                                            <td className="px-6 py-4 text-slate-500">{u.cargo}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                    {u.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 flex gap-2">
                                                                <Button
                                                                    onClick={() => handleEditUser(u)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="rounded-full"
                                                                >
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    onClick={() => setUserToDelete(u)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="rounded-full text-red-500 hover:bg-red-50"
                                                                >
                                                                    Remover
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Meu Perfil Tab */}
                            {activeTab === "perfil" && (
                                <div className="max-w-4xl mx-auto space-y-8">
                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-full" />

                                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                            <div className="relative group">
                                                <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden relative">
                                                    {user.photo ? (
                                                        <img src={user.photo} alt="Perfil" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-16 h-16 text-slate-300" />
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={profileFileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handlePhotoUpload(e, 'profile')}
                                                />
                                                <button
                                                    onClick={() => profileFileInputRef.current?.click()}
                                                    className="absolute bottom-1 right-1 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform"
                                                >
                                                    <Camera className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="text-center md:text-left flex-1">
                                                <h2 className="text-3xl font-heading font-black text-[#0B1B32]">{user.name}</h2>
                                                <p className="text-primary font-bold uppercase tracking-widest text-sm mb-4">{user.cargo} • {user.association}</p>
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                                    <span className="flex items-center gap-2 text-slate-500 text-sm font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                                        <Mail className="w-4 h-4" /> {user.email}
                                                    </span>
                                                    <span className="flex items-center gap-2 text-slate-500 text-sm font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                                        <Shield className="w-4 h-4" /> Perfil: {user.role === 'admin' ? 'Administrador' : 'Editor'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-md space-y-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Settings className="w-5 h-5 text-primary" />
                                                <h4 className="font-bold text-[#0B1B32]">Dados Pessoais</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nome Completo</label>
                                                    <Input
                                                        value={user.name}
                                                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Telefone</label>
                                                    <Input
                                                        value={user.phone}
                                                        onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                                        placeholder="(00) 00000-0000"
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <Button onClick={handleUpdateProfile} className="w-full rounded-full bg-primary mt-4">Atualizar Dados</Button>
                                            </div>
                                        </div>

                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-md space-y-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Lock className="w-5 h-5 text-amber-500" />
                                                <h4 className="font-bold text-[#0B1B32]">Segurança</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nova Senha</label>
                                                    <Input
                                                        type="password"
                                                        placeholder="********"
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Confirmar Senha</label>
                                                    <Input
                                                        type="password"
                                                        placeholder="********"
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleUpdatePassword}
                                                    variant="outline"
                                                    className="w-full rounded-full border-primary/20 text-primary mt-4 hover:bg-primary/5"
                                                >
                                                    Trocar Senha
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Modal de Confirmação de Exclusão */}
            <AnimatePresence>
                {userToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setUserToDelete(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white p-8 rounded-[2.5rem] shadow-2xl relative z-10 max-w-sm w-full text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-[#0B1B32] mb-2">Tem certeza?</h3>
                            <p className="text-slate-500 mb-8">
                                Você está prestes a excluir o usuário <strong>{userToDelete.name}</strong>. Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    className="rounded-full h-12 bg-red-500 hover:bg-red-600 font-bold"
                                    onClick={confirmDelete}
                                >
                                    Sim, Remover Usuário
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="rounded-full h-12 text-slate-500 hover:bg-slate-50 font-medium"
                                    onClick={() => setUserToDelete(null)}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
