import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const menuItems = [
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
  {
    label: "Congresso",
    path: "#",
    children: [
      { label: "Programação", path: "/programacao" },
      { label: "Comissão", path: "/comissao" },
      { label: "Inscrição", path: "/inscricao" },
      {
        label: "Local",
        path: "/local",
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
    ],
  },
  { label: "Notícias", path: "/noticias" },
  { label: "Contato", path: "/contato" },
];

const DesktopMenuItem = ({
  item,
  level = 0,
  index = 0,
  total = 0
}: {
  item: any;
  level?: number;
  index?: number;
  total?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => hasChildren && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={item.path}
        className={`text-[15px] font-medium uppercase tracking-wider transition-all duration-300 flex items-center justify-between gap-1.5 ${level > 0
          ? `w-full px-6 py-2 ${index === 0 ? "rounded-t-lg" : index === total - 1 ? "rounded-b-lg" : "rounded-none"
          } ${location.pathname === item.path
            ? "text-white bg-primary"
            : "text-white/70 hover:text-white hover:bg-white/10"
          }`
          : `px-4 py-2 rounded-full ${location.pathname === item.path
            ? "text-white bg-primary shadow-lg shadow-primary/30"
            : "text-white/80 hover:text-white hover:bg-white/10"
          }`
          }`}
      >
        <span>{item.label}</span>
        {hasChildren && (
          <ChevronDown className={`w-4 h-4 transition-transform ${level > 0 ? "-rotate-90 text-foreground/40" : ""}`} />
        )}
      </Link>

      {hasChildren && (
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: level > 0 ? 10 : 0, y: level > 0 ? 0 : 8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: level > 0 ? 10 : 0, y: level > 0 ? 0 : 8, scale: 0.95 }}
              className={`absolute ${level > 0 ? "left-full -top-4 pl-4" : "top-full left-0 pt-3"} z-50`}
            >
              <div className="w-64 rounded-lg bg-[#0B1B32]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-visible">
                {item.children.map((child: any, idx: number) => (
                  <DesktopMenuItem
                    key={child.label}
                    item={child}
                    level={level + 1}
                    index={idx}
                    total={item.children.length}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

const MobileMenuItem = ({ item, setMobileOpen }: { item: any; setMobileOpen: (open: boolean) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <Link
          to={item.path}
          onClick={() => !hasChildren && setMobileOpen(false)}
          className="flex-1 px-4 py-2.5 text-[15px] font-medium uppercase tracking-wider text-white/80 hover:text-primary transition-colors"
        >
          {item.label}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white/60"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0B1B32]/40 backdrop-blur-md mx-2 rounded-2xl border border-white/5"
          >
            {item.children.map((child: any) => (
              <MobileMenuItem key={child.label} item={child} setMobileOpen={setMobileOpen} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-none">
      <div className="container mx-auto flex items-center justify-between h-20 md:h-24 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="CONTEFFA" className="h-7 sm:h-9 md:h-12 w-auto object-contain" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {menuItems.map((item, idx) => (
            <DesktopMenuItem
              key={item.label}
              item={item}
              index={idx}
              total={menuItems.length}
            />
          ))}
          <Link
            to="/admin"
            className="ml-2 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-primary transition-all duration-300"
            title="Área Administrativa"
          >
            <ShieldCheck className="w-5 h-5" />
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-white"
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
            className="lg:hidden overflow-hidden glass border-t border-white/10"
          >
            <nav className="container mx-auto py-6 flex flex-col gap-1 max-h-[80vh] overflow-y-auto px-4">
              {menuItems.map((item) => (
                <MobileMenuItem key={item.label} item={item} setMobileOpen={setMobileOpen} />
              ))}
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="mt-4 flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-primary transition-all"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[15px] font-medium uppercase tracking-wider">Área Admin</span>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
