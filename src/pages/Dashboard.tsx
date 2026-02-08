import DashboardNav from "@/components/dashboard/DashboardNav";
import WalletCard from "@/components/dashboard/WalletCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  // Placeholder data — will be wired to Supabase
  const credits = 150;
  const cash = 0;
  const streak = 3;

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
              Welcome, <span className="text-primary">{user?.displayName || "Player"}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Complete daily tasks to earn free credits!</p>
          </div>
          <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
            <Flame className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="font-display font-bold text-foreground">{streak} Days</p>
            </div>
          </div>
        </motion.div>

        {/* Wallet */}
        <WalletCard credits={credits} cash={cash} />

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
