import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, Medal, Star, TrendingUp, Loader2 } from "lucide-react";

interface LeaderboardEntry {
  referrer_id: string;
  count: number;
  username: string | null;
  avatar_url: string | null;
}

const podiumColors = [
  "from-yellow-400/30 to-yellow-600/10 border-yellow-500/40",
  "from-gray-300/20 to-gray-500/10 border-gray-400/30",
  "from-amber-600/20 to-amber-800/10 border-amber-600/30",
];

const rankIcons = ["👑", "🥈", "🥉"];

const ReferralLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: referrals } = await supabase
        .from("referrals")
        .select("referrer_id");

      if (!referrals || referrals.length === 0) {
        setLoading(false);
        return;
      }

      // Count referrals per user
      const countMap: Record<string, number> = {};
      referrals.forEach((r) => {
        countMap[r.referrer_id] = (countMap[r.referrer_id] || 0) + 1;
      });

      // Sort and take top 10
      const sorted = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const ids = sorted.map(([id]) => id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", ids);

      const profileMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
      (profiles || []).forEach((p) => {
        profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
      });

      setLeaders(
        sorted.map(([id, count]) => ({
          referrer_id: id,
          count,
          username: profileMap[id]?.username || null,
          avatar_url: profileMap[id]?.avatar_url || null,
        }))
      );
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Trophy className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No referrals yet. Be the first!</p>
      </div>
    );
  }

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-primary/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">Top Referrers</h3>
          <p className="text-xs text-muted-foreground">Leaderboard • Top 10</p>
        </div>
      </div>

      {/* Podium - Top 3 */}
      <div className="px-5 pb-4">
        <div className="flex items-end justify-center gap-3 py-4">
          {/* 2nd place */}
          {top3[1] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${podiumColors[1]} border-2 flex items-center justify-center font-display font-bold text-lg text-foreground`}>
                  {top3[1].username?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="absolute -top-1 -right-1 text-lg">{rankIcons[1]}</span>
              </div>
              <p className="text-xs font-semibold text-foreground mt-2 max-w-[70px] truncate text-center">{top3[1].username || "User"}</p>
              <p className="text-[10px] text-muted-foreground">{top3[1].count} refs</p>
              <div className="w-16 h-16 bg-gradient-to-t from-gray-400/20 to-gray-400/5 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="font-display font-bold text-lg text-gray-400">2</span>
              </div>
            </motion.div>
          )}

          {/* 1st place */}
          {top3[0] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center -mt-4"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className={`w-18 h-18 w-[72px] h-[72px] rounded-full bg-gradient-to-br ${podiumColors[0]} border-2 flex items-center justify-center font-display font-bold text-xl text-foreground shadow-lg shadow-yellow-500/20`}>
                  {top3[0].username?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="absolute -top-2 -right-1 text-2xl">{rankIcons[0]}</span>
              </motion.div>
              <p className="text-sm font-bold text-foreground mt-2 max-w-[80px] truncate text-center">{top3[0].username || "User"}</p>
              <p className="text-xs text-primary font-semibold">{top3[0].count} refs</p>
              <div className="w-20 h-24 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="font-display font-bold text-2xl text-yellow-400">1</span>
              </div>
            </motion.div>
          )}

          {/* 3rd place */}
          {top3[2] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${podiumColors[2]} border-2 flex items-center justify-center font-display font-bold text-lg text-foreground`}>
                  {top3[2].username?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="absolute -top-1 -right-1 text-lg">{rankIcons[2]}</span>
              </div>
              <p className="text-xs font-semibold text-foreground mt-2 max-w-[70px] truncate text-center">{top3[2].username || "User"}</p>
              <p className="text-[10px] text-muted-foreground">{top3[2].count} refs</p>
              <div className="w-16 h-12 bg-gradient-to-t from-amber-600/20 to-amber-600/5 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="font-display font-bold text-lg text-amber-500">3</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="border-t border-border/20">
          {rest.map((entry, i) => (
            <motion.div
              key={entry.referrer_id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/10 transition-colors border-b border-border/10 last:border-0"
            >
              <span className="w-7 text-center font-display font-bold text-sm text-muted-foreground">
                #{i + 4}
              </span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-neon-purple/20 flex items-center justify-center font-display font-bold text-sm text-primary">
                {entry.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{entry.username || "User"}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-primary" />
                <span className="font-display font-bold text-sm text-primary">{entry.count}</span>
                <span className="text-[10px] text-muted-foreground">refs</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ReferralLeaderboard;
