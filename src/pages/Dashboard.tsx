import DashboardNav from "@/components/dashboard/DashboardNav";
import WalletCard from "@/components/dashboard/WalletCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { useProfile } from "@/hooks/useProfile";
import { motion } from "framer-motion";
import { Flame, Loader2 } from "lucide-react";

const Dashboard = () => {
  const { profile, wallet, streak, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <DashboardNav />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
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

        {/* Recent Activity placeholder */}
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
