import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="container mx-auto section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">CONTEFFA</h3>
            <p className="text-navy-foreground/70 text-sm leading-relaxed mb-6">
              IX CONTEFFA 2026 — Congresso Nacional. 12 a 16 de novembro de 2026.
              Unindo profissionais para debater o futuro.
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-navy-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-navy-foreground/60">
              Navegação
            </h4>
            <div className="flex flex-col gap-2.5">
              {["Home", "Apresentação", "Programação", "Inscrição", "Notícias"].map((item) => (
                <Link
                  key={item}
                  to={item === "Home" ? "/" : `/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                  className="text-sm text-navy-foreground/70 hover:text-navy-foreground transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-navy-foreground/60">
              Mais
            </h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Local", path: "/local" },
                { label: "Teses", path: "/teses" },
                { label: "Indicativos", path: "/indicativos" },
                { label: "Galeria", path: "/galeria" },
                { label: "Contato", path: "/contato" },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-sm text-navy-foreground/70 hover:text-navy-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-navy-foreground/60">
              Contato
            </h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-navy-foreground/70">
                <Mail className="w-4 h-4 shrink-0" />
                <span>contato@conteffa.org.br</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-navy-foreground/70">
                <Phone className="w-4 h-4 shrink-0" />
                <span>(61) 3333-0000</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-navy-foreground/70">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Brasília - DF</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-foreground/10 text-center">
          <p className="text-sm text-navy-foreground/50">
            © 2026 IX CONTEFFA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
