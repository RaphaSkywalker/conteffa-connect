import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { CartaPresidente, Historico, Evento, Regimento } from "./pages/Apresentacao";
import Programacao from "./pages/Programacao";
import Inscricao from "./pages/Inscricao";
import Noticias from "./pages/Noticias";
import Reserva from "./pages/Reserva";
import { LocalPage, Atracoes, ComoChegar, Transfer, Hospedagem, Passagem, Apoio } from "./pages/Local";
import Teses from "./pages/Teses";
import Indicativos from "./pages/Indicativos";
import Galeria from "./pages/Galeria";
import Contato from "./pages/Contato";
import Comissao from "./pages/Comissao";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";

import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/apresentacao/carta-presidente" element={<CartaPresidente />} />
          <Route path="/apresentacao/historico" element={<Historico />} />
          <Route path="/apresentacao/evento" element={<Evento />} />
          <Route path="/apresentacao/regimento" element={<Regimento />} />
          <Route path="/programacao" element={<Programacao />} />
          <Route path="/comissao" element={<Comissao />} />
          <Route path="/inscricao" element={<Inscricao />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/reserva" element={<Reserva />} />
          <Route path="/local" element={<LocalPage />} />
          <Route path="/local/atracoes" element={<Atracoes />} />
          <Route path="/local/como-chegar" element={<ComoChegar />} />
          <Route path="/local/transfer" element={<Transfer />} />
          <Route path="/local/hospedagem" element={<Hospedagem />} />
          <Route path="/local/passagem" element={<Passagem />} />
          <Route path="/local/apoio" element={<Apoio />} />
          <Route path="/teses" element={<Teses />} />
          <Route path="/indicativos" element={<Indicativos />} />
          <Route path="/galeria" element={<Galeria />} />
          <Route path="/contato" element={<Contato />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
