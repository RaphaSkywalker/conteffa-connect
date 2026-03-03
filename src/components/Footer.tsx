import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="container mx-auto section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <img src={logo} alt="CONTEFFA" className="h-10 md:h-12 w-auto mb-6 object-contain" />
            <p className="text-white/60 text-base leading-relaxed mb-8">
              O IX CONTEFFA 2026 é o maior Congresso Nacional da categoria, reunindo profissionais para debater o futuro e construir novas perspectivas de 12 a 16 de novembro.
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300"
                >
                  <Icon className="w-5 h-5 text-white" />
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

          {/* Contact & Organization */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-navy-foreground/60">
              Contato
            </h4>
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-navy-foreground/70">
                <Mail className="w-4 h-4 shrink-0" />
                <span>contato@conteffa.com.br</span>
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

            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-navy-foreground/60">
              Organização
            </h4>
            <div className="flex flex-col gap-4">
              <img src="/logo-anteffa.png" alt="ANTEFFA" className="h-[22px] w-auto object-contain self-start" />
              <div className="text-xs text-navy-foreground/60 leading-relaxed font-medium">
                SHN – QD 02, BL J, ED. Garvey Park Hotel<br />
                SL 09, 13, 17 e 21 - Asa Norte<br />
                CEP: 70702-909<br />
                Brasília – DF
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-foreground/10 text-center flex flex-col items-center gap-2">
          <p className="text-sm text-navy-foreground/50">
            © 2026 IX CONTEFFA. Todos os direitos reservados.
          </p>
          <a href="https://instagram.com/raphaskywalker" target="_blank" rel="noopener noreferrer" className="text-xs text-navy-foreground/40 hover:text-primary transition-colors flex items-center gap-1">
            Desenvolvido por Raphael Souza <span className="text-primary/70 font-medium">@raphaskywalker</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
