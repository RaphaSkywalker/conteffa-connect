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
    <div className="flex gap-3 md:gap-6">
      {Object.entries(timeLeft).map(([label, value], i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + i * 0.1 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-primary/20 backdrop-blur-md border border-primary-foreground/20 flex items-center justify-center">
            <span className="text-2xl md:text-3xl font-bold text-primary-foreground">
              {String(value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs md:text-sm mt-2 text-primary-foreground/70 uppercase tracking-wider">
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default Countdown;
