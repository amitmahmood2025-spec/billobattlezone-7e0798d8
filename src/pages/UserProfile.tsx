import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { getGameImage } from "@/lib/gameImages";
import DashboardNav from "@/components/dashboard/DashboardNav";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";
import {
  Trophy, Target, Swords, Crown, Flame, Medal, TrendingUp,
  Loader2, Gamepad2, Award, Calendar, Coins,
} from "lucide-react";

interface UserStats {
  totalTournamentsJoined: number;
  totalWins: number;
  totalPrizeWon: number;
  totalTasksClaimed: number;
  totalCreditsEarned: number;
  gameBreakdown: Record<string, { joined: number; wins: number; prize: number }>;
}

const UserProfile = () => {
  const { profile, wallet, streak, loading } = useProfile();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchStats = async () => {
      setStatsLoading(true);

      // Tournament entries
      const { data: entries } = await supabase
        .from("tournament_entries")
        .select("*, tournaments(game_type, title)")
        .eq("profile_id", profile.id);

      // Task claims
      const { data: claims } = await supabase
        .from("task_claims")
        .select("credits_earned")
        .eq("profile_id", profile.id);

      const totalTournamentsJoined = entries?.length || 0;
      const totalWins = entries?.filter((e) => e.placement === 1).length || 0;
      const totalPrizeWon = entries?.reduce((s, e) => s + (e.prize_won || 0), 0) || 0;
      const totalTasksClaimed = claims?.length || 0;
      const totalCreditsEarned = claims?.reduce((s, c) => s + (c.credits_earned || 0), 0) || 0;

      // Game breakdown
      const gameBreakdown: Record<string, { joined: number; wins: number; prize: number }> = {};
      (entries || []).forEach((e: any) => {
        const game = e.tournaments?.game_type || "Unknown";
        if (!gameBreakdown[game]) gameBreakdown[game] = { joined: 0, wins: 0, prize: 0 };
        gameBreakdown[game].joined++;
        if (e.placement === 1) gameBreakdown[game].wins++;
        gameBreakdown[game].prize += e.prize_won || 0;
      });

      setStats({ totalTournamentsJoined, totalWins, totalPrizeWon, totalTasksClaimed, totalCreditsEarned, gameBreakdown });
      setStatsLoading(false);
    };

    fetchStats();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Tournaments", value: stats?.totalTournamentsJoined || 0, icon: Trophy, color: "text-yellow-400" },
    { label: "Wins", value: stats?.totalWins || 0, icon: Crown, color: "text-green-400" },
    { label: "Prize Won", value: `৳${stats?.totalPrizeWon || 0}`, icon: Award, color: "text-primary" },
    { label: "Tasks Done", value: stats?.totalTasksClaimed || 0, icon: Target, color: "text-purple-400" },
    { label: "Credits Earned", value: stats?.totalCreditsEarned || 0, icon: Coins, color: "text-primary" },
    { label: "Win Rate", value: stats && stats.totalTournamentsJoined > 0
      ? `${Math.round((stats.totalWins / stats.totalTournamentsJoined) * 100)}%`
      : "0%", icon: TrendingUp, color: "text-green-400" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEO title="My Profile" description="View your gaming stats, wins, and tournament history on Billo Battle Zone." />
      <DashboardNav />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-neon-purple/10" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3 neon-glow">
              <span className="text-3xl font-display font-bold text-primary-foreground">
                {(profile?.username || "P")[0].toUpperCase()}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground neon-text">
              {profile?.username || "Player"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{profile?.email || ""}</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5">
                <Flame className="w-4 h-4 text-destructive" />
                <span className="text-sm font-display font-bold">{streak?.current_streak || 0} Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-xl p-4 text-center hover:neon-glow transition-all"
            >
              <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
              <p className="font-display font-bold text-xl text-foreground">
                {statsLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <AdSlot slot="profile-mid" format="horizontal" />

        {/* Game-wise Breakdown */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" /> Game Statistics
          </h2>
          {statsLoading ? (
            <div className="glass rounded-xl p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          ) : stats && Object.keys(stats.gameBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.gameBreakdown).map(([game, data], i) => (
                <motion.div
                  key={game}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={getGameImage(game).thumb} alt={game} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-semibold">{game}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Swords className="w-3 h-3" /> {data.joined} Matches</span>
                      <span className="flex items-center gap-1"><Medal className="w-3 h-3 text-yellow-400" /> {data.wins} Wins</span>
                      <span className="flex items-center gap-1"><Award className="w-3 h-3 text-green-400" /> ৳{data.prize}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-primary text-lg">
                      {data.joined > 0 ? Math.round((data.wins / data.joined) * 100) : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Win Rate</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-8 text-center">
              <Gamepad2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No game data yet. Join tournaments to see stats!</p>
            </div>
          )}
        </div>

        {/* Wallet Summary */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3">Wallet</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">Credits</p>
              <p className="font-display font-bold text-2xl text-primary">{wallet?.credits?.toFixed(0) || 0}</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="font-display font-bold text-2xl text-green-400">৳{wallet?.cash?.toFixed(0) || 0}</p>
            </div>
          </div>
        </div>

        <AdSlot slot="profile-bottom" format="horizontal" />
      </main>
    </div>
  );
};

export default UserProfile;
