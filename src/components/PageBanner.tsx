import { motion } from "framer-motion";
import heroBg from "@/assets/hero-home-v3.jpg";

interface PageBannerProps {
    title: string;
}

const PageBanner = ({ title }: PageBannerProps) => {
    return (
        <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden -mt-20 md:-mt-28">
            {/* Background Image & Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-fixed bg-center"
                style={{ backgroundImage: `url(${heroBg})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B1B32]/95 via-[#0B1B32]/80 to-[#00ABE5]/40" />

            {/* Subtle Logo Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-[0.04] pointer-events-none">
                <img src="/bg-logo.png" alt="" className="w-full h-full object-contain" />
            </div>

            {/* Page Title */}
            <div className="relative z-10 text-center px-4 mt-20">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl md:text-5xl lg:text-6xl font-heading font-black text-white tracking-widest uppercase drop-shadow-xl opacity-60"
                >
                    {title}
                </motion.h1>
            </div>
        </section>
    );
};

export default PageBanner;
