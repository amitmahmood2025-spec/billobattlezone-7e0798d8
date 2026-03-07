import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { getGameImage } from "@/lib/gameImages";
import DashboardNav from "@/components/dashboard/DashboardNav";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, Target, Swords, Crown, Flame, Medal, TrendingUp,
  Loader2, Gamepad2, Award, Calendar, Coins, Zap, Star, Shield, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface UserStats {
  totalTournamentsJoined: number;
  totalWins: number;
  totalPrizeWon: number;
  totalTasksClaimed: number;
  totalCreditsEarned: number;
  totalKills: number;
  gameBreakdown: Record<string, { joined: number; wins: number; prize: number; kills: number }>;
  recentMatches: Array<{
    id: string;
    tournament_title: string;
    game_type: string;
    placement: number | null;
    kills: number | null;
    prize_won: number | null;
    joined_at: string;
  }>;
}

const getRankInfo = (tournaments: number, wins: number) => {
  const score = tournaments * 10 + wins * 50;
  if (score >= 1000) return { rank: "LEGENDARY", color: "from-yellow-400 to-amber-600", icon: "👑", next: null, progress: 100 };
  if (score >= 500) return { rank: "DIAMOND", color: "from-cyan-400 to-blue-600", icon: "💎", next: "LEGENDARY", progress: (score / 1000) * 100 };
  if (score >= 200) return { rank: "PLATINUM", color: "from-emerald-400 to-teal-600", icon: "⚡", next: "DIAMOND", progress: (score / 500) * 100 };
  if (score >= 50) return { rank: "GOLD", color: "from-yellow-500 to-orange-500", icon: "🏅", next: "PLATINUM", progress: (score / 200) * 100 };
  return { rank: "BRONZE", color: "from-orange-400 to-red-500", icon: "🥉", next: "GOLD", progress: (score / 50) * 100 };
};

const UserProfile = () => {
  const { profile, wallet, streak, loading } = useProfile();
  const { tasks, userTasks } = useTasks(profile?.id);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile?.id) return;

    const fetchStats = async () => {
      setStatsLoading(true);

      const { data: entries } = await supabase
        .from("tournament_entries")
        .select("*, tournaments(game_type, title)")
        .eq("profile_id", profile.id)
        .order("joined_at", { ascending: false });

      const { data: claims } = await supabase
        .from("task_claims")
        .select("credits_earned")
        .eq("profile_id", profile.id);

      const totalTournamentsJoined = entries?.length || 0;
      const totalWins = entries?.filter((e) => e.placement === 1).length || 0;
      const totalPrizeWon = entries?.reduce((s, e) => s + (e.prize_won || 0), 0) || 0;
      const totalKills = entries?.reduce((s, e) => s + (e.kills || 0), 0) || 0;
      const totalTasksClaimed = claims?.length || 0;
      const totalCreditsEarned = claims?.reduce((s, c) => s + (c.credits_earned || 0), 0) || 0;

      const gameBreakdown: Record<string, { joined: number; wins: number; prize: number; kills: number }> = {};
      (entries || []).forEach((e: any) => {
        const game = e.tournaments?.game_type || "Unknown";
        if (!gameBreakdown[game]) gameBreakdown[game] = { joined: 0, wins: 0, prize: 0, kills: 0 };
        gameBreakdown[game].joined++;
        if (e.placement === 1) gameBreakdown[game].wins++;
        gameBreakdown[game].prize += e.prize_won || 0;
        gameBreakdown[game].kills += e.kills || 0;
      });

      const recentMatches = (entries || []).slice(0, 5).map((e: any) => ({
        id: e.id,
        tournament_title: e.tournaments?.title || "Tournament",
        game_type: e.tournaments?.game_type || "Unknown",
        placement: e.placement,
        kills: e.kills,
        prize_won: e.prize_won,
        joined_at: e.joined_at,
      }));

      setStats({ totalTournamentsJoined, totalWins, totalPrizeWon, totalTasksClaimed, totalCreditsEarned, totalKills, gameBreakdown, recentMatches });
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

  const rankInfo = getRankInfo(stats?.totalTournamentsJoined || 0, stats?.totalWins || 0);

  const completedTasksCount = Object.values(userTasks).filter(ut => ut.is_claimed).length;
  const totalTasksCount = tasks.length;
  const missionProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const statCards = [
    { label: "Tournaments", value: stats?.totalTournamentsJoined || 0, icon: Trophy, color: "text-yellow-400" },
    { label: "Wins", value: stats?.totalWins || 0, icon: Crown, color: "text-green-400" },
    { label: "Total Kills", value: stats?.totalKills || 0, icon: Swords, color: "text-red-400" },
    { label: "Prize Won", value: `৳${stats?.totalPrizeWon || 0}`, icon: Award, color: "text-primary" },
    { label: "Tasks Done", value: stats?.totalTasksClaimed || 0, icon: Target, color: "text-purple-400" },
    { label: "Win Rate", value: stats && stats.totalTournamentsJoined > 0 ? `${Math.round((stats.totalWins / stats.totalTournamentsJoined) * 100)}%` : "0%", icon: TrendingUp, color: "text-green-400" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEO title="My Profile" description="View your gaming stats, wins, and tournament history on Billo Battle Zone." />
      <DashboardNav />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header with Rank */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-neon-purple/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--neon-blue)/0.15),transparent_70%)]" />
          <div className="relative glass-strong rounded-2xl p-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative">
                <motion.div
                  animate={{ boxShadow: ["0 0 20px hsl(var(--primary)/0.3)", "0 0 40px hsl(var(--primary)/0.5)", "0 0 20px hsl(var(--primary)/0.3)"] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                >
                  <span className="text-3xl font-display font-bold text-primary-foreground">
                    {(profile?.username || "P")[0].toUpperCase()}
                  </span>
                </motion.div>
                <span className="absolute -bottom-1 -right-1 text-xl">{rankInfo.icon}</span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="font-display font-bold text-2xl text-foreground neon-text">
                  {profile?.username || "Player"}
                </h1>
                <p className="text-sm text-muted-foreground">{profile?.email || ""}</p>

                {/* Rank Badge */}
                <div className="mt-2 flex items-center gap-3">
                  <span className={`bg-gradient-to-r ${rankInfo.color} text-white text-xs font-display font-bold px-3 py-1 rounded-lg shadow-lg`}>
                    {rankInfo.rank}
                  </span>
                  <div className="flex items-center gap-1.5 glass rounded-lg px-2.5 py-1">
                    <Flame className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-xs font-display font-bold">{streak?.current_streak || 0}🔥</span>
                  </div>
                  <div className="flex items-center gap-1.5 glass rounded-lg px-2.5 py-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {profile?.created_at ? format(new Date(profile.created_at), "MMM yyyy") : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rank Progress */}
            {rankInfo.next && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Rank Progress</span>
                  <span className="text-primary font-bold">→ {rankInfo.next}</span>
                </div>
                <div className="relative h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${rankInfo.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(rankInfo.progress, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-3.5 text-center hover:neon-glow transition-all border border-neon-blue/10"
            >
              <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color}`} />
              <p className="font-display font-bold text-lg text-foreground">
                {statsLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : s.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Mission Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl p-5 border border-neon-blue/10"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Mission Progress
            </h2>
            <button onClick={() => navigate("/dashboard/tasks")} className="text-xs text-primary flex items-center gap-1 hover:underline">
              View Tasks <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-muted/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" />
                <motion.path
                  className="stroke-primary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${missionProgress}, 100` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-sm text-primary">
                {missionProgress}%
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Daily Tasks</span>
                <span className="font-bold text-foreground">{completedTasksCount}/{totalTasksCount}</span>
              </div>
              <Progress value={missionProgress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">
                {missionProgress >= 100 ? "🎉 All missions complete!" : `Complete ${totalTasksCount - completedTasksCount} more tasks to finish!`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Wallet Summary */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-4 border border-primary/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <Coins className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Credits</p>
            <p className="font-display font-bold text-2xl text-primary">{wallet?.credits?.toFixed(0) || 0}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-4 border border-green-500/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <Award className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-xs text-muted-foreground">Cash</p>
            <p className="font-display font-bold text-2xl text-green-400">৳{wallet?.cash?.toFixed(0) || 0}</p>
          </motion.div>
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
              {Object.entries(stats.gameBreakdown).map(([game, data], i) => {
                const winRate = data.joined > 0 ? Math.round((data.wins / data.joined) * 100) : 0;
                return (
                  <motion.div
                    key={game}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass rounded-xl p-4 border border-neon-blue/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-neon-blue/20">
                        <img src={getGameImage(game).thumb} alt={game} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm">{game}</p>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          <div className="text-center">
                            <p className="font-display font-bold text-foreground text-sm">{data.joined}</p>
                            <p className="text-[9px] text-muted-foreground">Matches</p>
                          </div>
                          <div className="text-center">
                            <p className="font-display font-bold text-yellow-400 text-sm">{data.wins}</p>
                            <p className="text-[9px] text-muted-foreground">Wins</p>
                          </div>
                          <div className="text-center">
                            <p className="font-display font-bold text-red-400 text-sm">{data.kills}</p>
                            <p className="text-[9px] text-muted-foreground">Kills</p>
                          </div>
                          <div className="text-center">
                            <p className="font-display font-bold text-primary text-sm">{winRate}%</p>
                            <p className="text-[9px] text-muted-foreground">Win Rate</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={winRate} className="h-1" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="glass rounded-xl p-8 text-center border border-neon-blue/10">
              <Gamepad2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No game data yet. Join tournaments to see stats!</p>
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" /> Recent Matches
          </h2>
          {statsLoading ? (
            <div className="glass rounded-xl p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          ) : stats && stats.recentMatches.length > 0 ? (
            <div className="space-y-2">
              {stats.recentMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-3.5 flex items-center gap-3 border border-neon-blue/10"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={getGameImage(match.game_type).thumb} alt={match.game_type} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{match.tournament_title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(match.joined_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {match.placement && (
                      <span className={`font-display font-bold ${match.placement === 1 ? "text-yellow-400" : "text-muted-foreground"}`}>
                        #{match.placement}
                      </span>
                    )}
                    {match.kills !== null && match.kills > 0 && (
                      <span className="text-red-400 font-bold flex items-center gap-0.5">
                        <Swords className="w-3 h-3" />{match.kills}
                      </span>
                    )}
                    {match.prize_won !== null && match.prize_won > 0 && (
                      <span className="text-green-400 font-bold">৳{match.prize_won}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-8 text-center border border-neon-blue/10">
              <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">No match history yet</p>
            </div>
          )}
        </div>

        <AdSlot slot="profile-bottom" format="horizontal" />
      </main>
    </div>
  );
};

export default UserProfile;
