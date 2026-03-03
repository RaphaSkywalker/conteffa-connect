import { motion } from "framer-motion";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  className?: string;
  label?: string;
}

const SectionTitle = ({ title, subtitle, centered = true, light = false, className, label }: SectionTitleProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`${className || "mb-16 md:mb-20"} ${centered ? "text-center" : ""}`}
  >
    <div className={`${light ? "text-[#00ABE5]" : "text-primary"} font-bold uppercase tracking-[0.2em] text-xs md:text-sm mb-3 ${centered ? "mx-auto" : ""}`}>
      {label || title.split(" ")[0]}
    </div>
    <h2 className={`text-3xl md:text-5xl lg:text-6xl font-heading font-black mb-6 leading-[1.1] ${light ? "text-primary-foreground" : "text-foreground"}`}>
      {title}
    </h2>
    {subtitle && (
      <p className={`text-lg md:text-xl max-w-2xl font-body ${centered ? "mx-auto" : ""} ${light ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        {subtitle}
      </p>
    )}
    {!centered && <div className="mt-8 h-1.5 w-20 rounded-full bg-primary" />}
  </motion.div>
);

export default SectionTitle;
