import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
  { label: "Home", path: "/" },
  {
    label: "Apresentação",
    path: "/apresentacao",
    children: [
      { label: "Carta do Presidente", path: "/apresentacao/carta-presidente" },
      { label: "Histórico", path: "/apresentacao/historico" },
      { label: "O Evento", path: "/apresentacao/evento" },
      { label: "Regimento do Congresso", path: "/apresentacao/regimento" },
    ],
  },
  { label: "Programação", path: "/programacao" },
  { label: "Inscrição", path: "/inscricao" },
  { label: "Notícias", path: "/noticias" },
  {
    label: "Local",
    path: "/local",
    children: [
      { label: "Atrações Turísticas", path: "/local/atracoes" },
      { label: "Como Chegar", path: "/local/como-chegar" },
      { label: "Empresas de Transfer", path: "/local/transfer" },
      { label: "Hospedagem", path: "/local/hospedagem" },
      { label: "Passagem Aérea", path: "/local/passagem" },
      { label: "Serviço de Apoio", path: "/local/apoio" },
    ],
  },
  {
    label: "Teses",
    path: "/teses",
    children: [
      { label: "Caderno de Teses", path: "/teses/caderno" },
      { label: "Regulamento", path: "/teses/regulamento" },
      { label: "Visualizar Teses", path: "/teses/visualizar" },
    ],
  },
  { label: "Indicativos", path: "/indicativos" },
  { label: "Galeria", path: "/galeria" },
  { label: "Contato", path: "/contato" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="font-display text-xl md:text-2xl font-bold text-primary tracking-tight">
          CONTEFFA
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {menuItems.map((item) => (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => item.children && setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                to={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                  location.pathname === item.path
                    ? "text-primary bg-primary/10"
                    : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                }`}
              >
                {item.label}
                {item.children && <ChevronDown className="w-3.5 h-3.5" />}
              </Link>

              {item.children && openDropdown === item.label && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full left-0 mt-1 w-56 rounded-lg bg-card border border-border shadow-lg py-2"
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-foreground"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden bg-card border-t border-border"
          >
            <nav className="container mx-auto py-4 flex flex-col gap-1">
              {menuItems.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <Link
                      to={item.path}
                      onClick={() => !item.children && setMobileOpen(false)}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        onClick={() =>
                          setOpenDropdown(openDropdown === item.label ? null : item.label)
                        }
                        className="p-2 text-muted-foreground"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            openDropdown === item.label ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {item.children && openDropdown === item.label && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileOpen(false)}
                            className="block pl-8 pr-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
