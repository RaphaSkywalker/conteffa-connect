import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const eventDate = new Date("2026-11-12T08:00:00").getTime();

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const now = Date.now();
    const diff = Math.max(0, eventDate - now);
    return {
      dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
      horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center gap-4 sm:gap-6 md:gap-8">
      {Object.entries(timeLeft).map(([label, value], i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="flex flex-col items-center"
        >
          <div className="w-[100px] h-24 sm:w-32 sm:h-32 md:w-44 md:h-40 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-1 md:gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.3)] group hover:border-primary/50 transition-all duration-500">
            <span className="text-3xl sm:text-5xl md:text-[64px] font-black text-white leading-none tracking-tighter group-hover:scale-110 transition-transform duration-500">
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm text-primary font-black uppercase tracking-[0.3em]">
              {label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Countdown;
