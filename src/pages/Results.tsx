import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";
import { getGameImage } from "@/lib/gameImages";
import {
  Trophy, Medal, Crown, Loader2, Gamepad2, CalendarDays,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderEntry {
  profile_id: string;
  username: string;
  wins: number;
  prize: number;
  matches: number;
}

const GAMES = ["Free Fire", "PUBG", "Ludo"];

const ResultsPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [selectedGame, setSelectedGame] = useState("Free Fire");
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Completed tournaments
      const { data: tournaments } = await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "completed")
        .order("ends_at", { ascending: false })
        .limit(50);

      setCompletedTournaments(tournaments || []);

      // Get entries for leaderboard calculation
      const now = new Date();
      const start = new Date();
      if (period === "weekly") start.setDate(now.getDate() - 7);
      else start.setMonth(now.getMonth() - 1);

      const { data: entries } = await supabase
        .from("tournament_entries")
        .select("profile_id, placement, prize_won, fee_paid, tournaments(game_type, ends_at, title)")
        .gte("joined_at", start.toISOString());

      // Aggregate by profile for selected game
      const map: Record<string, LeaderEntry> = {};
      (entries || []).forEach((e: any) => {
        const gt = e.tournaments?.game_type || "";
        if (!gt.toLowerCase().includes(selectedGame.toLowerCase())) return;
        if (!map[e.profile_id]) {
          map[e.profile_id] = { profile_id: e.profile_id, username: "", wins: 0, prize: 0, matches: 0 };
        }
        map[e.profile_id].matches++;
        if (e.placement === 1) map[e.profile_id].wins++;
        map[e.profile_id].prize += e.prize_won || 0;
      });

      // Get usernames
      const ids = Object.keys(map);
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", ids);

        (profiles || []).forEach((p) => {
          if (map[p.id]) map[p.id].username = p.username || "Player";
        });
      }

      const sorted = Object.values(map).sort((a, b) => b.wins - a.wins || b.prize - a.prize);
      setLeaderboard(sorted.slice(0, 20));
      setLoading(false);
    };

    fetchData();
  }, [period, selectedGame]);

  const medalIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-xs text-muted-foreground font-display font-bold">#{rank + 1}</span>;
  };

  const gameTournaments = completedTournaments.filter(
    (t) => t.game_type?.toLowerCase().includes(selectedGame.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEO title="Results & Leaderboard" description="View match results and top players on Billo Battle Zone." />
      <DashboardNav />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display font-bold text-2xl flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" /> Results & Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Check match results and top performing players!</p>
        </motion.div>

        {/* Game Selector */}
        <div className="flex gap-3 justify-center">
          {GAMES.map((game) => {
            const img = getGameImage(game);
            return (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`relative rounded-xl overflow-hidden w-24 h-16 transition-all ${
                  selectedGame === game ? "ring-2 ring-primary neon-glow" : "opacity-60 hover:opacity-90"
                }`}
              >
                <img src={img.thumb} alt={game} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="font-display font-bold text-[10px] text-foreground">{game.toUpperCase()}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Period Tabs */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass">
            <TabsTrigger value="weekly" className="font-display">
              <CalendarDays className="w-4 h-4 mr-1" /> Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="font-display">
              <CalendarDays className="w-4 h-4 mr-1" /> Monthly
            </TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="mt-4">
            {loading ? (
              <div className="glass rounded-xl p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-2">Loading leaderboard...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top Players */}
                <div>
                  <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-400" /> Top Players — {selectedGame}
                  </h2>
                  {leaderboard.length > 0 ? (
                    <div className="space-y-2">
                      {leaderboard.map((entry, i) => (
                        <motion.div
                          key={entry.profile_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`glass rounded-xl p-4 flex items-center gap-3 ${
                            i < 3 ? "neon-border" : ""
                          }`}
                        >
                          <div className="w-8 flex justify-center">{medalIcon(i)}</div>
                          <div className="flex-1">
                            <p className="font-display font-semibold text-sm">{entry.username}</p>
                            <p className="text-xs text-muted-foreground">{entry.matches} matches played</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold text-primary">{entry.wins} Wins</p>
                            <p className="text-xs text-green-400">৳{entry.prize} prize</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass rounded-xl p-8 text-center">
                      <Gamepad2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">No data for this period yet.</p>
                    </div>
                  )}
                </div>

                <AdSlot slot="results-mid" format="horizontal" />

                {/* Recent Completed Matches */}
                <div>
                  <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-primary" /> Completed Matches — {selectedGame}
                  </h2>
                  {gameTournaments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {gameTournaments.slice(0, 10).map((t, i) => {
                        const img = getGameImage(t.game_type);
                        return (
                          <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass rounded-xl overflow-hidden"
                          >
                            <div className="h-20 overflow-hidden relative">
                              <img src={img.banner} alt={t.game_type} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                              <span className="absolute bottom-2 left-3 font-display font-bold text-xs text-foreground">
                                {t.title}
                              </span>
                            </div>
                            <div className="p-3 flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">{t.match_type || "Solo"} • {t.map || "Bermuda"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {t.current_participants || 0} players
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-display font-bold text-primary text-sm">৳{t.prize_pool}</p>
                                <p className="text-[10px] text-green-400">Prize Pool</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="glass rounded-xl p-8 text-center">
                      <p className="text-muted-foreground text-sm">No completed matches for {selectedGame} yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AdSlot slot="results-bottom" format="horizontal" />
      </main>
    </div>
  );
};

export default ResultsPage;
