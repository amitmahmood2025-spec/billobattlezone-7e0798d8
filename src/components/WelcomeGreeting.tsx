import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Sun, Moon, Coffee, Flame } from "lucide-react";

interface WelcomeGreetingProps {
  username: string;
  currentStreak: number;
  lastLoginDate: string | null;
}

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

const getDaysSinceLastLogin = (lastLogin: string | null): number => {
  if (!lastLogin) return 999;
  const last = new Date(lastLogin);
  const now = new Date();
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
};

const greetings = {
  morning: {
    icon: <Coffee className="w-8 h-8" />,
    title: "Good Morning",
    subtitle: "Rise & grind! New tasks are waiting 🔥",
    emoji: "☀️",
  },
  afternoon: {
    icon: <Sun className="w-8 h-8" />,
    title: "Good Afternoon",
    subtitle: "Keep the momentum going! Earn more credits 💪",
    emoji: "🌤️",
  },
  evening: {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Good Evening",
    subtitle: "Wind down with some quick matches 🎮",
    emoji: "🌆",
  },
  night: {
    icon: <Moon className="w-8 h-8" />,
    title: "Good Night",
    subtitle: "Late night grinder! Respect 🫡",
    emoji: "🌙",
  },
};

const returningMessages = [
  { min: 2, max: 3, msg: "Welcome back, warrior! We missed you! 💎" },
  { min: 4, max: 7, msg: "Long time no see! Your rewards are piling up! 🎁" },
  { min: 8, max: 999, msg: "The legend returns! 🏆 Let's get back on track!" },
];

const WelcomeGreeting = ({ username, currentStreak, lastLoginDate }: WelcomeGreetingProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const key = `welcome_shown_${new Date().toISOString().split("T")[0]}`;
    if (sessionStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem(key, "1");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const timeOfDay = getTimeOfDay();
  const greeting = greetings[timeOfDay];
  const daysSince = getDaysSinceLastLogin(lastLoginDate);
  const returningMsg = returningMessages.find(r => daysSince >= r.min && daysSince <= r.max);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShow(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl overflow-hidden"
          >
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-primary via-[hsl(var(--neon-purple))] to-primary animate-[glow_3s_ease-in-out_infinite]">
              <div className="w-full h-full rounded-2xl bg-background" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 text-center space-y-4">
              {/* Close */}
              <button
                onClick={() => setShow(false)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Time emoji with glow */}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="text-5xl"
              >
                {greeting.emoji}
              </motion.div>

              {/* Greeting text */}
              <div>
                <h2 className="font-display font-bold text-2xl text-gradient-neon">
                  {greeting.title}
                </h2>
                <p className="font-display font-bold text-xl text-foreground mt-1">
                  {username} <span className="text-primary">!</span>
                </p>
              </div>

              {/* Subtitle or returning message */}
              <p className="text-sm text-muted-foreground">
                {returningMsg ? returningMsg.msg : greeting.subtitle}
              </p>

              {/* Streak badge */}
              {currentStreak > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 neon-glow"
                >
                  <Flame className="w-5 h-5 text-destructive" />
                  <span className="font-display font-bold text-foreground">
                    {currentStreak} Day Streak
                  </span>
                  <Flame className="w-5 h-5 text-destructive" />
                </motion.div>
              )}

              {/* Neon particles effect */}
              <div className="flex justify-center gap-1 pt-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => setShow(false)}
                className="w-full py-3 rounded-xl font-display font-bold text-sm gradient-neon text-primary-foreground shadow-neon hover:opacity-90 transition"
              >
                LET'S GO! 🚀
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeGreeting;
