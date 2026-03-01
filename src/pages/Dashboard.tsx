import DashboardNav from "@/components/dashboard/DashboardNav";
import WalletCard from "@/components/dashboard/WalletCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { useTournaments } from "@/hooks/useTournaments";
import { motion } from "framer-motion";
import { Flame, Loader2, Trophy, Clock, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getGameImage } from "@/lib/gameImages";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";

const Dashboard = () => {
  const { profile, wallet, streak, loading } = useProfile();
  const { tasks, userTasks, canClaimTask } = useTasks(profile?.id);
  const { tournaments } = useTournaments(profile?.id);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome + Streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5 flex items-center justify-between"
        >
          <div>
            <h1 className="font-display font-bold text-xl">
              Welcome, <span className="text-primary">{profile?.username || "Player"}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Complete daily tasks to earn free credits!</p>
          </div>
          <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
            <Flame className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="font-display font-bold text-foreground">{streak?.current_streak || 0} Days</p>
            </div>
          </div>
        </motion.div>

        {/* Wallet */}
        <WalletCard credits={wallet?.credits || 0} cash={wallet?.cash || 0} />

        {/* Quick Actions */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3">Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Available Tasks Preview */}
        {availableTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Available Tasks
              </h2>
              <button onClick={() => navigate("/dashboard/tasks")} className="text-sm text-primary flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableTasks.map((task) => (
                <div key={task.id} className="glass rounded-xl p-4 flex items-center gap-3 hover:neon-glow transition-all cursor-pointer" onClick={() => navigate("/dashboard/tasks")}>
                  <span className="text-2xl">{task.icon || "🎯"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.description?.slice(0, 50)}</p>
                  </div>
                  <div className="text-primary font-display font-bold text-sm">+{task.reward_credits}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming Tournaments */}
        {upcomingTournaments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> Upcoming Tournaments
              </h2>
              <button onClick={() => navigate("/dashboard/tournaments")} className="text-sm text-primary flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upcomingTournaments.map((t) => {
                const gameImg = getGameImage(t.game_type);
                return (
                  <div key={t.id} className="glass rounded-xl overflow-hidden hover:neon-glow transition-all cursor-pointer group" onClick={() => navigate("/dashboard/tournaments")}>
                    <div className="h-24 overflow-hidden">
                      <img src={gameImg.banner} alt={t.game_type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-3">
                      <p className="font-display font-semibold text-sm truncate">{t.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-primary font-bold">৳{t.prize_pool}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(t.starts_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Ad Slot */}
        <AdSlot slot="dashboard-mid" format="horizontal" />

        {/* Recent Activity */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3">Recent Activity</h2>
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No recent activity yet. Start completing tasks!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
