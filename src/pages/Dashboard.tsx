import { useState, useEffect } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import WalletCard from "@/components/dashboard/WalletCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { useTournaments } from "@/hooks/useTournaments";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Loader2, Trophy, Clock, Sparkles, ArrowRight, Send, ChevronLeft, ChevronRight, Zap, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getGameImage } from "@/lib/gameImages";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";
import WelcomeGreeting from "@/components/WelcomeGreeting";

import freefireBanner from "@/assets/games/freefire-banner.jpg";
import freefireAction from "@/assets/games/freefire-action.jpg";
import pubgBanner from "@/assets/games/pubg-banner.jpg";
import pubgAction from "@/assets/games/pubg-action.jpg";
import ludoBanner from "@/assets/games/ludo-banner.jpg";
import ludoAction from "@/assets/games/ludo-action.jpg";

const heroSlides = [
  { image: freefireBanner, title: "FREE FIRE", subtitle: "Battle Royale Tournaments" },
  { image: pubgBanner, title: "PUBG MOBILE", subtitle: "Competitive Matches" },
  { image: ludoBanner, title: "LUDO KING", subtitle: "Classic Board Game" },
  { image: freefireAction, title: "CLASH SQUAD", subtitle: "Intense 4v4 Action" },
  { image: pubgAction, title: "PUBG TDM", subtitle: "Team Deathmatch" },
  { image: ludoAction, title: "LUDO QUICK", subtitle: "Quick Match Mode" },
];

const Dashboard = () => {
  const { profile, wallet, streak, loading } = useProfile();
  const { tasks, canClaimTask } = useTasks(profile?.id);
  const { tournaments } = useTournaments(profile?.id);
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="w-8 h-8 text-primary icon-glow" />
        </motion.div>
      </div>
    );
  }

  const upcomingTournaments = (tournaments || [])
    .filter((t) => t.status === "upcoming" || t.status === "live")
    .slice(0, 3);

  const availableTasks = tasks.filter((t) => canClaimTask(t)).slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEO title="Dashboard" description="Your Billo Battle Zone dashboard — manage wallet, tasks, and tournaments." />
      <DashboardNav />

      <WelcomeGreeting
        username={profile?.username || "Player"}
        currentStreak={streak?.current_streak || 0}
        lastLoginDate={streak?.last_login_date || null}
      />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Auto-Slide Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden h-44 sm:h-56 group shadow-premium"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img
                src={heroSlides[currentSlide].image}
                alt={heroSlides[currentSlide].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute inset-0 scanlines opacity-20" />
              <div className="absolute bottom-4 left-4">
                <p className="font-display font-bold text-xl sm:text-2xl text-foreground neon-text-strong">
                  {heroSlides[currentSlide].title}
                </p>
                <p className="text-sm text-muted-foreground">{heroSlides[currentSlide].subtitle}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 glass-card rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 glass-card rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </motion.button>

          <div className="absolute bottom-2 right-4 flex gap-1.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentSlide ? "bg-primary w-6 shadow-neon" : "bg-foreground/20 w-1.5"}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Welcome + Streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <h1 className="font-display font-bold text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary icon-glow" />
              Welcome, <span className="text-primary neon-text">{profile?.username || "Player"}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Complete daily tasks to earn free credits!</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 glow-border"
            style={{ borderColor: "hsla(var(--destructive) / 0.3)" }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Flame className="w-5 h-5 text-destructive" style={{ filter: "drop-shadow(0 0 6px hsla(var(--destructive) / 0.6))" }} />
            </motion.div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">STREAK</p>
              <p className="font-display font-bold text-foreground">{streak?.current_streak || 0} Days</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Wallet */}
        <WalletCard credits={wallet?.credits || 0} cash={wallet?.cash || 0} />

        {/* Quick Actions */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary icon-glow" /> Quick Actions
          </h2>
          <QuickActions />
        </div>

        {/* Credit Factory */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ scale: 1.01 }}
          className="relative rounded-2xl overflow-hidden neon-glow group"
        >
          <div className="absolute inset-0 gradient-premium opacity-8 group-hover:opacity-15 transition-opacity" />
          <div className="relative glass-strong rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-12 h-12 rounded-xl gradient-premium flex items-center justify-center shadow-neon-lg"
              >
                <Send className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div>
                <p className="font-display font-bold text-lg flex items-center gap-2">
                  <span className="text-gradient-premium">Credit Factory</span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Exclusive Telegram missions & rewards</p>
              </div>
            </div>
            <a
              href="https://t.me/creditfactory_bot?start=bbz_web"
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-premium text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-display font-bold shadow-neon-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Open Bot
            </a>
          </div>
        </motion.div>

        {/* Available Tasks */}
        {availableTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary icon-glow" /> Available Tasks
              </h2>
              <motion.button
                whileHover={{ x: 4 }}
                onClick={() => navigate("/dashboard/tasks")}
                className="text-sm text-primary flex items-center gap-1 hover:underline font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="glass-card rounded-xl p-4 flex items-center gap-3 hover:neon-glow transition-all cursor-pointer group"
                  onClick={() => navigate("/dashboard/tasks")}
                >
                  <span className="text-2xl">{task.icon || "🎯"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.description?.slice(0, 50)}</p>
                  </div>
                  <div className="text-primary font-display font-bold text-sm neon-text">+{task.reward_credits}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming Tournaments */}
        {upcomingTournaments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary icon-glow" /> Upcoming Tournaments
              </h2>
              <motion.button
                whileHover={{ x: 4 }}
                onClick={() => navigate("/dashboard/tournaments")}
                className="text-sm text-primary flex items-center gap-1 hover:underline font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upcomingTournaments.map((t, i) => {
                const gameImg = getGameImage(t.game_type);
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    className="glass-card rounded-2xl overflow-hidden hover:neon-glow transition-all cursor-pointer group"
                    onClick={() => navigate("/dashboard/tournaments")}
                  >
                    <div className="h-24 overflow-hidden relative">
                      <img src={gameImg.banner} alt={t.game_type} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    </div>
                    <div className="p-3">
                      <p className="font-display font-semibold text-sm truncate group-hover:text-primary transition-colors">{t.title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-primary font-bold neon-text">৳{t.prize_pool}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(t.starts_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <AdSlot slot="dashboard-mid" format="horizontal" />

        {/* Recent Activity */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary icon-glow" /> Recent Activity
          </h2>
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No recent activity yet. Start completing tasks!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
