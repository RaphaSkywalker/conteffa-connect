import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
    Mic,
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
    X,
    Instagram,
    Linkedin,
    Twitter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const API_URL = "http://localhost:3001/api";

const apiFetch = async (endpoint: string, options: any = {}) => {
    // Helper to map endpoints to Supabase tables
    const tableMap: Record<string, string> = {
        '/users': 'users',
        '/news': 'news',
        '/speakers': 'speakers',
        '/programming': 'programming',
        '/albums': 'albums',
        '/registrations': 'registrations',
        '/guests': 'guests',
        '/timeline_events': 'timeline_events',
        '/site_settings': 'site_settings',
        '/config/instagram': 'config'
    };

    const tableName = tableMap[endpoint] || endpoint.replace('/', '').split('/')[0];
    const method = options.method || 'GET';
    const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : null;

    try {
        // Special case for config table (key-value)
        if (tableName === 'config' && endpoint.includes('/config/')) {
            const key = endpoint.split('/').pop();
            if (method === 'GET') {
                const { data, error } = await supabase.from('config').select('value').eq('key', key).maybeSingle();
                if (error) throw error;
                return data ? JSON.parse(data.value) : null;
            }
            if (method === 'POST') {
                const { data, error } = await supabase.from('config').upsert({ key, value: JSON.stringify(body) }).select();
                if (error) throw error;
                return data;
            }
        }

        if (method === 'GET') {
            const { data, error } = await supabase.from(tableName).select('*');
            if (error) {
                console.warn(`Supabase GET warning for ${tableName}:`, error.message);
                return []; // Graceful fallback
            }

            // Post-process JSON fields for certain tables
            if (data && (tableName === 'programming' || tableName === 'albums')) {
                return data.map(item => ({
                    ...item,
                    items: typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []),
                    photos: typeof item.photos === 'string' ? JSON.parse(item.photos) : (item.photos || [])
                }));
            }
            return data || [];
        }

        // Remove ID from body for insert/update to avoid conflicts with auto-generated IDs
        const cleanBody = body ? { ...body } : null;
        if (cleanBody && 'id' in cleanBody) {
            delete cleanBody.id;
        }


        if (method === 'POST') {
            const { data, error } = await supabase.from(tableName).insert([cleanBody]).select();
            if (error) throw error;
            return data && data.length > 0 ? data[0] : data;
        }

        if (method === 'PUT' || method === 'PATCH') {
            const updateId = body.id || endpoint.split('/').pop();
            const { data, error } = await supabase.from(tableName).update(cleanBody).eq('id', updateId).select();
            if (error) throw error;
            return data;
        }

        if (method === 'DELETE') {
            const id = endpoint.split('/').pop();
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        }
    } catch (err: any) {
        console.error(`Supabase error for ${endpoint}:`, err);
        if (method === 'GET') return [];
        // Re-throw with a more descriptive error if possible
        const errorMsg = err.message || err.details || JSON.stringify(err);
        throw new Error(errorMsg);
    }
};

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
    const [noticias, setNoticias] = useState<any[]>(() => {
        try {
            const savedNoticias = localStorage.getItem("conteffa_noticias");
            let list = savedNoticias ? JSON.parse(savedNoticias) : [];
            if (!Array.isArray(list) || list.length === 0) {
                return [
                    {
                        id: -1,
                        title: "Inscrições abertas para o IX CONTEFFA 2026",
                        date: "15/03/2026",
                        summary: "As inscrições para o IX CONTEFFA 2026 já estão abertas.",
                        status: "Publicado",
                        photo: null,
                        views: 45,
                        likes: 12
                    }
                ];
            }
            return list;
        } catch (e) {
            console.error("Error loading noticias from localStorage", e);
            return [];
        }
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
    const [albuns, setAlbuns] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem("conteffa_albuns");
            let list = saved ? JSON.parse(saved) : [];
            if (!Array.isArray(list) || list.length === 0) {
                return [
                    { id: -1, title: "VIII CONTEFFA - 2025", date: "10/10/2025", cover: null, photos: [], count: 145 }
                ];
            }
            return [...list].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
        } catch (e) {
            console.error("Error loading albums from localStorage", e);
            return [];
        }
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
        tags: "",
        date: new Date().toLocaleDateString('pt-BR'),
        status: "Rascunho",
        photo: null as string | null,
        id: null as number | null
    });

    // Load speakers list from localStorage or use default
    const [palestrantes, setPalestrantes] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem("conteffa_palestrantes");
            let list = saved ? JSON.parse(saved) : [];
            if (!Array.isArray(list) || list.length === 0) {
                return [
                    { id: -1, name: "João Silva", cargo: "Especialista Tributário", bio: "Breve descrição sobre a trajetória profissional.", photo: null }
                ];
            }
            return list;
        } catch (e) {
            console.error("Error loading speakers from localStorage", e);
            return [];
        }
    });

    // Load guests list from localStorage or use default
    const [convidados, setConvidados] = useState(() => {
        const saved = localStorage.getItem("conteffa_convidados");
        return saved ? JSON.parse(saved) : [];
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
    const [isAddingConvidado, setIsAddingConvidado] = useState(false);
    const [isAddingProgramacao, setIsAddingProgramacao] = useState(false);
    const [dashboardProgDayIndex, setDashboardProgDayIndex] = useState(0);

    const [newPalestrante, setNewPalestrante] = useState({
        name: "",
        cargo: "",
        bio: "",
        instagram: "",
        linkedin: "",
        twitter: "",
        photo: null as string | null,
        id: null as number | null
    });

    const [newConvidado, setNewConvidado] = useState({
        name: "",
        cargo: "",
        category: "Convidado" as "Presidente" | "Diretoria" | "Convidado",
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

    // Load registrations
    const [inscricoes, setInscricoes] = useState<any[]>(() => {
        const saved = localStorage.getItem("conteffa_inscricoes");
        return saved ? JSON.parse(saved) : [];
    });

    const [searchInscricao, setSearchInscricao] = useState("");
    const [ateffaFilter, setAteffaFilter] = useState("TODAS");
    const [showFilters, setShowFilters] = useState(false);

    const filteredInscricoes = inscricoes.filter(insc => {
        const matchesSearch = (insc.nomeCompleto || "").toLowerCase().includes(searchInscricao.toLowerCase());
        const matchesAteffa = ateffaFilter === "TODAS" || insc.ateffa === ateffaFilter;
        return matchesSearch && matchesAteffa;
    });

    // Get unique ATEFFAs for filter
    const ateffasList = ["TODAS", ...new Set(inscricoes.map((insc: any) => insc.ateffa).filter(Boolean))] as string[];

    const [selectedInscricao, setSelectedInscricao] = useState<any>(null);
    const [isViewingInscricao, setIsViewingInscricao] = useState(false);

    const handleSaveEditedInscricao = () => {
        const updatedInscricoes = inscricoes.map(insc =>
            insc.id === selectedInscricao.id ? selectedInscricao : insc
        );
        setInscricoes(updatedInscricoes);
        localStorage.setItem("conteffa_inscricoes", JSON.stringify(updatedInscricoes));
        setIsViewingInscricao(false);
        toast.success("Inscrição atualizada com sucesso!");
    };

    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    // Export PDF state
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [exportSettings, setExportSettings] = useState({
        reportType: "completo" as "simples" | "medio" | "completo"
    });

    const handleExportPDF = () => {
        if (inscricoes.length === 0) {
            toast.error("Nenhuma inscrição encontrada para exportar.");
            return;
        }

        const type = exportSettings.reportType;
        const img = new Image();
        img.src = "/logo-evento.png?t=" + Date.now();

        toast.loading("Preparando relatório...", { id: "pdf-export" });

        img.onload = () => {
            const doc = new jsPDF();

            // Header: Adicionar Logomarca do Evento
            try {
                const maxWidth = 40;
                const maxHeight = 35;
                let finalWidth = maxWidth;
                let finalHeight = (img.height * maxWidth) / img.width;

                if (finalHeight > maxHeight) {
                    finalHeight = maxHeight;
                    finalWidth = (img.width * maxHeight) / img.height;
                }

                // Posicionar no canto direito mantendo margem de 14mm
                doc.addImage(img, 'PNG', 196 - finalWidth, 8, finalWidth, finalHeight);
            } catch (err) {
                console.error("Erro ao adicionar imagem ao PDF", err);
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(11, 27, 50); // Navy blue
            doc.text("Relatório de Inscritos", 14, 22);
            doc.setFontSize(18);
            doc.text("IX CONTEFFA", 14, 30);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`TIPO DE RELATÓRIO: ${type.toUpperCase()}`, 14, 38);
            doc.text(`GERADO EM: ${new Date().toLocaleString('pt-BR')}`, 14, 43);
            doc.line(14, 48, 196, 48);

            if (type === "simples") {
                const head = [["NOME COMPLETO", "TELEFONE/WHATSAPP", "ATEFFA", "ACOMPANHANTE"]];
                const body = inscricoes.map(insc => [
                    insc.nomeCompleto,
                    insc.celularWhatsapp || insc.telefone || "-",
                    insc.ateffa,
                    insc.nomeAcompanhante || "-"
                ]);

                autoTable(doc, {
                    head: head,
                    body: body,
                    startY: 55,
                    theme: 'grid',
                    headStyles: { fillColor: [11, 27, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 9, cellPadding: 3 },
                    alternateRowStyles: { fillColor: [245, 245, 245] }
                });
            } else if (type === "medio") {
                const head = [["DADOS PESSOAIS", "LOCALIZAÇÃO & ADICIONAIS", "ACOMPANHANTE"]];
                const body = inscricoes.map(insc => [
                    `Nome: ${insc.nomeCompleto}\nEmail: ${insc.email}\nTel: ${insc.celularWhatsapp || insc.telefone}\nCargo: ${insc.cargo}`,
                    `End: ${insc.endereco}\nCidade: ${insc.cidade}\nAteffa: ${insc.ateffa}\nDeslocamento: ${insc.formaDeslocamento}`,
                    `Acomp: ${insc.acompanhantes}\nNome: ${insc.nomeAcompanhante || "-"}\nParentesco: ${insc.parentesco || "-"}`
                ]);

                autoTable(doc, {
                    head: head,
                    body: body,
                    startY: 55,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 5 },
                    headStyles: { fillColor: [11, 27, 50], textColor: [255, 255, 255] },
                    columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 70 }, 2: { cellWidth: 42 } }
                });
            } else if (type === "completo") {
                const head = [["NOME / CARGO", "CONTATO / LOCALIZAÇÃO", "SAÚDE / EXTRAS", "ACOMPANHANTE"]];
                const body = inscricoes.map(insc => [
                    `${insc.nomeCompleto}\n${insc.cargo}\nATEFFA: ${insc.ateffa}`,
                    `${insc.email}\n${insc.celularWhatsapp || insc.telefone}\n${insc.cidade} - ${insc.cep}`,
                    `Saúde: ${insc.problemaSaude}${insc.qualSaude ? ` (${insc.qualSaude})` : ''}\nDeslocamento: ${insc.formaDeslocamento}`,
                    `Nome: ${insc.nomeAcompanhante || "-"}\nParentesco: ${insc.parentesco || "-"}`
                ]);

                autoTable(doc, {
                    head: head,
                    body: body,
                    startY: 55,
                    theme: 'grid',
                    styles: { fontSize: 7, cellPadding: 4 },
                    headStyles: { fillColor: [11, 27, 50], textColor: [255, 255, 255] }
                });
            }

            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
            }

            doc.save(`relatorio_conteffa_${type}_${Date.now()}.pdf`);
            setIsExportingPDF(false);
            toast.dismiss("pdf-export");
            toast.success("Download iniciado!");
        };

        img.onerror = () => {
            setIsExportingPDF(false);
            toast.dismiss("pdf-export");
            toast.error("Erro ao carregar logomarca. Verifique se o arquivo public/logo-evento.png existe.");
        };
    };

    const handleExportIndividualPDF = (insc: any) => {
        if (!insc) {
            toast.error("Dados do inscrito não encontrados.");
            return;
        }

        console.log("Iniciando exportação individual para:", insc.nomeCompleto);
        toast.loading("Gerando ficha individual...", { id: "pdf-individual" });

        const logoImg = new Image();
        logoImg.src = "/logo-evento.png?t=" + Date.now();

        logoImg.onload = () => {
            try {
                const doc = new jsPDF();
                console.log("Documento jsPDF criado");

                // Header: Logo do Evento
                try {
                    const maxWidth = 40;
                    const maxHeight = 35;
                    let finalWidth = maxWidth;
                    let finalHeight = (logoImg.height * maxWidth) / logoImg.width;
                    if (finalHeight > maxHeight) {
                        finalHeight = maxHeight;
                        finalWidth = (logoImg.width * maxHeight) / logoImg.height;
                    }
                    doc.addImage(logoImg, 'PNG', 196 - finalWidth, 8, finalWidth, finalHeight);
                } catch (err) {
                    console.error("Erro ao adicionar logo ao PDF:", err);
                }

                // Título
                doc.setFont("helvetica", "bold");
                doc.setFontSize(22);
                doc.setTextColor(11, 27, 50);
                doc.text("Ficha de Inscrição", 14, 22);
                doc.setFontSize(16);
                doc.text("IX CONTEFFA - RECIFE", 14, 30);
                doc.line(14, 45, 196, 45);

                // Foto do Inscrito
                if (insc.foto && typeof insc.foto === 'string' && insc.foto.startsWith('data:image')) {
                    try {
                        let format = 'JPEG';
                        if (insc.foto.includes('image/png')) format = 'PNG';
                        if (insc.foto.includes('image/webp')) format = 'WEBP';
                        doc.addImage(insc.foto, format, 14, 55, 40, 40, undefined, 'FAST');
                        doc.setDrawColor(11, 27, 50);
                        doc.rect(14, 55, 40, 40);
                    } catch (err) {
                        console.error("Erro ao adicionar foto ao PDF:", err);
                        doc.setDrawColor(200);
                        doc.rect(14, 55, 40, 40);
                        doc.setFontSize(8);
                        doc.setTextColor(150);
                        doc.text("ERRO NA FOTO", 20, 75);
                    }
                } else {
                    doc.setDrawColor(200);
                    doc.rect(14, 55, 40, 40);
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text("SEM FOTO", 24, 75);
                }

                // Dados ao lado da foto
                doc.setFontSize(14);
                doc.setTextColor(11, 27, 50);
                const nomeDisplay = (insc.nomeCompleto || "SEM NOME").toUpperCase();
                doc.text(nomeDisplay, 60, 65);

                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`ATEFFA: ${insc.ateffa || "-"}`, 60, 72);
                doc.text(`CARGO: ${insc.cargo || "-"}`, 60, 77);
                const statusDisplay = (insc.status || "Pendente").toUpperCase();
                doc.text(`STATUS: ${statusDisplay}`, 60, 82);
                doc.text(`INSCRITO EM: ${insc.data || "-"}`, 60, 87);

                // Tabelas de Dados Detalhados
                const personalData = [
                    ["E-MAIL", insc.email || "-"],
                    ["TELEFONE", insc.telefone || "-"],
                    ["WHATSAPP", insc.celularWhatsapp || "-"],
                    ["ENDEREÇO", insc.endereco || "-"],
                    ["CIDADE", insc.cidade || "-"],
                    ["CEP", insc.cep || "-"]
                ];

                console.log("Gerando primeira tabela");
                autoTable(doc, {
                    head: [["DADOS PESSOAIS & CONTATO", ""]],
                    body: personalData,
                    startY: 105,
                    theme: 'striped',
                    headStyles: { fillColor: [11, 27, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 9, cellPadding: 4 },
                    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
                });

                // Posicionar a segunda tabela com segurança
                // Se a primeira tabela falhar por algum motivo, mantemos um fallback de Y=180
                let currentY = 180;
                const lastTable = (doc as any).lastAutoTable;
                if (lastTable && lastTable.cursor) {
                    currentY = lastTable.cursor.y + 10;
                }

                const extraData = [
                    ["DESLOCAMENTO", insc.formaDeslocamento || "-"],
                    ["PROB. SAÚDE", insc.problemaSaude || "-"],
                    ["QUAL SAÚDE?", insc.qualSaude || "N/A"],
                    ["ACOMPANHANTE", insc.acompanhantes || "N/A"],
                    ["NOME ACOMP.", insc.nomeAcompanhante || "N/A"],
                    ["PARENTESCO", insc.parentesco || "N/A"]
                ];

                console.log("Gerando segunda tabela");
                autoTable(doc, {
                    head: [["LOGÍSTICA & INFORMAÇÕES ADICIONAIS", ""]],
                    body: extraData,
                    startY: currentY,
                    theme: 'striped',
                    headStyles: { fillColor: [11, 27, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 9, cellPadding: 4 },
                    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
                });

                // Rodapé
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text("Documento oficial emitido pelo sistema CONTEFFA Connect", 105, 285, { align: 'center' });
                doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 285);

                console.log("Salvando arquivo");
                const safeName = (insc.nomeCompleto || "ficha").replace(/[^a-z0-9]/gi, '_').toLowerCase();
                doc.save(`ficha_${safeName}.pdf`);
                toast.success("Ficha baixada com sucesso!");
            } catch (err: any) {
                console.error("Erro crítico na geração do PDF:", err);
                toast.error(`Erro ao gerar PDF: ${err.message || 'Erro desconhecido'}`);
            } finally {
                toast.dismiss("pdf-individual");
            }
        };

        logoImg.onerror = (e) => {
            console.error("Erro ao carregar logo para o PDF individual", e);
            toast.dismiss("pdf-individual");
            toast.error("Erro no servidor de imagens. Tente novamente.");
        };
    };

    const [instagramConfig, setInstagramConfig] = useState({
        handle: "@anteffa_nacional",
        url: "https://instagram.com/anteffa_nacional",
        photos: [] as string[]
    });

    const [adImage, setAdImage] = useState<string | null>(null);

    const instagramPhotosInputRef = useRef<HTMLInputElement>(null);
    const adInputRef = useRef<HTMLInputElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Data loading and migration
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch all data from backend
                const [dbUsers, dbNews, dbSpeakers, dbProg, dbAlbums, dbGuests, dbInscricoes] = await Promise.all([
                    apiFetch("/users").catch(() => []),
                    apiFetch("/news").catch(() => []),
                    apiFetch("/speakers").catch(() => []),
                    apiFetch("/programming").catch(() => []),
                    apiFetch("/albums").catch(() => []),
                    apiFetch("/guests").catch(() => []),
                    apiFetch("/registrations").catch(() => [])
                ]);

                if (dbUsers && dbUsers.length > 0) setActiveUsers(dbUsers);

                if (dbNews && dbNews.length > 0) {
                    setNoticias(prev => {
                        const current = Array.isArray(prev) ? prev : [];
                        const dbIds = new Set(dbNews.map((n: any) => n.id));
                        const merged = [...dbNews, ...current.filter(p => p && p.id && !dbIds.has(p.id))];
                        return merged.sort((a: any, b: any) => {
                            const valA = String(a.created_at || a.id || 0);
                            const valB = String(b.created_at || b.id || 0);
                            return valB.localeCompare(valA);
                        });
                    });
                }

                if (dbSpeakers && dbSpeakers.length > 0) {
                    setPalestrantes(prev => {
                        const current = Array.isArray(prev) ? prev : [];
                        const dbIds = new Set(dbSpeakers.map((s: any) => s.id));
                        return [...dbSpeakers, ...current.filter(p => p && p.id && !dbIds.has(p.id))];
                    });
                }

                if (dbProg && dbProg.length > 0) {
                    setProgramacao(prev => {
                        const current = Array.isArray(prev) ? prev : [];
                        const dbLabels = new Set(dbProg.map((p: any) => p.label));
                        return [...dbProg, ...current.filter(p => p && p.label && !dbLabels.has(p.label))];
                    });
                }

                if (dbGuests && dbGuests.length > 0) {
                    setConvidados(prev => {
                        const current = Array.isArray(prev) ? prev : [];
                        const dbIds = new Set(dbGuests.map((g: any) => g.id));
                        return [...dbGuests, ...current.filter(p => p && p.id && !dbIds.has(p.id))];
                    });
                }

                if (dbInscricoes && dbInscricoes.length > 0) setInscricoes(dbInscricoes);

                if (dbAlbums && dbAlbums.length > 0) {
                    setAlbuns(prev => {
                        const current = Array.isArray(prev) ? prev : [];
                        const dbIds = new Set(dbAlbums.map((a: any) => a.id));
                        const merged = [...dbAlbums, ...current.filter(p => p && p.id && !dbIds.has(p.id))];
                        return merged.sort((a: any, b: any) => (Number(b.id) || 0) - (Number(a.id) || 0));
                    });
                }

                try {
                    const dbInsta = await apiFetch("/config/instagram");
                    if (dbInsta) {
                        setInstagramConfig({
                            handle: dbInsta.handle || "@anteffa_nacional",
                            url: dbInsta.url || "https://instagram.com/anteffa_nacional",
                            photos: dbInsta.photos || []
                        });
                    }
                } catch (e) {
                    const localInsta = localStorage.getItem("conteffa_instagram");
                    if (localInsta) {
                        const parsed = JSON.parse(localInsta);
                        setInstagramConfig({
                            handle: parsed.handle || "@anteffa_nacional",
                            url: parsed.url || "https://instagram.com/anteffa_nacional",
                            photos: parsed.photos || []
                        });
                    }
                }

                try {
                    const { data: adData } = await supabase.from('config').select('value').eq('key', 'divulgacao').maybeSingle();
                    if (adData && adData.value) {
                        setAdImage(adData.value);
                    }
                } catch (e) {
                    const localAd = localStorage.getItem("conteffa_ad_image");
                    if (localAd) setAdImage(localAd);
                }

                // Clear migration flags to avoid repeat
                // (Optional: keep localStorage for a while just in case)
            } catch (err) {
                console.error("Failed to load backend data", err);
                toast.error("Erro ao carregar dados do servidor. Verifique se o backend está rodando.");
            }
        };

        loadData();
    }, []);

    // Unified synchronization to localStorage with safety
    useEffect(() => {
        try {
            localStorage.setItem("admin_user", JSON.stringify(user));
        } catch (e) { console.warn("Quota exceeded for user profile"); }
    }, [user]);

    useEffect(() => {
        try {
            if (noticias && noticias.length > 0) localStorage.setItem("conteffa_noticias", JSON.stringify(noticias));
        } catch (e) { console.warn("Quota exceeded for noticias"); }
    }, [noticias]);

    useEffect(() => {
        try {
            if (palestrantes && palestrantes.length > 0) localStorage.setItem("conteffa_palestrantes", JSON.stringify(palestrantes));
        } catch (e) { console.warn("Quota exceeded for palestrantes"); }
    }, [palestrantes]);

    useEffect(() => {
        try {
            if (albuns && albuns.length > 0) localStorage.setItem("conteffa_albuns", JSON.stringify(albuns));
        } catch (e) { console.warn("Quota exceeded for albuns (photos)"); }
    }, [albuns]);

    useEffect(() => {
        try {
            if (programacao && programacao.length > 0) localStorage.setItem("conteffa_programacao", JSON.stringify(programacao));
        } catch (e) { console.warn("Quota exceeded for programacao"); }
    }, [programacao]);

    useEffect(() => {
        try {
            if (convidados && convidados.length > 0) localStorage.setItem("conteffa_convidados", JSON.stringify(convidados));
        } catch (e) { console.warn("Quota exceeded for convidados"); }
    }, [convidados]);

    const noticiaFileInputRef = useRef<HTMLInputElement>(null);
    const palestranteFileInputRef = useRef<HTMLInputElement>(null);
    const convidadoFileInputRef = useRef<HTMLInputElement>(null);
    const albumCoverInputRef = useRef<HTMLInputElement>(null);
    const albumPhotosInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'profile' | 'noticia' | 'palestrante' | 'convidado' | 'albumCover' | 'albumPhotos' | 'instagramPhotos' | 'ad' = 'user') => {
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
                } else if (type === 'convidado') {
                    setNewConvidado({ ...newConvidado, photo: base64String });
                } else if (type === 'albumPhotos') {
                    setNewAlbum({ ...newAlbum, photos: [...newAlbum.photos, base64String] });
                } else if (type === 'instagramPhotos') {
                    if (instagramConfig.photos.length >= 6) {
                        toast.error("Máximo de 6 fotos atingido.");
                        return;
                    }
                    setInstagramConfig({ ...instagramConfig, photos: [...instagramConfig.photos, base64String] });
                } else if (type === 'ad') {
                    setAdImage(base64String);
                    localStorage.setItem("conteffa_ad_image", base64String);
                    toast.success("Imagem de divulgação atualizada!");
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

    const handleSaveAlbum = async () => {
        if (!newAlbum.title || !newAlbum.date) {
            toast.error("Preencha o nome do evento e a data.");
            return;
        }

        try {
            if (newAlbum.id) {
                await apiFetch(`/albums/${newAlbum.id}`, { method: 'PUT', body: JSON.stringify(newAlbum) });
                const updatedList = albuns.map((a: any) => a.id === newAlbum.id ? { ...a, ...newAlbum } : a);
                setAlbuns([...updatedList].sort((a: any, b: any) => (b.id || 0) - (a.id || 0)));
                localStorage.setItem("conteffa_albuns", JSON.stringify(updatedList));
                toast.success("Álbum atualizado!");
            } else {
                const res = await apiFetch("/albums", { method: 'POST', body: JSON.stringify(newAlbum) });
                const newList = [{ ...newAlbum, id: res.id, count: newAlbum.photos.length }, ...albuns];
                setAlbuns([...newList].sort((a: any, b: any) => (b.id || 0) - (a.id || 0)));
                localStorage.setItem("conteffa_albuns", JSON.stringify(newList));
                toast.success("Álbum criado com sucesso!");
            }
            setIsAddingAlbum(false);
            setNewAlbum({ title: "", date: "", location: "", cover: null, photos: [], id: null });
        } catch (err: any) {
            const tempAlbum = { ...newAlbum, id: Date.now(), count: newAlbum.photos.length };
            const newList = [tempAlbum, ...albuns];
            setAlbuns([...newList].sort((a: any, b: any) => (b.id || 0) - (a.id || 0)));
            localStorage.setItem("conteffa_albuns", JSON.stringify(newList));
            toast.success(`Salvo localmente. Motivo: ${err.message || "Servidor offline"}`);
            setIsAddingAlbum(false);
        }
    };

    const handleEditAlbum = (album: any) => {
        setNewAlbum(album);
        setIsAddingAlbum(true);
    };

    const handleDeleteAlbum = async (id: number) => {
        try {
            await apiFetch(`/albums/${id}`, { method: 'DELETE' });
            const updated = albuns.filter((a: any) => a.id !== id);
            setAlbuns(updated);
            localStorage.setItem("conteffa_albuns", JSON.stringify(updated));
            toast.success("Álbum removido.");
        } catch (err: any) {
            console.warn("Falha ao remover do Supabase, removendo localmente:", err.message);
            const updated = albuns.filter((a: any) => a.id !== id);
            setAlbuns(updated);
            localStorage.setItem("conteffa_albuns", JSON.stringify(updated));
            toast.success("Removido com sucesso (Limpado do navegador)");
        }
    };

    const handleSaveUser = async () => {
        if (!newUser.name || !newUser.email) {
            toast.error("Por favor, preencha o nome e o e-mail.");
            return;
        }

        try {
            if (newUser.id) {
                // Update existing user
                await apiFetch(`/users/${newUser.id}`, { method: 'PUT', body: JSON.stringify(newUser) });

                const updatedUsers = activeUsers.map((u: any) =>
                    u.id === newUser.id ? { ...u, ...newUser } : u
                );
                setActiveUsers(updatedUsers);

                // Se o usuário editado for o admin logado, atualizar o estado global do perfil também
                if (newUser.id === 1 || newUser.email === user.email) {
                    setUser({ ...user, ...newUser });
                }

                toast.success("Usuário atualizado com sucesso!");
            } else {
                // New user registration
                const res = await apiFetch("/users", { method: 'POST', body: JSON.stringify(newUser) });
                const userToAdd = { ...newUser, id: res.id, role: "editor", status: "Ativo" };
                setActiveUsers([userToAdd, ...activeUsers]);
                toast.success("Usuário cadastrado com sucesso!");
            }

            setIsAddingUser(false);
            setNewUser({ name: "", email: "", password: "", phone: "", cargo: "", association: "", photo: null, id: null });
        } catch (err: any) {
            toast.error(err.message || "Erro ao salvar usuário.");
        }
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

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                await apiFetch(`/users/${userToDelete.id}`, { method: 'DELETE' });
                setActiveUsers(activeUsers.filter((u: any) => u.id !== userToDelete.id));
                toast.success(`Usuário ${userToDelete.name} removido.`);
                setUserToDelete(null);
            } catch (err) {
                toast.error("Erro ao remover usuário.");
            }
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await apiFetch(`/users/${user.id || 1}`, { method: 'PUT', body: JSON.stringify(user) });
            // Garantir que a lista de usuários ativos também receba essas atualizações do admin
            const updatedUsers = activeUsers.map((u: any) =>
                (u.id === user.id || u.email === user.email) ? { ...u, ...user } : u
            );
            setActiveUsers(updatedUsers);
            toast.success("Dados do perfil atualizados com sucesso!");
        } catch (err) {
            toast.error("Erro ao atualizar perfil.");
        }
    };

    const handleUpdatePassword = async () => {
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

        try {
            await apiFetch(`/users/${user.id || 1}`, {
                method: 'PUT',
                body: JSON.stringify({ ...user, password: passwordData.newPassword })
            });
            setUser({ ...user, password: passwordData.newPassword });
            setPasswordData({ newPassword: "", confirmPassword: "" });
            toast.success("Senha alterada com sucesso!");
        } catch (err) {
            toast.error("Erro ao alterar senha.");
        }
    };

    const handleSaveNoticia = async () => {
        if (!newNoticia.title || !newNoticia.summary) {
            toast.error("Preencha o título e o resumo.");
            return;
        }

        try {
            if (newNoticia.id) {
                await apiFetch(`/news/${newNoticia.id}`, { method: 'PUT', body: JSON.stringify(newNoticia) });
                const updated = noticias.map((n: any) => n.id === newNoticia.id ? { ...n, ...newNoticia } : n);
                setNoticias(updated);
                localStorage.setItem("conteffa_noticias", JSON.stringify(updated));
                toast.success("Matéria atualizada!");
            } else {
                const res = await apiFetch("/news", { method: 'POST', body: JSON.stringify(newNoticia) });
                const updated = [{ ...newNoticia, id: res.id, status: "Publicado" }, ...noticias];
                setNoticias(updated);
                localStorage.setItem("conteffa_noticias", JSON.stringify(updated));
                toast.success("Matéria publicada!");
            }

            setIsAddingNoticia(false);
            setNewNoticia({
                title: "",
                summary: "",
                tags: "",
                date: new Date().toLocaleDateString('pt-BR'),
                status: "Rascunho",
                photo: null,
                id: null
            });
        } catch (err: any) {
            const tempNoticia = { ...newNoticia, id: Date.now(), status: "Publicado" };
            const updated = [tempNoticia, ...noticias];
            setNoticias(updated);
            localStorage.setItem("conteffa_noticias", JSON.stringify(updated));
            toast.success(`Salvo localmente. Motivo: ${err.message || "Servidor offline"}`);
            setIsAddingNoticia(false);
        }
    };

    const handleEditNoticia = (n: any) => {
        setNewNoticia(n);
        setIsAddingNoticia(true);
    };

    const handleDeleteNoticia = async (id: number) => {
        try {
            await apiFetch(`/news/${id}`, { method: 'DELETE' });
            const updated = noticias.filter((n: any) => n.id !== id);
            setNoticias(updated);
            localStorage.setItem("conteffa_noticias", JSON.stringify(updated));
            toast.success("Matéria removida.");
        } catch (err: any) {
            console.warn("Falha ao remover do Supabase, removendo localmente:", err.message);
            const updated = noticias.filter((n: any) => n.id !== id);
            setNoticias(updated);
            localStorage.setItem("conteffa_noticias", JSON.stringify(updated));
            toast.success("Removido com sucesso (Limpado do navegador)");
        }
    };

    const handleSavePalestrante = async () => {
        if (!newPalestrante.name || !newPalestrante.cargo) {
            toast.error("Preencha o nome e o cargo.");
            return;
        }

        try {
            if (newPalestrante.id) {
                await apiFetch(`/speakers/${newPalestrante.id}`, { method: 'PUT', body: JSON.stringify(newPalestrante) });
                const updated = palestrantes.map((p: any) => p.id === newPalestrante.id ? { ...p, ...newPalestrante } : p);
                setPalestrantes(updated);
                localStorage.setItem("conteffa_palestrantes", JSON.stringify(updated));
                toast.success("Palestrante atualizado!");
            } else {
                const res = await apiFetch("/speakers", { method: 'POST', body: JSON.stringify(newPalestrante) });
                const updated = [...palestrantes, { ...newPalestrante, id: res.id }];
                setPalestrantes(updated);
                localStorage.setItem("conteffa_palestrantes", JSON.stringify(updated));
                toast.success("Palestrante cadastrado!");
            }

            setIsAddingPalestrante(false);
            setNewPalestrante({
                name: "",
                cargo: "",
                bio: "",
                instagram: "",
                linkedin: "",
                twitter: "",
                photo: null,
                id: null
            });
        } catch (err: any) {
            console.warn("Falha ao salvar no Supabase, usando local storage:", err.message);
            const tempSpeaker = { ...newPalestrante, id: Date.now() };
            const updated = [...palestrantes, tempSpeaker];
            setPalestrantes(updated);
            localStorage.setItem("conteffa_palestrantes", JSON.stringify(updated));
            toast.warning(`Salvo no navegador. Motivo: ${err.message}`);
            setIsAddingPalestrante(false);
        }
    };

    const handleEditPalestrante = (p: any) => {
        setNewPalestrante(p);
        setIsAddingPalestrante(true);
    };

    const handleDeletePalestrante = async (id: number) => {
        try {
            await apiFetch(`/speakers/${id}`, { method: 'DELETE' });
            const updated = palestrantes.filter((p: any) => p.id !== id);
            setPalestrantes(updated);
            localStorage.setItem("conteffa_palestrantes", JSON.stringify(updated));
            toast.success("Palestrante removido.");
        } catch (err: any) {
            console.warn("Falha ao remover do Supabase, removendo localmente:", err.message);
            const updated = palestrantes.filter((p: any) => p.id !== id);
            setPalestrantes(updated);
            localStorage.setItem("conteffa_palestrantes", JSON.stringify(updated));
            toast.success("Removido com sucesso (Limpado do navegador)");
        }
    };

    const handleSaveConvidado = async () => {
        if (!newConvidado.name || !newConvidado.cargo) {
            toast.error("Preencha o nome e o cargo.");
            return;
        }

        try {
            if (newConvidado.id) {
                await apiFetch(`/guests/${newConvidado.id}`, { method: 'PUT', body: JSON.stringify(newConvidado) });
                const updated = convidados.map((c: any) => c.id === newConvidado.id ? { ...newConvidado } : c);
                setConvidados(updated);
                localStorage.setItem("conteffa_convidados", JSON.stringify(updated));
                toast.success("Convidado atualizado!");
            } else {
                const res = await apiFetch("/guests", { method: 'POST', body: JSON.stringify(newConvidado) });
                const guestToAdd = { ...newConvidado, id: res.id };
                const updated = [...convidados, guestToAdd];
                setConvidados(updated);
                localStorage.setItem("conteffa_convidados", JSON.stringify(updated));
                toast.success("Convidado cadastrado!");
            }

            setIsAddingConvidado(false);
            setNewConvidado({ name: "", cargo: "", category: "Convidado", bio: "", photo: null, id: null });
        } catch (err: any) {
            localStorage.setItem("conteffa_convidados", JSON.stringify([...convidados, { ...newConvidado, id: Date.now() }]));
            toast.success(`Salvo localmente. Motivo: ${err.message || "Servidor offline"}`);
            setIsAddingConvidado(false);
        }
    };

    const handleEditConvidado = (c: any) => {
        setNewConvidado(c);
        setIsAddingConvidado(true);
    };

    const handleDeleteConvidado = async (id: number) => {
        try {
            await apiFetch(`/guests/${id}`, { method: 'DELETE' });
            const updated = convidados.filter((c: any) => c.id !== id);
            setConvidados(updated);
            localStorage.setItem("conteffa_convidados", JSON.stringify(updated));
            toast.success("Convidado removido.");
        } catch (err: any) {
            console.warn("Falha ao remover do Supabase, removendo localmente:", err.message);
            const updated = convidados.filter((c: any) => c.id !== id);
            setConvidados(updated);
            localStorage.setItem("conteffa_convidados", JSON.stringify(updated));
            toast.success("Removido com sucesso (Limpado do navegador)");
        }
    };

    const handleSaveProgramacao = async () => {
        if (!newProgramacao.date) {
            toast.error("Preencha a data.");
            return;
        }

        try {
            if (newProgramacao.id) {
                await apiFetch(`/programming/${newProgramacao.id}`, { method: 'PUT', body: JSON.stringify(newProgramacao) });
                const updated = programacao.map((p: any) => p.id === newProgramacao.id ? { ...p, ...newProgramacao } : p);
                setProgramacao(updated);
                localStorage.setItem("conteffa_programacao", JSON.stringify(updated));
                toast.success("Agenda atualizada!");
            } else {
                const res = await apiFetch("/programming", { method: 'POST', body: JSON.stringify(newProgramacao) });
                const updated = [...programacao, { ...newProgramacao, id: res.id }];
                setProgramacao(updated);
                localStorage.setItem("conteffa_programacao", JSON.stringify(updated));
                toast.success("Dia cadastrado!");
            }

            setIsAddingProgramacao(false);
            setNewProgramacao({ date: "", label: "", items: [], id: null });
        } catch (err: any) {
            const tempDay = { ...newProgramacao, id: Date.now() };
            const updated = [...programacao, tempDay];
            setProgramacao(updated);
            localStorage.setItem("conteffa_programacao", JSON.stringify(updated));
            toast.success(`Salvo localmente. Motivo: ${err.message || "Servidor offline"}`);
            setIsAddingProgramacao(false);
        }
    };

    const handleEditProgramacao = (p: any) => {
        setNewProgramacao(p);
        setIsAddingProgramacao(true);
    };

    const handleAddProgramacaoItem = () => {
        setNewProgramacao({
            ...newProgramacao,
            items: [...newProgramacao.items, { time: "", title: "", speaker: "" }]
        });
    };

    const handleUpdateProgramacaoItem = (index: number, field: string, value: string) => {
        const updatedItems = [...newProgramacao.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setNewProgramacao({ ...newProgramacao, items: updatedItems });
    };

    const handleRemoveProgramacaoItem = (index: number) => {
        const updatedItems = newProgramacao.items.filter((_: any, i: number) => i !== index);
        setNewProgramacao({ ...newProgramacao, items: updatedItems });
    };

    const handleDeleteProgramacao = async (id: number) => {
        try {
            await apiFetch(`/programming/${id}`, { method: 'DELETE' });
            const updated = programacao.filter((p: any) => p.id !== id);
            setProgramacao(updated);
            localStorage.setItem("conteffa_programacao", JSON.stringify(updated));
            toast.success("Dia removido.");
        } catch (err: any) {
            console.warn("Falha ao remover do Supabase, removendo localmente:", err.message);
            const updated = programacao.filter((p: any) => p.id !== id);
            setProgramacao(updated);
            localStorage.setItem("conteffa_programacao", JSON.stringify(updated));
            toast.success("Agenda limpa localmente.");
        }
    };

    const handleSaveInstagram = async () => {
        try {
            await apiFetch("/config/instagram", {
                method: 'POST',
                body: JSON.stringify(instagramConfig)
            });
            localStorage.setItem("conteffa_instagram", JSON.stringify(instagramConfig));
            toast.success("Configuração do Instagram atualizada!");
        } catch (err) {
            localStorage.setItem("conteffa_instagram", JSON.stringify(instagramConfig));
            toast.success("Salvo localmente (Servidor offline)");
        }
    };

    const handleSaveAd = async () => {
        try {
            const { error } = await supabase.from('config').upsert({
                key: 'divulgacao',
                value: adImage,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

            if (error) throw error;

            localStorage.setItem("conteffa_ad_image", adImage || "");
            toast.success("Banner de divulgação atualizado!");
        } catch (err) {
            localStorage.setItem("conteffa_ad_image", adImage || "");
            toast.success("Salvo localmente (Erro ao subir)");
        }
    };

    const handleLogout = () => {
        navigate("/admin");
    };

    const tabs = [
        { id: "painel", label: "Visão Geral", icon: LayoutDashboard },
        { id: "noticias", label: "Notícias", icon: Newspaper },
        { id: "palestrantes", label: "Palestrantes", icon: Mic },
        { id: "convidados", label: "Convidados", icon: Users },
        { id: "programacao", label: "Programação", icon: Calendar },
        { id: "galeria", label: "Galeria de Fotos", icon: ImageIcon },
        { id: "inscricoes", label: "Inscrições", icon: FileText },
        ...(user.role === "admin" ? [{ id: "usuarios", label: "Usuários", icon: Shield }] : []),
        { id: "perfil", label: "Meu Perfil", icon: User },
    ];

    const associacoes = [
        "ANTEFFA", "ATEFFA/RS", "ATEFFA/GO", "ATEFFA/SC", "ATEFFA/PR", "ATEFFA/SP", "ATEFFA/MG",
        "ATEFFA/ES", "ATEFFA/SE", "ATEFFA/PI", "ATEFFA/RJ", "ATEFFA/MS", "ATEFFA/MT", "ATEFFA/BA",
        "ATEFFA/CE", "ATEFFA/Região Norte", "ATEFFA/Região Nordeste", "Diretoria Executiva",
        "Palestrante", "Funcionário", "Convidado", "Apoio Operacional"
    ];

    const cargos = [
        "Agente de Atividades Agropecuária",
        "Agente de Inspeção Sanitária e Industrial de Produtos de Origem Animal",
        "Técnico de Laboratório",
        "Auxiliar de laboratório",
        "Auxiliar Operacional em Agropecuária"
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                className="w-full md:w-80 bg-[#091426] text-white flex flex-col shadow-2xl z-20"
            >
                <div className="p-8 border-b border-white/10 flex items-center justify-center">
                    <img
                        src="/admin-logo.png"
                        alt="CONTEFFA"
                        className="h-[53px] w-auto object-contain"
                    />
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
            <main className="flex-1 bg-[#0C1A32] relative overflow-hidden flex flex-col h-screen text-slate-100">
                {/* Top Header */}
                <header className="bg-[#122442]/80 backdrop-blur-md px-8 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 shadow-lg">
                    <h1 className="text-2xl font-heading font-black text-white">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-full focus:ring-primary/50 focus:border-primary/50"
                                placeholder="Buscar no sistema..."
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
                                <div className="space-y-6 pb-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#122442] p-4 rounded-xl shadow-xl border border-white/10">
                                        <div>
                                            <h3 className="font-heading font-black text-lg text-white">Dashboard Geral</h3>
                                            <p className="text-white/40 text-[12px] font-medium">Bem-vindo, {user.name}.</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 shadow-2xl">
                                            <div className="text-right">
                                                <div className="text-xl font-heading font-black text-white flex items-baseline justify-end gap-1 leading-none">
                                                    {new Date().getDate()}
                                                    <span className="text-primary text-xl uppercase font-black">
                                                        {new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
                                                <Calendar className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Métricas Robustas */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                        {[
                                            { label: "Inscritos", value: String(inscricoes.length), trend: "+12%", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
                                            { label: "Palestrantes", value: String(palestrantes.length), trend: "OK", icon: Mic, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
                                            { label: "Convidados", value: String(convidados.length), trend: "OK", icon: Users, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
                                            { label: "Álbuns", value: String(albuns.length), trend: "Ativos", icon: ImageIcon, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
                                            { label: "Matérias", value: String(noticias.length), trend: "Live", icon: Newspaper, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
                                        ].map((metric, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.08)" }}
                                                className={`bg-white/5 p-5 rounded-2xl border ${metric.border} shadow-xl relative overflow-hidden group transition-all h-24 flex items-center justify-between`}
                                            >
                                                {/* Main Content & Right Icon */}
                                                <div className="flex-1 relative z-10">
                                                    <div className="text-4xl font-heading font-black text-white mb-0.5 tracking-tighter group-hover:text-primary transition-colors">
                                                        {metric.value}
                                                    </div>
                                                    <div className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">
                                                        {metric.label}
                                                    </div>
                                                </div>

                                                <div className={`w-12 h-12 rounded-2xl ${metric.bg} flex items-center justify-center -mr-1 rotate-12 group-hover:rotate-0 transition-transform duration-500 relative z-10`}>
                                                    <metric.icon className={`w-6 h-6 ${metric.color}`} />
                                                </div>

                                                {/* Background Decorative Element */}
                                                <div className={`absolute -bottom-4 -right-4 w-24 h-24 ${metric.bg} rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity`} />
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Gráfico de Andamento - Compacto e Escuro */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Progresso Radial */}
                                        <div className="lg:col-span-1 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group h-[400px]">
                                            <h4 className="font-black text-white/30 text-[10px] uppercase tracking-[0.2em] mb-4">Status Geral</h4>

                                            <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
                                                    <circle cx="128" cy="128" r="114" className="stroke-white/5" strokeWidth="16" fill="none" />
                                                    <motion.circle
                                                        cx="128" cy="128" r="114" className="stroke-primary" strokeWidth="16" fill="none"
                                                        strokeDasharray="716"
                                                        initial={{ strokeDashoffset: 716 }}
                                                        animate={{ strokeDashoffset: 716 * (1 - 0.65) }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute flex flex-col items-center">
                                                    <span className="text-4xl font-black text-white">65%</span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-white/50 font-medium px-4">
                                                Faltam <span className="text-primary font-black">2 atividades</span> pendentes.
                                            </p>
                                        </div>

                                        {/* Journey Timeline Dark */}
                                        <div className="lg:col-span-2 bg-[#0B1B32] p-6 rounded-2xl border border-white/10 shadow-2xl relative flex flex-col h-[400px]">
                                            <div className="flex items-center justify-between mb-6 shrink-0">
                                                <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                                    <h4 className="font-bold text-[13px] text-white uppercase tracking-wider">Cronograma Real</h4>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">LIVE</span>
                                                </div>
                                            </div>

                                            {/* Date Switcher Tabs */}
                                            <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide shrink-0 px-1">
                                                {programacao.map((day, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setDashboardProgDayIndex(idx)}
                                                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap border ${dashboardProgDayIndex === idx
                                                            ? "bg-primary text-white border-primary/50 shadow-[0_0_20px_rgba(30,174,219,0.3)] ring-1 ring-white/20"
                                                            : "bg-white/5 text-white/30 border-white/5 hover:bg-white/10 hover:text-white/60"
                                                            }`}
                                                    >
                                                        {day.label || `Dia ${idx + 1}`}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="relative space-y-2 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                                {programacao[dashboardProgDayIndex]?.items.map((item, i) => {
                                                    // Visual status logic: first is finished, second is active, rest pending (static for dashboard feel)
                                                    const status = i === 0 ? 'finished' : i === 1 ? 'active' : 'pending';
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="relative pl-10 mb-4"
                                                        >
                                                            <div className={`absolute left-0 top-1 w-7 h-7 rounded-full border-2 border-[#0B1B32] shadow-xl flex items-center justify-center z-10 
                                                                ${status === 'finished' ? 'bg-emerald-500' : status === 'active' ? 'bg-primary' : 'bg-white/10'}`}>
                                                                {status === 'finished' ? (
                                                                    <Check className="w-3 h-3 text-white" />
                                                                ) : (
                                                                    <Mic className="w-3 h-3 text-white" />
                                                                )}
                                                            </div>

                                                            <div className={`p-3 rounded-2xl border transition-all duration-300 relative ${status === 'active'
                                                                ? 'bg-white/5 border-primary/30 shadow-lg shadow-primary/5'
                                                                : 'bg-transparent border-transparent'}`}>

                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'active' ? 'text-primary' : 'text-white/20'}`}>
                                                                        {item.time} {status === 'active' && '— AGORA'}
                                                                    </span>
                                                                </div>

                                                                <h5 className={`font-heading font-bold text-sm leading-tight mb-0.5 ${status === 'active' ? 'text-white' : 'text-white/40'}`}>
                                                                    {item.title}
                                                                </h5>

                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${status === 'active' ? 'text-white/60' : 'text-white/20'}`}>
                                                                        {item.speaker || "Sem Palestrante"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {(!programacao[dashboardProgDayIndex]?.items || programacao[dashboardProgDayIndex].items.length === 0) && (
                                                    <div className="flex flex-col items-center justify-center py-10 text-white/20">
                                                        <Calendar className="w-10 h-10 mb-2 opacity-20" />
                                                        <p className="text-xs font-black uppercase tracking-widest">Nenhuma atividade registrada</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notícias Tab */}
                            {activeTab === "noticias" && (
                                <div className="space-y-6 pb-12">
                                    {/* Mural Header - At the top */}
                                    <div className="flex justify-between items-center bg-[#122442] p-6 rounded-3xl shadow-xl border border-white/5">
                                        <div>
                                            <h3 className="font-heading font-black text-xl text-white">Mural de Notícias</h3>
                                            <p className="text-white/40 text-[13px] font-medium">Crie e gerencie os comunicados do evento.</p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setNewNoticia({
                                                    title: "",
                                                    summary: "",
                                                    tags: "",
                                                    date: new Date().toLocaleDateString('pt-BR'),
                                                    status: "Rascunho",
                                                    photo: null,
                                                    id: null
                                                });
                                                setIsAddingNoticia(true);
                                            }}
                                            className="rounded-full gap-2 px-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 border-none"
                                        >
                                            <Plus className="w-4 h-4" /> Nova Matéria
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        {/* Left Column: News List (Reduced Width) */}
                                        <div className="lg:col-span-8 space-y-6">
                                            <Dialog open={isAddingNoticia} onOpenChange={setIsAddingNoticia}>
                                                <DialogContent className="max-w-2xl bg-[#122442] text-white border-white/10 rounded-[2.5rem] p-0 overflow-hidden">
                                                    <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                                        <DialogHeader className="mb-6">
                                                            <DialogTitle className="font-heading font-black text-2xl text-white uppercase tracking-tighter">
                                                                {newNoticia.id ? "Editando Matéria" : "Nova Matéria"}
                                                            </DialogTitle>
                                                            <p className="text-white/40 text-sm font-medium">Publique novidades no portal do evento.</p>
                                                        </DialogHeader>

                                                        <div className="space-y-6">
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Título da Notícia</label>
                                                                    <Input
                                                                        value={newNoticia.title}
                                                                        onChange={(e) => setNewNoticia({ ...newNoticia, title: e.target.value })}
                                                                        placeholder="Ex: Inscrições prorrogadas até 30 de abril"
                                                                        className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Resumo / Subtítulo</label>
                                                                    <textarea
                                                                        value={newNoticia.summary}
                                                                        onChange={(e) => setNewNoticia({ ...newNoticia, summary: e.target.value })}
                                                                        placeholder="Breve descrição da notícia para o mural..."
                                                                        className="flex min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all font-medium leading-relaxed"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Tags (Separadas por vírgula)</label>
                                                                    <Input
                                                                        value={newNoticia.tags}
                                                                        onChange={(e) => setNewNoticia({ ...newNoticia, tags: e.target.value })}
                                                                        placeholder="Ex: anteffa, congresso, tecnicos, fiscalização"
                                                                        className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                                    />
                                                                </div>

                                                                <div className="flex flex-col md:flex-row gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                                                    <div className="w-32 h-24 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl relative shrink-0">
                                                                        {newNoticia.photo ? (
                                                                            <img src={newNoticia.photo} alt="Preview" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <ImageIcon className="w-8 h-8 text-white/10" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 flex flex-col justify-center gap-3">
                                                                        <div>
                                                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Imagem de Capa</label>
                                                                            <input
                                                                                type="file"
                                                                                ref={noticiaFileInputRef}
                                                                                className="hidden"
                                                                                accept="image/*"
                                                                                onChange={(e) => handlePhotoUpload(e, 'noticia')}
                                                                            />
                                                                            <Button
                                                                                variant="secondary"
                                                                                className="rounded-full gap-2 h-10 px-6 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-black uppercase tracking-widest"
                                                                                onClick={() => noticiaFileInputRef.current?.click()}
                                                                            >
                                                                                <Camera className="w-4 h-4" /> Escolher Arquivo
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                                                <Button
                                                                    variant="ghost"
                                                                    onClick={() => setIsAddingNoticia(false)}
                                                                    className="rounded-full px-8 text-white/40 hover:text-white"
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    onClick={handleSaveNoticia}
                                                                    className="rounded-full px-10 bg-primary h-12 shadow-lg shadow-primary/20 font-black uppercase text-xs tracking-widest"
                                                                >
                                                                    {newNoticia.id ? "Salvar Alterações" : "Publicar Noticia"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {noticias.map((n: any) => (
                                                    <div key={n.id} className="bg-[#122442] rounded-[1.5rem] border border-white/5 shadow-xl overflow-hidden flex flex-col group transition-all hover:border-primary/30">
                                                        <div className="h-32 bg-white/5 flex items-center justify-center relative overflow-hidden">
                                                            {n.photo ? (
                                                                <img src={n.photo} alt={n.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                                            ) : (
                                                                <ImageIcon className="w-8 h-8 text-white/10" />
                                                            )}
                                                            <div className="absolute top-3 right-3 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg">
                                                                Portal
                                                            </div>
                                                        </div>
                                                        <div className="p-5 flex-1 flex flex-col">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                                                    <User className="w-2.5 h-2.5 text-primary" />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{n.date}</span>
                                                            </div>
                                                            <h4 className="font-heading font-bold text-base text-white mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-2">{n.title}</h4>
                                                            <p className="text-[11px] text-white/40 mb-4 line-clamp-2 leading-relaxed">{n.summary}</p>

                                                            <div className="flex gap-2 w-full mt-auto">
                                                                <Button
                                                                    onClick={() => handleEditNoticia(n)}
                                                                    className="flex-1 rounded-lg h-8 bg-primary hover:bg-primary/90 text-white border-none shadow-md shadow-primary/10 text-[10px] font-bold"
                                                                >
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDeleteNoticia(n.id)}
                                                                    variant="outline"
                                                                    className="flex-1 rounded-lg h-8 border border-red-400/30 bg-red-400/5 text-red-400 hover:bg-red-400/10 hover:border-red-400/50 font-black text-[9px] uppercase tracking-widest transition-all"
                                                                >
                                                                    Excluir
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right Column: Instagram Stuff (Always on the right) */}
                                        <div className="lg:col-span-4 space-y-6">
                                            {/* Instagram Handle Card */}
                                            <div className="bg-[#122442] p-5 rounded-3xl shadow-xl border border-white/5 h-fit">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center">
                                                            <Smartphone className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <h4 className="font-bold text-white text-xs">Instagram</h4>
                                                    </div>
                                                    <Button
                                                        onClick={handleSaveInstagram}
                                                        size="sm"
                                                        className="rounded-full h-7 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20"
                                                    >
                                                        Salvar
                                                    </Button>
                                                </div>

                                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 mb-1">
                                                    <div className="flex-1">
                                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-0.5">Handle / Perfil</label>
                                                        <Input
                                                            value={instagramConfig.handle}
                                                            onChange={(e) => setInstagramConfig({ ...instagramConfig, handle: e.target.value })}
                                                            className="bg-transparent border-none text-white text-[11px] h-5 p-0 focus-visible:ring-0"
                                                            placeholder="@usuario"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Instagram Photos Card */}
                                            <div className="bg-[#122442] p-5 rounded-3xl shadow-xl border border-white/5 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-bold text-white text-xs">Galeria Feed</h4>
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30">6 fotos fixas para o site</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                                                        const photo = (instagramConfig.photos || [])[idx];
                                                        return (
                                                            <div key={idx} className="aspect-square rounded-lg bg-white/5 border border-white/10 relative overflow-hidden group">
                                                                {photo ? (
                                                                    <>
                                                                        <img src={photo} alt="" className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                                            <button
                                                                                onClick={() => instagramPhotosInputRef.current?.click()}
                                                                                className="p-1.5 bg-primary rounded-full hover:scale-110 transition-transform"
                                                                                title="Trocar Foto"
                                                                            >
                                                                                <Camera className="w-3 h-3 text-white" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setInstagramConfig({ ...instagramConfig, photos: (instagramConfig.photos || []).filter((_, i) => i !== idx) })}
                                                                                className="p-1.5 bg-red-500 rounded-full hover:scale-110 transition-transform"
                                                                                title="Remover"
                                                                            >
                                                                                <X className="w-3 h-3 text-white" />
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => instagramPhotosInputRef.current?.click()}
                                                                        className="w-full h-full flex items-center justify-center hover:bg-white/5 transition-colors"
                                                                    >
                                                                        <Plus className="w-4 h-4 text-white/20" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <Button
                                                    onClick={handleSaveInstagram}
                                                    className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white border-none shadow-md shadow-primary/10 text-[10px] font-black uppercase tracking-widest h-9"
                                                >
                                                    Atualizar Galeria
                                                </Button>

                                                <input
                                                    type="file"
                                                    ref={instagramPhotosInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handlePhotoUpload(e, 'instagramPhotos')}
                                                />
                                            </div>

                                            {/* Box de Divulgação */}
                                            <div className="bg-[#122442] p-5 rounded-3xl shadow-xl border border-white/5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-white text-xs">Divulgação</h4>
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Propaganda no Site</p>
                                                    </div>
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                        <Camera className="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                </div>

                                                <div
                                                    onClick={() => adInputRef.current?.click()}
                                                    className="aspect-[4/5] rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-primary/50 transition-all"
                                                >
                                                    {adImage ? (
                                                        <div className="relative w-full h-full">
                                                            <img src={adImage} alt="Ad" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <span className="text-white text-[10px] font-black uppercase tracking-widest bg-primary/80 px-4 py-2 rounded-full">Trocar Imagem</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                                <Plus className="w-5 h-5 text-white/20" />
                                                            </div>
                                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Adicionar Banner</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <input
                                                    type="file"
                                                    ref={adInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handlePhotoUpload(e, 'ad')}
                                                />

                                                <Button
                                                    onClick={handleSaveAd}
                                                    className="w-full rounded-xl bg-white/5 hover:bg-white/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest h-9"
                                                >
                                                    Salvar Banner
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Palestrantes Tab */}
                            {activeTab === "palestrantes" && (
                                <div className="space-y-6 pb-12">
                                    <div className="flex justify-between items-center bg-[#122442] p-6 rounded-3xl shadow-xl border border-white/5">
                                        <div>
                                            <h3 className="font-heading font-black text-xl text-white">Gestão de Palestrantes</h3>
                                            <p className="text-white/40 text-[13px] font-medium">Controle os perfis que aparecem no site.</p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setNewPalestrante({
                                                    name: "",
                                                    cargo: "",
                                                    bio: "",
                                                    instagram: "",
                                                    linkedin: "",
                                                    twitter: "",
                                                    photo: null,
                                                    id: null
                                                });
                                                setIsAddingPalestrante(true);
                                            }}
                                            className="rounded-full gap-2 px-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 border-none"
                                        >
                                            <Plus className="w-4 h-4" /> Novo Perfil
                                        </Button>
                                    </div>

                                    <Dialog open={isAddingPalestrante} onOpenChange={setIsAddingPalestrante}>
                                        <DialogContent className="max-w-3xl bg-[#122442] text-white border-white/10 rounded-[2.5rem] p-0 overflow-hidden">
                                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                                <DialogHeader className="mb-8">
                                                    <DialogTitle className="font-heading font-black text-2xl text-white uppercase tracking-tighter">
                                                        {newPalestrante.id ? "Editando Palestrante" : "Novo Palestrante"}
                                                    </DialogTitle>
                                                    <p className="text-white/40 text-sm font-medium">Controle as informações do perfil do palestrante.</p>
                                                </DialogHeader>

                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-5">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Nome Completo</label>
                                                                <Input
                                                                    value={newPalestrante.name}
                                                                    onChange={(e) => setNewPalestrante({ ...newPalestrante, name: e.target.value })}
                                                                    placeholder="Ex: Dr. Roberto Carlos"
                                                                    className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Cargo / Especialidade</label>
                                                                <Input
                                                                    value={newPalestrante.cargo}
                                                                    onChange={(e) => setNewPalestrante({ ...newPalestrante, cargo: e.target.value })}
                                                                    placeholder="Ex: Auditor Fiscal Federal"
                                                                    className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Mini Bio / Descrição</label>
                                                            <textarea
                                                                value={newPalestrante.bio}
                                                                onChange={(e) => setNewPalestrante({ ...newPalestrante, bio: e.target.value })}
                                                                placeholder="Conte um pouco sobre a trajetória..."
                                                                className="flex min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all font-medium leading-relaxed"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                                                                <Instagram className="w-3 h-3 text-pink-400" /> Instagram
                                                            </label>
                                                            <Input
                                                                value={newPalestrante.instagram}
                                                                onChange={(e) => setNewPalestrante({ ...newPalestrante, instagram: e.target.value })}
                                                                placeholder="URL do Perfil"
                                                                className="rounded-xl h-10 bg-white/5 border-white/10 text-white text-xs"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                                                                <Linkedin className="w-3 h-3 text-blue-400" /> LinkedIn
                                                            </label>
                                                            <Input
                                                                value={newPalestrante.linkedin}
                                                                onChange={(e) => setNewPalestrante({ ...newPalestrante, linkedin: e.target.value })}
                                                                placeholder="URL do Perfil"
                                                                className="rounded-xl h-10 bg-white/5 border-white/10 text-white text-xs"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                                                                <Twitter className="w-3 h-3 text-sky-400" /> Twitter / X
                                                            </label>
                                                            <Input
                                                                value={newPalestrante.twitter}
                                                                onChange={(e) => setNewPalestrante({ ...newPalestrante, twitter: e.target.value })}
                                                                placeholder="URL do Perfil"
                                                                className="rounded-xl h-10 bg-white/5 border-white/10 text-white text-xs"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-2xl shrink-0">
                                                            {newPalestrante.photo ? (
                                                                <img src={newPalestrante.photo} alt="Preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-10 h-10 text-white/10" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-center gap-3">
                                                            <div>
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Foto de Perfil</label>
                                                                <input
                                                                    type="file"
                                                                    ref={palestranteFileInputRef}
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => handlePhotoUpload(e, 'palestrante')}
                                                                />
                                                                <Button
                                                                    variant="secondary"
                                                                    className="rounded-full gap-2 h-10 px-6 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-black uppercase tracking-widest"
                                                                    onClick={() => palestranteFileInputRef.current?.click()}
                                                                >
                                                                    <Camera className="w-4 h-4" /> Escolher Foto
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setIsAddingPalestrante(false)}
                                                            className="rounded-full px-8 text-white/40 hover:text-white"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button
                                                            onClick={handleSavePalestrante}
                                                            className="rounded-full px-10 bg-primary h-12 shadow-lg shadow-primary/20 font-black uppercase text-xs tracking-widest"
                                                        >
                                                            {newPalestrante.id ? "Salvar Alterações" : "Cadastrar Perfil"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {palestrantes.map((p: any) => (
                                            <div key={p.id} className="bg-[#122442] p-6 rounded-[2rem] border border-white/5 shadow-sm flex flex-col items-center text-center group transition-all hover:border-primary/30">
                                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4 overflow-hidden border border-white/10 shadow-xl">
                                                    {p.photo ? (
                                                        <img src={p.photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <User className="w-10 h-10 text-white/10" />
                                                    )}
                                                </div>
                                                <h4 className="font-heading font-bold text-lg text-white group-hover:text-primary transition-colors">{p.name}</h4>
                                                <p className="text-primary/70 text-[11px] font-black uppercase tracking-widest mb-4">{p.cargo}</p>
                                                <div className="flex gap-2 w-full mt-auto">
                                                    <Button onClick={() => handleEditPalestrante(p)} className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white border-none shadow-md shadow-primary/10 h-11 font-bold text-xs">Editar</Button>
                                                    <Button onClick={() => handleDeletePalestrante(p.id)} variant="outline" className="flex-1 rounded-xl border border-red-400/30 bg-red-400/5 text-red-400 hover:bg-red-400/10 hover:border-red-400/50 font-black text-[10px] uppercase tracking-widest h-11 transition-all">Excluir</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Convidados Tab */}
                            {activeTab === "convidados" && (
                                <div className="space-y-6 pb-12">
                                    <div className="flex justify-between items-center bg-[#122442] p-6 rounded-3xl shadow-xl border border-white/5">
                                        <div>
                                            <h3 className="font-heading font-black text-xl text-white">Gestão de Convidados</h3>
                                            <p className="text-white/40 text-[13px] font-medium">Controle os convidados, diretoria e presidentes.</p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setNewConvidado({ name: "", cargo: "", category: "Convidado", bio: "", photo: null, id: null });
                                                setIsAddingConvidado(true);
                                            }}
                                            className="rounded-full gap-2 px-6 bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/20 border-none font-black uppercase text-xs tracking-widest"
                                        >
                                            <Plus className="w-4 h-4" /> Novo Convidado
                                        </Button>
                                    </div>

                                    <Dialog open={isAddingConvidado} onOpenChange={setIsAddingConvidado}>
                                        <DialogContent className="max-w-3xl bg-[#122442] text-white border-white/10 rounded-[2.5rem] p-0 overflow-hidden">
                                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                                <DialogHeader className="mb-8">
                                                    <DialogTitle className="font-heading font-black text-2xl text-white uppercase tracking-tighter">
                                                        {newConvidado.id ? "Editando Convidado" : "Novo Convidado"}
                                                    </DialogTitle>
                                                    <p className="text-white/40 text-sm font-medium">Controle as informações do perfil do convidado.</p>
                                                </DialogHeader>

                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-5">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Nome Completo</label>
                                                                <Input
                                                                    value={newConvidado.name}
                                                                    onChange={(e) => setNewConvidado({ ...newConvidado, name: e.target.value })}
                                                                    placeholder="Ex: Dra. Maria Oliveira"
                                                                    className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-pink-500/50 transition-colors"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Categoria</label>
                                                                <Select
                                                                    value={newConvidado.category}
                                                                    onValueChange={(val: any) => setNewConvidado({ ...newConvidado, category: val })}
                                                                >
                                                                    <SelectTrigger className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-pink-500/50">
                                                                        <SelectValue placeholder="Selecione a categoria" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-[#122442] border-white/10 text-white">
                                                                        <SelectItem value="Presidente">Presidente</SelectItem>
                                                                        <SelectItem value="Diretoria">Diretoria</SelectItem>
                                                                        <SelectItem value="Convidado">Convidado</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Cargo / Título</label>
                                                                <Input
                                                                    value={newConvidado.cargo}
                                                                    onChange={(e) => setNewConvidado({ ...newConvidado, cargo: e.target.value })}
                                                                    placeholder="Ex: Presidente da ATEFFA-PE"
                                                                    className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-pink-500/50 transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Mini Bio (Opcional)</label>
                                                            <textarea
                                                                value={newConvidado.bio}
                                                                onChange={(e) => setNewConvidado({ ...newConvidado, bio: e.target.value })}
                                                                placeholder="Breve descrição..."
                                                                className="flex min-h-[180px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 transition-all font-medium leading-relaxed"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-2xl shrink-0">
                                                            {newConvidado.photo ? (
                                                                <img src={newConvidado.photo} alt="Preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-10 h-10 text-white/10" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-center gap-3">
                                                            <div>
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Foto de Perfil</label>
                                                                <input
                                                                    type="file"
                                                                    ref={convidadoFileInputRef}
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => handlePhotoUpload(e, 'convidado')}
                                                                />
                                                                <Button
                                                                    variant="secondary"
                                                                    className="rounded-full gap-2 h-10 px-6 bg-pink-500/10 text-pink-500 border border-pink-500/20 hover:bg-pink-500/20 text-xs font-black uppercase tracking-widest"
                                                                    onClick={() => convidadoFileInputRef.current?.click()}
                                                                >
                                                                    <Camera className="w-4 h-4" /> Escolher Foto
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setIsAddingConvidado(false)}
                                                            className="rounded-full px-8 text-white/40 hover:text-white"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button
                                                            onClick={handleSaveConvidado}
                                                            className="rounded-full px-10 bg-pink-500 h-12 shadow-lg shadow-pink-500/20 font-black uppercase text-xs tracking-widest text-white"
                                                        >
                                                            {newConvidado.id ? "Salvar Alterações" : "Cadastrar Convidado"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {convidados.map((c: any) => (
                                            <div key={c.id} className="bg-[#122442] p-6 rounded-[2rem] border border-white/5 shadow-sm flex flex-col items-center text-center group transition-all hover:border-pink-500/30">
                                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4 overflow-hidden border border-white/10 shadow-xl relative">
                                                    {c.photo ? (
                                                        <img src={c.photo} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <User className="w-10 h-10 text-white/10" />
                                                    )}
                                                    <div className="absolute -bottom-1 right-0 bg-pink-500 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#122442] shadow-lg">
                                                        <Users className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${c.category === 'Presidente' ? 'bg-amber-500/20 text-amber-500' :
                                                        c.category === 'Diretoria' ? 'bg-blue-500/20 text-blue-500' :
                                                            'bg-white/10 text-white/40'
                                                        }`}>
                                                        {c.category}
                                                    </span>
                                                </div>
                                                <h4 className="font-heading font-bold text-lg text-white group-hover:text-pink-500 transition-colors">{c.name}</h4>
                                                <p className="text-white/40 text-[11px] font-medium mb-4">{c.cargo}</p>
                                                <div className="flex gap-2 w-full mt-auto">
                                                    <Button onClick={() => handleEditConvidado(c)} className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 h-11 font-bold text-xs">Editar</Button>
                                                    <Button onClick={() => handleDeleteConvidado(c.id)} variant="outline" className="flex-1 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 font-black text-[10px] uppercase tracking-widest h-11 transition-all">Excluir</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Programação Tab */}
                            {activeTab === "programacao" && (
                                <div className="space-y-6 pb-12">
                                    <div className="flex justify-between items-center bg-[#122442] p-6 rounded-3xl shadow-xl border border-white/5">
                                        <div>
                                            <h3 className="font-heading font-black text-xl text-white">Agenda do Evento</h3>
                                            <p className="text-white/40 text-[13px] font-medium">Configure as atividades de cada dia.</p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setNewProgramacao({ date: "", label: "", items: [], id: null });
                                                setIsAddingProgramacao(true);
                                            }}
                                            className="rounded-full gap-2 px-6 shadow-lg shadow-primary/20"
                                        >
                                            <Plus className="w-4 h-4" /> Novo Dia
                                        </Button>
                                    </div>

                                    <Dialog open={isAddingProgramacao} onOpenChange={setIsAddingProgramacao}>
                                        <DialogContent className="max-w-3xl bg-[#122442] text-white border-white/10 rounded-[2.5rem] p-0 overflow-hidden">
                                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                                <DialogHeader className="mb-8">
                                                    <DialogTitle className="font-heading font-black text-2xl text-white uppercase tracking-tighter">
                                                        {newProgramacao.id ? "Editando Dia" : "Novo Dia na Agenda"}
                                                    </DialogTitle>
                                                    <p className="text-white/40 text-sm font-medium">Configure a data e as atividades deste dia.</p>
                                                </DialogHeader>

                                                <div className="space-y-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Data do Dia</label>
                                                            <Input
                                                                value={newProgramacao.date}
                                                                onChange={(e) => setNewProgramacao({ ...newProgramacao, date: e.target.value })}
                                                                placeholder="Ex: 12 de Novembro"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Título Exibido (Rótulo)</label>
                                                            <Input
                                                                value={newProgramacao.label}
                                                                onChange={(e) => setNewProgramacao({ ...newProgramacao, label: e.target.value })}
                                                                placeholder="Ex: Dia 1 — Abertura"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="pt-6 border-t border-white/5">
                                                        <div className="flex justify-between items-center mb-6">
                                                            <div>
                                                                <h5 className="font-bold text-white uppercase text-[11px] tracking-widest">Atividades (Grade Horária)</h5>
                                                                <p className="text-[11px] text-white/30 font-medium">Adicione os horários e temas das palestras.</p>
                                                            </div>
                                                            <Button
                                                                variant="secondary"
                                                                onClick={handleAddProgramacaoItem}
                                                                className="rounded-full gap-2 h-10 px-5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-black text-[10px] uppercase tracking-widest"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> Adicionar Item
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-4">
                                                            {newProgramacao.items.map((item: any, idx: number) => (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    key={idx}
                                                                    className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 relative group"
                                                                >
                                                                    <div className="md:col-span-2">
                                                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-1">Horário</label>
                                                                        <Input
                                                                            value={item.time}
                                                                            onChange={(e) => handleUpdateProgramacaoItem(idx, 'time', e.target.value)}
                                                                            placeholder="08:00"
                                                                            className="rounded-lg h-10 bg-white/5 border-white/10 text-white text-xs text-center"
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-5">
                                                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-1">Título / Atividade</label>
                                                                        <Input
                                                                            value={item.title}
                                                                            onChange={(e) => handleUpdateProgramacaoItem(idx, 'title', e.target.value)}
                                                                            placeholder="Título da Palestra"
                                                                            className="rounded-lg h-10 bg-white/5 border-white/10 text-white text-xs"
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-4">
                                                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-1">Palestrante</label>
                                                                        <Select
                                                                            value={item.speaker}
                                                                            onValueChange={(val) => handleUpdateProgramacaoItem(idx, 'speaker', val)}
                                                                        >
                                                                            <SelectTrigger className="rounded-lg h-10 bg-white/5 border-white/10 text-white text-xs">
                                                                                <SelectValue placeholder="Selecione..." />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="bg-[#122442] border-white/10 text-white">
                                                                                <SelectItem value="none">Sem Palestrante</SelectItem>
                                                                                {/* Palestrantes e Convidados integrados */}
                                                                                {[...palestrantes, ...convidados]
                                                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                                                    .map((p: any) => (
                                                                                        <SelectItem key={p.id} value={p.name}>
                                                                                            {p.name} {p.category && `(${p.category})`}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="md:col-span-1 flex items-end justify-center pb-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            onClick={() => handleRemoveProgramacaoItem(idx)}
                                                                            className="h-8 w-8 p-0 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-full"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setIsAddingProgramacao(false)}
                                                            className="rounded-full px-8 text-white/40 hover:text-white"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button
                                                            onClick={handleSaveProgramacao}
                                                            className="rounded-full px-12 bg-primary h-14 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                                        >
                                                            {newProgramacao.id ? "Salvar Agenda" : "Criar Novo Dia"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {programacao.map((day: any) => (
                                            <div key={day.id || day.date} className="bg-[#122442] rounded-[2rem] border border-white/5 shadow-xl overflow-hidden flex flex-col group transition-all hover:border-primary/30">
                                                <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-heading font-black text-white">{day.date}</h4>
                                                        <p className="text-primary/70 text-[10px] font-black uppercase tracking-widest">{day.label}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => handleEditProgramacao(day)} variant="ghost" size="sm" className="rounded-full p-2 h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"><Settings className="w-4 h-4" /></Button>
                                                        <Button onClick={() => handleDeleteProgramacao(day.id || day.date)} variant="ghost" size="sm" className="rounded-full p-2 h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"><X className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                                <div className="p-4 space-y-2">
                                                    {day.items.map((item: any, idx: number) => {
                                                        const speakerObj = palestrantes.find((p: any) => p.name === item.speaker);
                                                        return (
                                                            <div key={idx} className="flex gap-4 justify-between items-center text-sm p-4 rounded-2xl hover:bg-white/5 transition-colors group/item">
                                                                <div className="flex gap-4 items-center">
                                                                    <span className="font-black text-primary shrink-0 w-12">{item.time}</span>
                                                                    <div>
                                                                        <p className="font-bold text-white group-hover/item:text-primary transition-colors">{item.title}</p>
                                                                        {item.speaker && item.speaker !== "none" && (
                                                                            <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mt-1">{item.speaker}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {item.speaker && item.speaker !== "none" && (
                                                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden shrink-0">
                                                                        {(() => {
                                                                            const person = [...palestrantes, ...convidados].find((p: any) => p.name === item.speaker);
                                                                            return person?.photo ? (
                                                                                <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <User className="w-full h-full p-2 text-white/10" />
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Galeria Tab */}
                            {activeTab === "galeria" && (
                                <div className="space-y-6 pb-12">
                                    <div className="flex justify-between items-center bg-[#122442] p-6 rounded-3xl shadow-xl border border-white/5">
                                        <div>
                                            <h3 className="font-heading font-black text-xl text-white">Álbuns de Fotos</h3>
                                            <p className="text-white/40 text-[13px] font-medium">Gerencie as memórias dos eventos.</p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setNewAlbum({ title: "", date: "", location: "", cover: null, photos: [], id: null });
                                                setIsAddingAlbum(true);
                                            }}
                                            className="rounded-full gap-2 px-6 shadow-lg shadow-primary/20"
                                        >
                                            <Plus className="w-4 h-4" /> Novo Álbum
                                        </Button>
                                    </div>

                                    <Dialog open={isAddingAlbum} onOpenChange={setIsAddingAlbum}>
                                        <DialogContent className="max-w-4xl bg-[#122442] text-white border-white/10 rounded-[2.5rem] p-0 overflow-hidden">
                                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                                <DialogHeader className="mb-8">
                                                    <DialogTitle className="font-heading font-black text-2xl text-white uppercase tracking-tighter">
                                                        {newAlbum.id ? "Editando Álbum" : "Novo Álbum de Fotos"}
                                                    </DialogTitle>
                                                    <p className="text-white/40 text-sm font-medium">Preencha as informações do evento e importe suas fotos.</p>
                                                </DialogHeader>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-5">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Nome do Evento</label>
                                                            <Input
                                                                value={newAlbum.title}
                                                                onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                                                                placeholder="Ex: IX CONTEFFA - 2026"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Data</label>
                                                            <Input
                                                                value={newAlbum.date}
                                                                onChange={(e) => setNewAlbum({ ...newAlbum, date: e.target.value })}
                                                                placeholder="Ex: 12 de Novembro de 2026"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Local do Evento</label>
                                                            <Input
                                                                value={newAlbum.location}
                                                                onChange={(e) => setNewAlbum({ ...newAlbum, location: e.target.value })}
                                                                placeholder="Ex: Brasília, DF"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-4">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Foto de Capa</label>
                                                        <div
                                                            onClick={() => albumCoverInputRef.current?.click()}
                                                            className="aspect-video bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors overflow-hidden group relative"
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
                                                                    <Camera className="w-8 h-8 text-white/10 mb-2" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Selecionar arquivo</span>
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

                                                <div className="mt-8 pt-8 border-t border-white/5">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                        <div>
                                                            <h5 className="font-bold text-white uppercase text-[11px] tracking-widest">Fotos do Evento</h5>
                                                            <p className="text-[11px] text-white/30 font-medium">Selecione todas as fotos deste evento.</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => albumPhotosInputRef.current?.click()}
                                                            variant="secondary"
                                                            className="rounded-xl gap-2 h-12 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-black text-xs uppercase tracking-widest"
                                                            disabled={isUploading}
                                                        >
                                                            <Plus className="w-4 h-4" /> Importar Fotos
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
                                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                                                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                                    Enviando Fotos...
                                                                </span>
                                                                <span className="text-xs font-black text-white">{uploadProgress}%</span>
                                                            </div>
                                                            <div className="h-3 w-full bg-white/5 rounded-full border border-white/10 overflow-hidden p-0.5">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${uploadProgress}%` }}
                                                                    className="h-full bg-primary rounded-full shadow-lg shadow-primary/20"
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 mt-3 text-center italic">Não feche esta janela enquanto o upload não for concluído.</p>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-end gap-3 pt-4">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setIsAddingAlbum(false)}
                                                            className="rounded-full px-8 text-white/40 hover:text-white"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button
                                                            onClick={handleSaveAlbum}
                                                            className="rounded-full px-12 bg-primary h-14 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                                        >
                                                            {newAlbum.id ? "Salvar Alterações" : "Criar Álbum Completo"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {albuns.map((album: any) => (
                                            <div key={album.id} className="bg-[#122442] rounded-[2.5rem] border border-white/5 shadow-xl overflow-hidden group hover:border-primary/40 transition-all duration-500">
                                                <div className="h-48 bg-white/5 flex items-center justify-center relative overflow-hidden">
                                                    {album.cover ? (
                                                        <img src={album.cover} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                        <ImageIcon className="w-12 h-12 text-white/10" />
                                                    )}
                                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => handleEditAlbum(album)}
                                                            className="rounded-full w-full mb-3 font-black text-xs uppercase tracking-widest bg-white text-[#122442] hover:bg-white/90"
                                                        >
                                                            Gerenciar Álbum
                                                        </Button>
                                                    </div>
                                                    <div className="absolute top-4 left-4">
                                                        <span className="bg-primary/90 backdrop-blur-sm text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                                            {album.count} Fotos
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-8">
                                                    <h4 className="font-heading font-black text-xl text-white mb-2 leading-tight group-hover:text-primary transition-colors">{album.title}</h4>
                                                    <div className="space-y-1 mb-6">
                                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5 text-primary" /> {album.date}
                                                        </p>
                                                        {album.location && (
                                                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                <Users className="w-3.5 h-3.5 text-primary" /> {album.location}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 w-full">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleDeleteAlbum(album.id)}
                                                            className="flex-1 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 font-black text-[11px] uppercase tracking-widest h-12 transition-all duration-300"
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
                                <div className="space-y-6 pb-12">
                                    <div className="flex justify-between items-center bg-[#122442] p-6 rounded-3xl shadow-xl border border-white/5">
                                        <div>
                                            <h3 className="font-heading font-black text-xl text-white">Inscritos no Evento</h3>
                                            <p className="text-white/40 text-[13px] font-medium">Controle e exportação de fichas.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => setShowFilters(!showFilters)}
                                                className={`rounded-full gap-2 border shadow-xl transition-all ${showFilters ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                            >
                                                <Filter className="w-4 h-4" /> {showFilters ? 'Ocultar Filtros' : 'Filtros'}
                                            </Button>
                                            <Button
                                                onClick={() => setIsExportingPDF(true)}
                                                className="rounded-full gap-2 px-6 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 font-black transition-all"
                                            >
                                                <Download className="w-4 h-4" /> Exportar PDF
                                            </Button>
                                        </div>
                                    </div>

                                    {showFilters && (
                                        <div className="bg-[#122442] p-6 rounded-3xl shadow-xl border border-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Buscar por Nome</label>
                                                    <div className="relative">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                        <Input
                                                            value={searchInscricao}
                                                            onChange={(e) => setSearchInscricao(e.target.value)}
                                                            placeholder="Digite o nome do participante..."
                                                            className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 pl-11"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Filtrar por ATEFFA</label>
                                                    <Select value={ateffaFilter} onValueChange={setAteffaFilter}>
                                                        <SelectTrigger className="rounded-xl h-12 bg-white/5 border-white/10 text-white">
                                                            <SelectValue placeholder="Selecione a ATEFFA" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#122442] border-white/10 text-white">
                                                            {ateffasList.map(ateffa => (
                                                                <SelectItem key={ateffa} value={ateffa}>{ateffa}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-[#122442] rounded-[2rem] border border-white/5 shadow-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-white/70">
                                                <thead className="bg-white/5 border-b border-white/5 text-white/40 uppercase text-[10px] font-black tracking-widest">
                                                    <tr>
                                                        <th className="px-6 py-5">Nome Completo</th>
                                                        <th className="px-6 py-5">ATEFFA</th>
                                                        <th className="px-6 py-5">E-mail</th>
                                                        <th className="px-6 py-5">Data</th>
                                                        <th className="px-6 py-5">Status</th>
                                                        <th className="px-6 py-5">Ação</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {filteredInscricoes.length > 0 ? (
                                                        filteredInscricoes.map((insc: any) => (
                                                            <tr key={insc.id} className="hover:bg-white/5 transition-colors group">
                                                                <td className="px-6 py-5 font-bold text-white group-hover:text-primary transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        {insc.foto ? (
                                                                            <img src={insc.foto} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                                                        ) : (
                                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                                                <User className="w-4 h-4 text-white/20" />
                                                                            </div>
                                                                        )}
                                                                        {insc.nomeCompleto}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 font-medium">{insc.ateffa}</td>
                                                                <td className="px-6 py-5 font-medium">{insc.email}</td>
                                                                <td className="px-6 py-5 opacity-60">{insc.data}</td>
                                                                <td className="px-6 py-5">
                                                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">{insc.status}</span>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedInscricao(insc);
                                                                            setIsViewingInscricao(true);
                                                                        }}
                                                                        className="rounded-full text-primary border border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all font-bold"
                                                                    >
                                                                        Ver Ficha
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-12 text-center text-white/20 font-bold uppercase tracking-widest">
                                                                Nenhuma inscrição realizada ainda.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Modal Detalhes da Inscrição */}
                                    <Dialog open={isViewingInscricao} onOpenChange={setIsViewingInscricao}>
                                        <DialogContent className="max-w-4xl bg-[#122442] text-white border-white/10 rounded-[2.5rem] p-0 overflow-hidden">
                                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                                <DialogHeader className="mb-0 flex flex-row items-center justify-between">
                                                    <div>
                                                        <DialogTitle className="font-heading font-black text-2xl text-white uppercase tracking-tighter">
                                                            Ficha de Inscrição
                                                        </DialogTitle>
                                                        <p className="text-white/40 text-sm font-medium">Visualize e edite os dados do participante.</p>
                                                    </div>
                                                </DialogHeader>

                                                {selectedInscricao && (
                                                    <div className="space-y-8 mt-8">
                                                        {/* Header com Foto */}
                                                        <div className="flex flex-col md:flex-row gap-8 items-center bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                                            <div className="relative group">
                                                                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/10 shadow-2xl overflow-hidden relative">
                                                                    {selectedInscricao.foto ? (
                                                                        <img src={selectedInscricao.foto} alt="Perfil" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <User className="w-12 h-12 text-white/10" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 text-center md:text-left">
                                                                <h4 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">{selectedInscricao.nomeCompleto}</h4>
                                                                <div className="text-primary font-bold text-sm tracking-widest uppercase">{selectedInscricao.ateffa}</div>
                                                                <div className="text-white/40 text-xs mt-2 font-medium italic">ID: #{selectedInscricao.id} — Inscrito em: {selectedInscricao.data}</div>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 text-center">
                                                                    Status: {selectedInscricao.status}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Grid de Dados */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {/* Coluna 1: Dados Pessoais */}
                                                            <div className="space-y-6">
                                                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                                                                    <div className="w-4 h-1 bg-primary rounded-full" /> Dados Pessoais
                                                                </h5>

                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Nome Completo</label>
                                                                    <Input
                                                                        value={selectedInscricao.nomeCompleto}
                                                                        onChange={(e) => setSelectedInscricao({ ...selectedInscricao, nomeCompleto: e.target.value })}
                                                                        className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">E-mail</label>
                                                                    <Input
                                                                        value={selectedInscricao.email}
                                                                        onChange={(e) => setSelectedInscricao({ ...selectedInscricao, email: e.target.value })}
                                                                        className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
                                                                    />
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Telefone</label>
                                                                        <Input
                                                                            value={selectedInscricao.telefone}
                                                                            onChange={(e) => setSelectedInscricao({ ...selectedInscricao, telefone: e.target.value })}
                                                                            className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">WhatsApp</label>
                                                                        <Input
                                                                            value={selectedInscricao.celularWhatsapp}
                                                                            onChange={(e) => setSelectedInscricao({ ...selectedInscricao, celularWhatsapp: e.target.value })}
                                                                            className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Associação (ATEFFA)</label>
                                                                    <Select
                                                                        value={selectedInscricao.ateffa}
                                                                        onValueChange={(v) => setSelectedInscricao({ ...selectedInscricao, ateffa: v })}
                                                                    >
                                                                        <SelectTrigger className="rounded-xl h-12 bg-white/5 border-white/10 text-white">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-[#122442] border-white/10 text-white">
                                                                            {associacoes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Cargo</label>
                                                                    <Select
                                                                        value={selectedInscricao.cargo}
                                                                        onValueChange={(v) => setSelectedInscricao({ ...selectedInscricao, cargo: v })}
                                                                    >
                                                                        <SelectTrigger className="rounded-xl h-12 bg-white/5 border-white/10 text-white">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-[#122442] border-white/10 text-white">
                                                                            {cargos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>

                                                            {/* Coluna 2: Localização e Adicionais */}
                                                            <div className="space-y-6">
                                                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                                                                    <div className="w-4 h-1 bg-primary rounded-full" /> Localização & Extras
                                                                </h5>

                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Endereço Completo</label>
                                                                    <Input
                                                                        value={selectedInscricao.endereco}
                                                                        onChange={(e) => setSelectedInscricao({ ...selectedInscricao, endereco: e.target.value })}
                                                                        className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
                                                                    />
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Cidade</label>
                                                                        <Input
                                                                            value={selectedInscricao.cidade}
                                                                            onChange={(e) => setSelectedInscricao({ ...selectedInscricao, cidade: e.target.value })}
                                                                            className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">CEP</label>
                                                                        <Input
                                                                            value={selectedInscricao.cep}
                                                                            onChange={(e) => setSelectedInscricao({ ...selectedInscricao, cep: e.target.value })}
                                                                            className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Forma de Deslocamento</label>
                                                                    <Select
                                                                        value={selectedInscricao.formaDeslocamento}
                                                                        onValueChange={(v) => setSelectedInscricao({ ...selectedInscricao, formaDeslocamento: v })}
                                                                    >
                                                                        <SelectTrigger className="rounded-xl h-12 bg-white/5 border-white/10 text-white">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-[#122442] border-white/10 text-white">
                                                                            <SelectItem value="Transporte Aéreo">Transporte Aéreo</SelectItem>
                                                                            <SelectItem value="Ônibus">Ônibus</SelectItem>
                                                                            <SelectItem value="Veículo Próprio">Veículo Próprio</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Problema de Saúde?</label>
                                                                        <Select
                                                                            value={selectedInscricao.problemaSaude}
                                                                            onValueChange={(v) => setSelectedInscricao({ ...selectedInscricao, problemaSaude: v })}
                                                                        >
                                                                            <SelectTrigger className="rounded-xl h-12 bg-white/5 border-white/10 text-white">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="bg-[#122442] border-white/10 text-white">
                                                                                <SelectItem value="SIM">SIM</SelectItem>
                                                                                <SelectItem value="NÃO">NÃO</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Qual?</label>
                                                                        <Input
                                                                            disabled={selectedInscricao.problemaSaude === "NÃO"}
                                                                            value={selectedInscricao.qualSaude || ""}
                                                                            onChange={(e) => setSelectedInscricao({ ...selectedInscricao, qualSaude: e.target.value })}
                                                                            className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Acompanhante?</label>
                                                                        <Select
                                                                            value={selectedInscricao.acompanhantes}
                                                                            onValueChange={(v) => setSelectedInscricao({ ...selectedInscricao, acompanhantes: v })}
                                                                        >
                                                                            <SelectTrigger className="rounded-xl h-12 bg-white/5 border-white/10 text-white">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="bg-[#122442] border-white/10 text-white">
                                                                                <SelectItem value="SIM">SIM</SelectItem>
                                                                                <SelectItem value="NÃO">NÃO</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Nome Acomp.</label>
                                                                        <Input
                                                                            disabled={selectedInscricao.acompanhantes === "NÃO"}
                                                                            value={selectedInscricao.nomeAcompanhante || ""}
                                                                            onChange={(e) => setSelectedInscricao({ ...selectedInscricao, nomeAcompanhante: e.target.value })}
                                                                            className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                                            <Button
                                                                onClick={() => handleExportIndividualPDF(selectedInscricao)}
                                                                className="rounded-full px-8 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 h-14 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 flex gap-2"
                                                            >
                                                                <Download className="w-4 h-4" /> Baixar Ficha PDF
                                                            </Button>

                                                            <div className="flex gap-3">
                                                                <Button
                                                                    variant="ghost"
                                                                    onClick={() => setIsViewingInscricao(false)}
                                                                    className="rounded-full px-8 text-white/40 hover:text-white"
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    onClick={handleSaveEditedInscricao}
                                                                    className="rounded-full px-12 bg-emerald-500 hover:bg-emerald-600 h-14 font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20"
                                                                >
                                                                    Salvar Alterações
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )}

                            {/* Usuários Tab (Admin Only) */}
                            {activeTab === "usuarios" && user.role === "admin" && (
                                <div className="space-y-6 pb-12">
                                    <div className="flex justify-between items-center bg-[#122442] p-6 rounded-3xl shadow-xl border border-white/5">
                                        <div>
                                            <h3 className="font-heading font-black text-xl text-white">Controle de Acesso</h3>
                                            <p className="text-white/40 text-[13px] font-medium">Gerencie quem pode publicar conteúdos na plataforma.</p>
                                        </div>
                                        <Button
                                            onClick={handleAddNewUser}
                                            className="rounded-full gap-2 px-6 shadow-lg shadow-primary/20"
                                        >
                                            <Plus className="w-4 h-4" /> Novo Usuário
                                        </Button>
                                    </div>

                                    <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
                                        <DialogContent className="max-w-4xl bg-[#122442] text-white border-white/10 rounded-[2.5rem] p-0 overflow-hidden">
                                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                                <DialogHeader className="mb-8">
                                                    <DialogTitle className="font-heading font-black text-2xl text-white uppercase tracking-tighter">
                                                        {newUser.id ? "Editando Usuário" : "Novo Cadastro na Plataforma"}
                                                    </DialogTitle>
                                                    <p className="text-white/40 text-sm font-medium">Controle os níveis de acesso ao painel administrativo.</p>
                                                </DialogHeader>

                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Nome Completo</label>
                                                            <Input
                                                                value={newUser.name}
                                                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                                placeholder="Ex: João da Silva"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">E-mail de Acesso</label>
                                                            <Input
                                                                type="email"
                                                                value={newUser.email}
                                                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                                placeholder="exemplo@conteffa.com.br"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Senha Temporária</label>
                                                            <Input
                                                                type="password"
                                                                value={newUser.password}
                                                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                                placeholder="********"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Telefone de Contato</label>
                                                            <Input
                                                                value={newUser.phone}
                                                                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                                                placeholder="(00) 00000-0000"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Cargo na ANTEFFA</label>
                                                            <Input
                                                                value={newUser.cargo}
                                                                onChange={(e) => setNewUser({ ...newUser, cargo: e.target.value })}
                                                                placeholder="Ex: Secretário General"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Associação Regional</label>
                                                            <Input
                                                                value={newUser.association}
                                                                onChange={(e) => setNewUser({ ...newUser, association: e.target.value })}
                                                                placeholder="Ex: ANTEFFA Brasília"
                                                                className="rounded-xl h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setIsAddingUser(false)}
                                                            className="rounded-full px-8 text-white/40 hover:text-white"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button
                                                            onClick={handleSaveUser}
                                                            className="rounded-full px-12 bg-primary h-14 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                                        >
                                                            {newUser.id ? "Salvar Alterações" : "Cadastrar Usuário"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    <div className="bg-[#122442] rounded-[2rem] border border-white/5 shadow-xl overflow-hidden">
                                        <div className="p-6 border-b border-white/5">
                                            <h4 className="font-black text-white/30 text-[10px] uppercase tracking-[0.2em]">Membros Ativos na Plataforma</h4>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-white/70">
                                                <thead className="bg-white/5 text-white/40 font-black uppercase text-[10px] tracking-widest">
                                                    <tr>
                                                        <th className="px-6 py-5">Usuário</th>
                                                        <th className="px-6 py-5">Associação</th>
                                                        <th className="px-6 py-5">Cargo</th>
                                                        <th className="px-6 py-5">Status</th>
                                                        <th className="px-6 py-5">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {activeUsers.map((u: any) => (
                                                        <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                                            <td className="px-6 py-5 flex items-center gap-4">
                                                                <div className="relative">
                                                                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary overflow-hidden border border-white/10 shadow-lg">
                                                                        {u.photo ? <img src={u.photo} alt={u.name} className="w-full h-full object-cover" /> : u.name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    {u.role === 'admin' && (
                                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#122442]">
                                                                            <ShieldCheck className="w-3 h-3" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-white flex items-center gap-2 group-hover:text-primary transition-colors">
                                                                        {u.name}
                                                                        {u.role === 'admin' && (
                                                                            <span className="text-[8px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-amber-500/20">Admin</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] text-white/30 font-medium">{u.email}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 font-bold text-white/60">{u.association}</td>
                                                            <td className="px-6 py-5 text-white/40 font-medium">{u.cargo}</td>
                                                            <td className="px-6 py-5">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${u.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/30 border-white/5'
                                                                    }`}>
                                                                    {u.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 flex gap-1">
                                                                <Button
                                                                    onClick={() => handleEditUser(u)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="rounded-full text-white/40 hover:text-white hover:bg-white/10"
                                                                >
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    onClick={() => setUserToDelete(u)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="rounded-full text-red-400 hover:bg-red-400/10"
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
                                <div className="max-w-4xl mx-auto space-y-8 pb-12">
                                    <div className="bg-[#122442] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />

                                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                            <div className="relative group">
                                                <div className="w-36 h-36 rounded-full bg-white/5 flex items-center justify-center border-4 border-white/10 shadow-2xl overflow-hidden relative">
                                                    {user.photo ? (
                                                        <img src={user.photo} alt="Perfil" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-16 h-16 text-white/10" />
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
                                                    className="absolute bottom-1 right-1 w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#122442] hover:scale-110 transition-transform"
                                                >
                                                    <Camera className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="text-center md:text-left flex-1">
                                                <h2 className="text-4xl font-heading font-black text-white mb-2">{user.name}</h2>
                                                <p className="text-primary font-black uppercase tracking-[0.2em] text-[11px] mb-6">{user.cargo} <span className="mx-2 text-white/20">•</span> {user.association}</p>
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                                    <span className="flex items-center gap-2 text-white/60 text-xs font-bold bg-white/5 px-5 py-2.5 rounded-full border border-white/5">
                                                        <Mail className="w-4 h-4 text-primary" /> {user.email}
                                                    </span>
                                                    <span className="flex items-center gap-2 text-white/60 text-xs font-bold bg-white/5 px-5 py-2.5 rounded-full border border-white/5">
                                                        <Shield className="w-4 h-4 text-primary" /> Perfil: {user.role === 'admin' ? 'Administrador' : 'Editor'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-[#122442] p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Settings className="w-4 h-4 text-primary" />
                                                </div>
                                                <h4 className="font-black text-white uppercase text-xs tracking-widest">Dados do Perfil</h4>
                                            </div>
                                            <div className="space-y-5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Nome Completo</label>
                                                    <Input
                                                        value={user.name}
                                                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                                                        className="rounded-xl bg-white/5 border-white/10 text-white h-12"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Telefone</label>
                                                    <Input
                                                        value={user.phone}
                                                        onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                                        placeholder="(00) 00000-0000"
                                                        className="rounded-xl bg-white/5 border-white/10 text-white h-12"
                                                    />
                                                </div>
                                                <Button onClick={handleUpdateProfile} className="w-full rounded-full bg-primary h-12 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 mt-4">Salvar Alterações</Button>
                                            </div>
                                        </div>

                                        <div className="bg-[#122442] p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                    <Lock className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <h4 className="font-black text-white uppercase text-xs tracking-widest">Segurança da Conta</h4>
                                            </div>
                                            <div className="space-y-5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Nova Senha</label>
                                                    <Input
                                                        type="password"
                                                        placeholder="********"
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                        className="rounded-xl bg-white/5 border-white/10 text-white h-12"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Confirmar Nova Senha</label>
                                                    <Input
                                                        type="password"
                                                        placeholder="********"
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                        className="rounded-xl bg-white/5 border-white/10 text-white h-12"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleUpdatePassword}
                                                    className="w-full rounded-full bg-primary hover:bg-primary/90 text-white h-12 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 border-none mt-4"
                                                >
                                                    Atualizar Senha
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
                            className="bg-[#122442] p-8 rounded-[2.5rem] shadow-2xl relative z-10 max-w-sm w-full text-center border border-white/10"
                        >
                            <div className="w-20 h-20 bg-red-400/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400 border border-red-400/20">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-white mb-2 uppercase tracking-tighter">Tem certeza?</h3>
                            <p className="text-white/40 mb-8 text-sm font-medium">
                                Você está prestes a excluir o usuário <strong className="text-white">{userToDelete.name}</strong>.<br />Esta ação é irreversível.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    className="rounded-full h-12 bg-red-500 hover:bg-red-600 font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
                                    onClick={confirmDelete}
                                >
                                    Confirmar Exclusão
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="rounded-full h-12 text-white/40 hover:text-white hover:bg-white/5 font-black uppercase text-[10px] tracking-widest"
                                    onClick={() => setUserToDelete(null)}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Exportar PDF */}
            <Dialog open={isExportingPDF} onOpenChange={setIsExportingPDF}>
                <DialogContent className="bg-[#0B1B32] border-white/10 text-white rounded-[2.5rem] max-w-lg p-0 overflow-hidden shadow-2xl">
                    <div className="bg-primary/10 p-8 border-b border-white/5 relative text-left">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] pointer-events-none" />
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                <Download className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-heading font-black uppercase tracking-tight text-white">Exportar Relatório</DialogTitle>
                                <p className="text-white/40 text-sm font-medium">Selecione o tipo de detalhamento do PDF.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-4 text-left">
                        {[
                            { id: "simples", title: "Relatório Simples", desc: "Apenas listagem com nome e ATEFFA." },
                            { id: "medio", title: "Relatório Médio", desc: "Listagem com dados de contato e status." },
                            { id: "completo", title: "Relatório Completo", desc: "Ficha individual com todos os dados e foto." },
                        ].map((type) => (
                            <div
                                key={type.id}
                                onClick={() => setExportSettings({ ...exportSettings, reportType: type.id as any })}
                                className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer flex items-center gap-4 group ${exportSettings.reportType === type.id
                                    ? 'bg-primary/10 border-primary/40 shadow-lg'
                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${exportSettings.reportType === type.id
                                    ? 'border-primary bg-primary'
                                    : 'border-white/20'
                                    }`}>
                                    {exportSettings.reportType === type.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white group-hover:text-primary transition-colors leading-tight">{type.title}</h4>
                                    <p className="text-xs text-white/40 mt-0.5">{type.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-8 bg-black/20 flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsExportingPDF(false)}
                            className="flex-1 rounded-xl text-white/40 hover:text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleExportPDF}
                            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black text-xs uppercase tracking-widest h-12 shadow-lg shadow-emerald-500/20"
                        >
                            Gerar Arquivo PDF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminDashboard;
