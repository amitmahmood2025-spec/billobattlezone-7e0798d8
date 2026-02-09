import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useTournaments, Tournament } from "@/hooks/useTournaments";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  Clock, 
  Loader2, 
  Gamepad2,
  Coins,
  Banknote,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TournamentsPage = () => {
  const { profile, wallet, refreshWallet } = useProfile();
  const { 
    tournaments, 
    loading, 
    joining, 
    joinTournament, 
    hasJoined 
  } = useTournaments(
    profile?.id,
    wallet?.credits || 0,
    wallet?.cash || 0
  );

  const handleJoin = async (tournament: Tournament, useCredits: boolean) => {
    await joinTournament(tournament, useCredits);
    await refreshWallet();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 animate-pulse">
            🔴 LIVE
          </span>
        );
      case "upcoming":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
            Upcoming
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <DashboardNav />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-display font-bold text-2xl flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Tournaments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Join tournaments and win cash prizes!
          </p>
        </motion.div>

        {/* Balance Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <Coins className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Credits</p>
              <p className="font-display font-bold text-xl text-primary">
                {wallet?.credits?.toFixed(0) || "0"}
              </p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <Banknote className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="font-display font-bold text-xl text-green-400">
                ৳{wallet?.cash?.toFixed(0) || "0"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tournaments List */}
        {loading ? (
          <div className="glass rounded-xl p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-2">Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tournaments available right now</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((tournament, index) => {
              const joined = hasJoined(tournament.id);
              const isJoining = joining === tournament.id;
              const canPayWithCredits = 
                tournament.entry_fee_type !== "cash" && 
                (wallet?.credits || 0) >= tournament.entry_fee;
              const canPayWithCash = 
                tournament.entry_fee_type !== "credits" && 
                (wallet?.cash || 0) >= tournament.entry_fee;

              return (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-xl p-5 space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg">{tournament.title}</h3>
                        <p className="text-sm text-muted-foreground">{tournament.game_type}</p>
                      </div>
                    </div>
                    {getStatusBadge(tournament.status)}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="glass rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Entry Fee</p>
                      <p className="font-display font-bold text-primary">
                        {tournament.entry_fee_type === "cash" ? "৳" : ""}
                        {tournament.entry_fee}
                        {tournament.entry_fee_type === "credits" && " Credits"}
                      </p>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Prize Pool</p>
                      <p className="font-display font-bold text-yellow-400">
                        ৳{tournament.prize_pool}
                      </p>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Players</p>
                      <p className="font-display font-bold">
                        {tournament.current_participants}
                        {tournament.max_participants && `/${tournament.max_participants}`}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {tournament.description && (
                    <p className="text-sm text-muted-foreground">{tournament.description}</p>
                  )}

                  {/* Start Time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {tournament.status === "live" 
                      ? "In Progress" 
                      : `Starts: ${format(new Date(tournament.starts_at), "PPp")}`}
                  </div>

                  {/* Join Buttons */}
                  {joined ? (
                    <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 rounded-xl text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Joined</span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {tournament.entry_fee_type !== "cash" && (
                        <Button
                          onClick={() => handleJoin(tournament, true)}
                          disabled={isJoining || !canPayWithCredits}
                          className="flex-1"
                          variant={canPayWithCredits ? "default" : "secondary"}
                        >
                          {isJoining ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Coins className="w-4 h-4 mr-2" />
                              Pay with Credits
                            </>
                          )}
                        </Button>
                      )}
                      {tournament.entry_fee_type !== "credits" && (
                        <Button
                          onClick={() => handleJoin(tournament, false)}
                          disabled={isJoining || !canPayWithCash}
                          className="flex-1"
                          variant={canPayWithCash ? "default" : "secondary"}
                        >
                          {isJoining ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Banknote className="w-4 h-4 mr-2" />
                              Pay ৳{tournament.entry_fee}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default TournamentsPage;
