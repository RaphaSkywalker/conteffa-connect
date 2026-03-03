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
      minutos: Math.floor((diff / (1000 * 60)) % 60),
      segundos: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center gap-1.5 sm:gap-3 md:gap-4">
      {Object.entries(timeLeft).map(([label, value], i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="flex flex-col items-center"
        >
          <div className="w-[65px] h-16 sm:w-20 sm:h-20 md:w-32 md:h-28 rounded-xl md:rounded-2xl bg-primary/20 border border-primary/10 flex flex-col items-center justify-center gap-0.5 md:gap-1 shadow-sm">
            <span className="text-2xl sm:text-3xl md:text-[40px] font-black text-white leading-none">
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-xs text-primary font-bold uppercase tracking-wider">
              {label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Countdown;
