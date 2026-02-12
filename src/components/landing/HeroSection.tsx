import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Trophy, Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";

import freefireBanner from "@/assets/games/freefire-banner.jpg";
import pubgBanner from "@/assets/games/pubg-banner.jpg";
import ludoBanner from "@/assets/games/ludo-banner.jpg";

interface HeroSectionProps {
  onLogin: () => void;
  onRegister: () => void;
}

const slides = [
  { image: freefireBanner, title: "FREE FIRE", subtitle: "Battle Royale Tournaments" },
  { image: pubgBanner, title: "PUBG MOBILE", subtitle: "Squad & Solo Matches" },
  { image: ludoBanner, title: "LUDO", subtitle: "Classic Board Game Battles" },
];

const HeroSection = ({ onLogin, onRegister }: HeroSectionProps) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Sliding Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
        </motion.div>
      </AnimatePresence>

      {/* Slide indicators */}
      <div className="absolute bottom-32 md:bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-primary neon-glow" : "w-4 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Nav arrows */}
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 glass rounded-full p-2 hover:neon-glow transition-all"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 glass rounded-full p-2 hover:neon-glow transition-all"
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass neon-border mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Free Credits • Real Tournaments</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight mb-4"
        >
          <span className="text-foreground">BILLO</span>{" "}
          <span className="text-gradient-neon">BATTLE</span>
          <br />
          <span className="text-foreground">ZONE</span>
        </motion.h1>

        {/* Current game name */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <span className="text-xl md:text-2xl font-display font-bold text-primary neon-text">
              {slides[current].title}
            </span>
            <span className="text-muted-foreground ml-2">— {slides[current].subtitle}</span>
          </motion.div>
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Earn free credits through daily missions, spin the wheel, and gaming quizzes. 
          Use credits to join tournaments and win real cash prizes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={onRegister}
            size="lg"
            className="gradient-neon text-primary-foreground font-display font-bold text-lg px-8 py-6 neon-glow hover:scale-105 transition-transform"
          >
            <Gamepad2 className="w-5 h-5 mr-2" />
            Start Playing Free
          </Button>
          <Button
            onClick={onLogin}
            variant="outline"
            size="lg"
            className="border-primary/30 text-primary hover:bg-primary/10 font-display font-bold text-lg px-8 py-6"
          >
            Login
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          {[
            { value: "10K+", label: "Players" },
            { value: "500+", label: "Tournaments" },
            { value: "৳50L+", label: "Won" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-display font-bold text-primary neon-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
