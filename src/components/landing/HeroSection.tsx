import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Trophy, Gamepad2 } from "lucide-react";

interface HeroSectionProps {
  onLogin: () => void;
  onRegister: () => void;
}

const HeroSection = ({ onLogin, onRegister }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Animated background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-neon" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-purple/5 rounded-full blur-[100px] animate-pulse-neon" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[200px]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(var(--neon)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--neon)) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
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
          className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight mb-6"
        >
          <span className="text-foreground">BILLO</span>{" "}
          <span className="text-gradient-neon">BATTLE</span>
          <br />
          <span className="text-foreground">ZONE</span>
        </motion.h1>

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
